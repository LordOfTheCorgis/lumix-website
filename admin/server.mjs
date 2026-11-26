// the admin: login, then forms over src/data/*.json. every save is a git
// commit, so the deploy you already have ships it. no framework, no db.
// run it: node admin/server.mjs   (see admin/README.md)
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { DATASETS } from "../src/lib/schemas.mjs";
import { checkLogin, makeSessions, makeLimiter } from "./auth.mjs";
import { Conflict, githubStore, fsStore } from "./store.mjs";

const STATIC = {
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/app.css": ["app.css", "text/css; charset=utf-8"],
};
const file = (n) => readFileSync(new URL(`./public/${n}`, import.meta.url), "utf8");

// commit message body. location flips are the whole point of this thing so
// they get named, everything else just says what was edited
function summarize(name, before, after) {
  if (name === "locations") {
    const was = new Map(before.map((r) => [r.city, Boolean(r.soldOut)]));
    const bits = [];
    for (const r of after) {
      if (!was.has(r.city)) bits.push(`added ${r.city}`);
      else if (was.get(r.city) !== Boolean(r.soldOut)) bits.push(`${r.city} ${r.soldOut ? "sold out" : "open again"}`);
    }
    if (bits.length) return bits.join(", ");
  }
  return `edited ${name}`;
}

const todayCT = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());

export function createApp({
  store,
  users,
  editBranch = "dev",
  liveBranch = "main",
  secureCookie = false,
  trustProxy = false,
  sessions = makeSessions(),
  limiter = makeLimiter(),
}) {
  const send = (res, status, body, type = "text/html; charset=utf-8", extra = {}) => {
    res.writeHead(status, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      // same-origin, NOT no-referrer: that makes browsers send "Origin: null" on
      // form posts and the csrf check below eats every login
      "Referrer-Policy": "same-origin",
      "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; form-action 'self'",
      ...extra,
    });
    res.end(body);
  };
  const json = (res, status, obj) => send(res, status, JSON.stringify(obj), "application/json", {});
  const redirect = (res, to, extra = {}) => send(res, 303, "", "text/plain", { Location: to, ...extra });

  const cookie = (req, name) =>
    (req.headers.cookie ?? "")
      .split(/;\s*/)
      .map((c) => c.split("="))
      .find(([k]) => k === name)?.[1];
  const ipOf = (req) =>
    (trustProxy && (req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim())) ||
    req.socket.remoteAddress ||
    "?";
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const parts = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > 1_000_000) {
          reject(new Error("body too big"));
          req.destroy();
        } else parts.push(c);
      });
      req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
      req.on("error", reject);
    });

  async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    const isWrite = req.method !== "GET" && req.method !== "HEAD";

    // SameSite=Strict does most of the csrf work, this catches the rest
    if (isWrite && req.headers.origin) {
      let host = "";
      try {
        host = new URL(req.headers.origin).host;
      } catch {}
      if (host !== req.headers.host) return json(res, 403, { error: "bad origin" });
    }

    if (STATIC[path]) return send(res, 200, file(STATIC[path][0]), STATIC[path][1]);

    const sid = cookie(req, "sid");
    const user = sessions.get(sid);

    if (path === "/login" && req.method === "GET") {
      const msg = { 1: "Wrong username or password.", locked: "Too many tries. Wait five minutes." }[url.searchParams.get("e")] ?? "";
      return send(res, 200, file("login.html").replace("<!--msg-->", msg));
    }
    if (path === "/login" && req.method === "POST") {
      const ip = ipOf(req);
      if (limiter.locked(ip)) return redirect(res, "/login?e=locked");
      const form = new URLSearchParams(await readBody(req));
      if (!checkLogin(users, form.get("user") ?? "", form.get("password") ?? "")) {
        limiter.fail(ip);
        return redirect(res, "/login?e=1");
      }
      limiter.ok(ip);
      const id = sessions.create(form.get("user"));
      return redirect(res, "/", {
        "Set-Cookie": `sid=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secureCookie ? "; Secure" : ""}`,
      });
    }
    if (path === "/logout" && req.method === "POST") {
      sessions.destroy(sid);
      return redirect(res, "/login", { "Set-Cookie": "sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
    }

    if (!user) return path.startsWith("/api/") ? json(res, 401, { error: "log in again" }) : redirect(res, "/login");

    if (path === "/" && req.method === "GET") return send(res, 200, file("index.html"));
    if (path === "/api/me") return json(res, 200, { user, editBranch, liveBranch });

    if (path === "/api/deploys") {
      const run = (b) => store.lastRun(b).catch(() => null);
      return json(res, 200, { [editBranch]: await run(editBranch), [liveBranch]: await run(liveBranch) });
    }

    const m = path.match(/^\/api\/data\/(\w+)$/);
    const ds = m && Object.hasOwn(DATASETS, m[1]) ? DATASETS[m[1]] : null;
    if (!ds) return json(res, 404, { error: "not found" });
    const name = m[1];

    if (req.method === "GET") {
      const dev = await store.read(editBranch, ds.file);
      if (!dev) return json(res, 404, { error: `${ds.file} is not on ${editBranch}` });
      const live = await store.read(liveBranch, ds.file);
      return json(res, 200, {
        data: JSON.parse(dev.content),
        sha: dev.sha,
        live: !live ? "missing" : live.content === dev.content ? "same" : "behind",
        assets: ds.assets ? await store.list(editBranch, ds.assets) : null,
      });
    }

    if (req.method === "PUT") {
      if (!String(req.headers["content-type"]).startsWith("application/json")) return json(res, 415, { error: "json only" });
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        return json(res, 400, { error: "bad json" });
      }

      const parsed = ds.schema.safeParse(body.data);
      if (!parsed.success) {
        return json(res, 422, { errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
      }

      const dev = await store.read(editBranch, ds.file);
      if (!dev) return json(res, 404, { error: `${ds.file} is not on ${editBranch}` });
      if (dev.sha !== body.sha) return json(res, 409, { error: "someone saved this since you opened it. reload, then redo your edit" });

      // raw data, not parsed: zod would reorder keys and the first save would
      // turn into a diff of the whole file
      const data = body.data;
      const before = JSON.parse(dev.content);
      if (name === "settings" && (before.trust.score !== data.trust.score || before.trust.reviews !== data.trust.reviews)) {
        data.trust.updated = todayCT(); // the file's own comment says to, nobody remembers
      }
      const content = JSON.stringify(data, null, 2) + "\n";
      const message = `${summarize(name, before, data)} (admin, ${user})`;

      let liveFile = null;
      if (body.live) {
        liveFile = await store.read(liveBranch, ds.file);
        // main without the json refactor reads nothing from this file, writing
        // it there would just be litter
        if (!liveFile) return json(res, 409, { error: `${liveBranch} has no ${ds.file} yet. ship the data refactor there first` });
      }

      let sha = dev.sha;
      try {
        if (content !== dev.content) sha = (await store.write(editBranch, ds.file, content, dev.sha, message)).sha;
        if (liveFile && content !== liveFile.content) await store.write(liveBranch, ds.file, content, liveFile.sha, message);
      } catch (e) {
        const saved = sha !== dev.sha;
        return json(res, e instanceof Conflict ? 409 : 502, { error: e.message, devSaved: saved, sha });
      }
      return json(res, 200, { ok: true, sha, live: Boolean(body.live), data, unchanged: content === dev.content });
    }

    return json(res, 405, { error: "method not allowed" });
  }

  return createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: "server error, check the log" });
    });
  });
}

// run directly: wire real config
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.loadEnvFile(new URL("./.env", import.meta.url));
  } catch {} // no .env is fine if the env is set another way
  const env = process.env;
  let users;
  try {
    users = JSON.parse(readFileSync(new URL("./users.json", import.meta.url), "utf8"));
  } catch {
    console.error("no admin/users.json. make one: node admin/add-user.mjs <name>");
    process.exit(1);
  }
  let store;
  if (env.ADMIN_FS_ROOT) store = fsStore(env.ADMIN_FS_ROOT);
  else if (env.GITHUB_TOKEN && env.GITHUB_REPO) store = githubStore({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO });
  else {
    console.error("set GITHUB_TOKEN + GITHUB_REPO in admin/.env (or ADMIN_FS_ROOT to try it on a local checkout)");
    process.exit(1);
  }
  const port = Number(env.PORT ?? 4322);
  createApp({
    store,
    users,
    editBranch: env.EDIT_BRANCH ?? "dev",
    liveBranch: env.LIVE_BRANCH ?? "main",
    secureCookie: env.COOKIE_SECURE === "1",
    trustProxy: env.TRUST_PROXY === "1",
  }).listen(port, env.HOST ?? "127.0.0.1", () => console.log(`admin on ${env.HOST ?? "127.0.0.1"}:${port}`));
}
