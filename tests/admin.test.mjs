// the admin can push to main, which deploys, so the parts that guard that get
// tests. the real public/admin/index.php runs under php's built-in server and
// talks to a fake GitHub (a node http server holding two "branches"), so what's
// checked is the actual code path: login, lockout, validation, commit, go live.
// skipped if php isn't installed (ubuntu CI runners have it)
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { createServer as netServer } from "node:net";
import { pbkdf2Sync, randomBytes, createHash } from "node:crypto";
import { DATASETS, locationsSchema } from "../src/lib/schemas.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url)); // not .pathname, this folder has a space in it
const DATA = Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, d.file]));

test("every data file passes its own schema", () => {
  for (const [name, ds] of Object.entries(DATASETS)) {
    const r = ds.schema.safeParse(JSON.parse(readFileSync(join(repo, ds.file), "utf8")));
    assert.ok(r.success, `${name}: ${r.error?.issues[0]?.path.join(".")} ${r.error?.issues[0]?.message}`);
  }
});

test("zod refuses the things that would hurt", () => {
  const base = { city: "X", region: "Y", lat: 1, lng: 2 };
  const bad = (rows) => !locationsSchema.safeParse(rows).success;
  assert.ok(bad([{ ...base, vms: [{ name: "a", ip: "10.0.0.1" }] }]), "vm ip must stay blank");
  assert.ok(bad([{ ...base, whmcsId: 3 }, { ...base, city: "Z", whmcsId: 3 }]), "duplicate whmcsId");
  assert.ok(bad([{ ...base, pingUrl: "not a url" }]));
  assert.ok(bad([{ ...base, lat: 91 }]));
  assert.ok(!bad([{ ...base, whmcsId: 3 }]));
});

const hasPhp = spawnSync("php", ["-v"]).status === 0;
const PW = "a long enough password";
const hashFor = (pw) => {
  const salt = randomBytes(16);
  return `pbkdf2$1000$${salt.toString("hex")}$${pbkdf2Sync(pw, salt, 1000, 32, "sha256").toString("hex")}`;
};

// ---- fake github ----
function fakeGithub() {
  const sha = (s) => createHash("sha1").update(s).digest("hex");
  const branches = { dev: new Map(), main: new Map() };
  const dirs = {};
  for (const f of Object.values(DATA)) {
    const content = readFileSync(join(repo, f), "utf8");
    for (const b of Object.values(branches)) b.set(f, { content, sha: sha(content) });
  }
  for (const d of ["src/assets/partners", "src/assets/staff"]) dirs[d] = readdirSync(join(repo, d));
  const commits = [];
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    const m = u.pathname.match(/^\/repos\/o\/r\/(contents\/(.+)|actions\/runs)$/);
    const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (!m) return send(404, { message: "nope" });
    if (!m[2]) return send(200, { workflow_runs: [] });
    const path = decodeURIComponent(m[2]);
    if (req.method === "GET") {
      if (dirs[path]) return send(200, dirs[path].map((name) => ({ type: "file", name })));
      const f = branches[u.searchParams.get("ref")]?.get(path);
      if (!f) return send(404, { message: "Not Found" });
      return send(200, { sha: f.sha, content: Buffer.from(f.content).toString("base64").replace(/(.{60})/g, "$1\n") });
    }
    let body = "";
    for await (const c of req) body += c;
    const { branch, content, sha: prev, message } = JSON.parse(body);
    const cur = branches[branch]?.get(path);
    if (!cur || cur.sha !== prev) return send(409, { message: "sha does not match" });
    const text = Buffer.from(content, "base64").toString("utf8");
    branches[branch].set(path, { content: text, sha: sha(text) });
    commits.push({ branch, path, message });
    send(200, { content: { sha: sha(text) } });
  });
  return { server, branches, commits };
}

const freePort = () => new Promise((r) => { const s = netServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });

const rig = hasPhp ? await (async () => {
  const gh = fakeGithub();
  await new Promise((r) => gh.server.listen(0, "127.0.0.1", r));
  const tmp = mkdtempSync(join(tmpdir(), "lumix-admin-"));
  writeFileSync(join(tmp, "config.php"), `<?php return [
    'users' => ['evan' => '${hashFor(PW)}', 'locky' => '${hashFor(PW)}', 'plain' => 'a plain text password'],
    'github_token' => 't', 'repo' => 'o/r', 'github_api' => 'http://127.0.0.1:${gh.server.address().port}',
    'state_dir' => '${join(tmp, "state")}',
  ];`);
  const port = await freePort();
  const php = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", join(repo, "public")], { env: { ...process.env, LUMIX_ADMIN_CONFIG: join(tmp, "config.php") }, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/admin/index.php`;
  for (let i = 0; i < 50; i++) {
    try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  after(() => { php.kill(); gh.server.close(); rmSync(tmp, { recursive: true, force: true }); });
  return { gh, base };
})() : null;

const T = { skip: !hasPhp && "php not installed" };

async function login(user = "evan", password = PW) {
  const r = await fetch(rig.base + "?x=login", { method: "POST", redirect: "manual", body: new URLSearchParams({ user, password }) });
  return { r, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] };
}
const api = (cookie) => ({
  get: async (name) => (await fetch(`${rig.base}?x=data&name=${name}`, { headers: { cookie } })).json(),
  post: (name, body, extra = {}) => fetch(`${rig.base}?x=data&name=${name}`, { method: "POST", headers: { cookie, "Content-Type": "application/json", ...extra }, body: JSON.stringify(body) }),
});

test("login: walls, wrong password, lockout, logout", T, async () => {
  assert.equal((await fetch(`${rig.base}?x=data&name=locations`)).status, 401);
  const page = await fetch(rig.base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Sign in/);

  const wrong = await login("evan", "nope nope nope");
  assert.match(wrong.r.headers.get("location"), /e=1/);

  for (let i = 0; i < 5; i++) await login("locky", "wrong password!!");
  const locked = await login("locky"); // right password, still refused
  assert.match(locked.r.headers.get("location"), /e=locked/);
  // php hands out an anonymous session cookie either way, what matters is it isn't logged in
  assert.equal((await fetch(`${rig.base}?x=data&name=locations`, { headers: { cookie: locked.cookie } })).status, 401);

  // the config can hold a plain password instead of a hash
  assert.ok((await login("plain", "a plain text password")).r.headers.get("location").endsWith("/admin/"));
  assert.match((await login("plain", "a plain text passwor")).r.headers.get("location"), /e=1/);

  const { cookie } = await login();
  assert.ok(cookie.startsWith("lxadmin="));
  assert.equal((await api(cookie).get("locations")).live, "same");
  await fetch(rig.base + "?x=logout", { method: "POST", headers: { cookie }, redirect: "manual" });
  assert.equal((await fetch(`${rig.base}?x=data&name=locations`, { headers: { cookie } })).status, 401);
});

test("saving the data as it stands changes nothing, for every file", T, async () => {
  // proves the php validator accepts everything zod accepts today AND that php's
  // json formatting matches the files byte for byte (or the first save is a whole-file diff)
  const { cookie } = await login();
  const a = api(cookie);
  for (const name of Object.keys(DATA)) {
    const g = await a.get(name);
    const r = await a.post(name, { data: g.data, sha: g.sha });
    const out = await r.json();
    assert.equal(r.status, 200, `${name}: ${JSON.stringify(out)}`);
    assert.equal(out.unchanged, true, `${name} would be rewritten on save`);
  }
  assert.equal(rig.gh.commits.length, 0);
});

test("saving: bad data is refused, a toggle is one commit, go live writes main", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);
  const first = await a.get("locations");

  // csrf-ish: foreign origin is refused
  assert.equal((await a.post("locations", { data: first.data, sha: first.sha }, { origin: "http://evil.example" })).status, 403);

  // each of these must 422 and touch nothing
  const mutate = (fn) => { const d = structuredClone(first.data); fn(d); return d; };
  const bads = {
    "1.vms.0.ip": mutate((d) => { d[1].vms = [{ name: "gm-srv-02", ip: "1.2.3.4" }]; }),
    "0.pingUrl": mutate((d) => { d[0].pingUrl = "not a url"; }),
    "0.lat": mutate((d) => { d[0].lat = 91; }),
    "0.nope": mutate((d) => { d[0].nope = 1; }),
    "1.whmcsId": mutate((d) => { d[1].whmcsId = d[0].whmcsId; }),
    "0.city": mutate((d) => { d[0].city = ""; }),
  };
  for (const [path, data] of Object.entries(bads)) {
    const r = await a.post("locations", { data, sha: first.sha });
    assert.equal(r.status, 422, path);
    assert.ok((await r.json()).errors.some((e) => e.path === path), `expected an error at ${path}`);
  }
  assert.equal(rig.gh.commits.length, 0);

  // toggle to dev only: one commit, one-field diff, order kept, live now behind
  const next = structuredClone(first.data);
  next.find((r) => r.city === "Ashburn").soldOut = true;
  const ok = await a.post("locations", { data: next, sha: first.sha });
  assert.equal(ok.status, 200);
  assert.deepEqual(rig.gh.commits.map((c) => [c.branch, c.message]), [["dev", "Ashburn sold out (admin, evan)"]]);
  assert.equal(rig.gh.branches.dev.get(DATA.locations).content, JSON.stringify(next, null, 2) + "\n");
  assert.equal((await a.get("locations")).live, "behind");

  // stale sha = somebody else saved first
  assert.equal((await a.post("locations", { data: next, sha: first.sha })).status, 409);

  // go live writes the second branch too
  const cur = await a.get("locations");
  assert.equal((await a.post("locations", { data: cur.data, sha: cur.sha, live: true })).status, 200);
  assert.equal(rig.gh.commits.at(-1).branch, "main");
  assert.equal((await a.get("locations")).live, "same");

  // main without the data files: refuse instead of littering
  rig.gh.branches.main.delete(DATA.locations);
  const cur2 = await a.get("locations");
  assert.equal(cur2.live, "missing");
  assert.equal((await a.post("locations", { data: cur2.data, sha: cur2.sha, live: true })).status, 409);
});

test("a logo filename that doesn't exist is refused, the trust date stamps itself", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);

  const p = await a.get("partners");
  p.data[0].logo = "does-not-exist.webp";
  const bad = await a.post("partners", { data: p.data, sha: p.sha });
  assert.equal(bad.status, 422);
  assert.equal((await bad.json()).errors[0].path, "0.logo");

  const s = await a.get("settings");
  s.data.trust.score = 4.1;
  const r = await a.post("settings", { data: s.data, sha: s.sha });
  const out = await r.json();
  assert.equal(r.status, 200);
  assert.match(out.data.trust.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(out.data.trust.updated, "2026-10-19");
});
