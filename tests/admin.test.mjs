// the admin can push to main, which deploys, so the parts that guard that get
// tests. the real public/admin/index.php runs under php's built-in server and
// talks to a fake GitHub (a node http server holding two "branches"), so what's
// checked is the actual code path: login, lockout, validation, commit, go live,
// create, delete, upload. skipped if php isn't installed (ubuntu CI runners have it)
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
const JSON_SETS = Object.keys(DATASETS);
const GAMES = readdirSync(join(repo, "src/content/games")).map((f) => f.replace(".json", ""));
const LEGAL = readdirSync(join(repo, "src/content/legal")).map((f) => f.replace(".md", ""));

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

// ---- fake github: two branches of path -> {content, sha}, real repo files as the starting point ----
function fakeGithub() {
  const sha = (s) => createHash("sha1").update(s).digest("hex");
  const branches = { dev: new Map(), main: new Map() };
  const put = (b, path, content) => branches[b].set(path, { content, sha: sha(content) });
  const seed = (dir, withContent) => {
    for (const f of readdirSync(join(repo, dir))) {
      const content = withContent ? readFileSync(join(repo, dir, f), "utf8") : "x";
      for (const b of Object.keys(branches)) put(b, `${dir}/${f}`, content);
    }
  };
  for (const d of ["src/data", "src/content/games", "src/content/legal"]) seed(d, true);
  for (const d of ["src/assets/partners", "src/assets/staff", "src/assets/games", "src/assets/logos"]) seed(d, false);
  const commits = [];
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    const m = u.pathname.match(/^\/repos\/o\/r\/(contents\/(.+)|actions\/runs)$/);
    const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (!m) return send(404, { message: "nope" });
    if (!m[2]) return send(200, { workflow_runs: [] });
    const path = decodeURIComponent(m[2]);
    if (req.method === "GET") {
      const files = branches[u.searchParams.get("ref")];
      const f = files?.get(path);
      if (f) return send(200, { type: "file", sha: f.sha, content: Buffer.from(f.content, "binary").toString("base64").replace(/(.{60})/g, "$1\n") });
      const kids = [...(files?.keys() ?? [])].filter((k) => k.startsWith(path + "/") && !k.slice(path.length + 1).includes("/"));
      if (kids.length) return send(200, kids.map((k) => ({ type: "file", name: k.slice(path.length + 1) })));
      return send(404, { message: "Not Found" });
    }
    let body = "";
    for await (const c of req) body += c;
    const { branch, content, sha: prev, message } = JSON.parse(body);
    const files = branches[branch];
    const cur = files?.get(path);
    if (req.method === "DELETE") {
      if (!cur || cur.sha !== prev) return send(409, { message: "sha does not match" });
      files.delete(path);
      commits.push({ branch, path, message, deleted: true });
      return send(200, {});
    }
    if (cur && cur.sha !== prev) return send(prev ? 409 : 422, { message: "sha does not match" });
    if (!cur && prev) return send(404, { message: "no such file" });
    const text = Buffer.from(content, "base64").toString("binary");
    put(branch, path, text);
    commits.push({ branch, path, message });
    send(cur ? 200 : 201, { content: { sha: sha(text) } });
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
const q = (name, item) => `?x=data&name=${name}${item ? `&item=${item}` : ""}`;
const api = (cookie) => ({
  get: async (name, item) => (await fetch(rig.base + q(name, item), { headers: { cookie } })).json(),
  post: (name, body, extra = {}, item) => fetch(rig.base + q(name, item), { method: "POST", headers: { cookie, "Content-Type": "application/json", ...extra }, body: JSON.stringify(body) }),
  del: (name, item, body) => fetch(rig.base + `?x=delete&name=${name}&item=${item}`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  upload: (dir, name, bytes, extra = {}) => {
    const fd = new FormData();
    fd.set("file", new Blob([bytes]), name);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    return fetch(rig.base + `?x=upload&dir=${dir}`, { method: "POST", headers: { cookie }, body: fd });
  },
});
const PNG = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from("not really a picture")]);
const lastCommit = () => rig.gh.commits.at(-1);

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

test("saving anything as it stands changes nothing, for every file the admin touches", T, async () => {
  // proves the php rules accept everything the site accepts today AND that php's
  // formatting matches the files byte for byte (or the first save is a whole-file diff)
  const { cookie } = await login();
  const a = api(cookie);
  const same = async (name, item) => {
    const g = await a.get(name, item);
    assert.ok(g.data, `${name} ${item ?? ""}: ${JSON.stringify(g)}`);
    const r = await a.post(name, { data: g.data, sha: g.sha }, {}, item);
    const out = await r.json();
    assert.equal(r.status, 200, `${name} ${item ?? ""}: ${JSON.stringify(out)}`);
    assert.equal(out.unchanged, true, `${name} ${item ?? ""} would be rewritten on save`);
  };
  for (const name of JSON_SETS) await same(name);
  for (const g of GAMES) await same("games", g);
  for (const l of LEGAL) await same("legal", l);
  assert.equal(rig.gh.commits.length, 0);
});

test("folder datasets list their files", T, async () => {
  const { cookie } = await login();
  const games = await api(cookie).get("games");
  assert.deepEqual(games.items, [...GAMES].sort());
  assert.equal(games.create, true);
  assert.equal(games.delete, true);
  assert.ok(games.assets.games.length && games.assets.logos.length);
  const legal = await api(cookie).get("legal");
  assert.deepEqual(legal.items, [...LEGAL].sort());
  assert.equal(legal.delete, false);
});

test("regions: bad data refused, a toggle is one commit, go live writes main", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);
  const first = await a.get("locations");

  // csrf-ish: foreign origin is refused
  assert.equal((await a.post("locations", { data: first.data, sha: first.sha }, { origin: "http://evil.example" })).status, 403);

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

  const next = structuredClone(first.data);
  next.find((r) => r.city === "Ashburn").soldOut = true;
  assert.equal((await a.post("locations", { data: next, sha: first.sha })).status, 200);
  assert.deepEqual(rig.gh.commits.map((c) => [c.branch, c.message]), [["dev", "Ashburn sold out (admin, evan)"]]);
  assert.equal(rig.gh.branches.dev.get("src/data/locations.json").content, JSON.stringify(next, null, 2) + "\n");
  assert.equal((await a.get("locations")).live, "behind");

  // stale sha = somebody else saved first
  assert.equal((await a.post("locations", { data: next, sha: first.sha })).status, 409);

  const cur = await a.get("locations");
  assert.equal((await a.post("locations", { data: cur.data, sha: cur.sha, live: true })).status, 200);
  assert.equal(lastCommit().branch, "main");
  assert.equal((await a.get("locations")).live, "same");

  // main without the data files: refuse instead of littering
  const saved = rig.gh.branches.main.get("src/data/locations.json");
  rig.gh.branches.main.delete("src/data/locations.json");
  const cur2 = await a.get("locations");
  assert.equal(cur2.live, "missing");
  assert.equal((await a.post("locations", { data: cur2.data, sha: cur2.sha, live: true })).status, 409);
  rig.gh.branches.main.set("src/data/locations.json", saved);
});

test("games: edit a price, validate, create, go live, delete", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);
  rig.gh.commits.length = 0;

  const pal = await a.get("games", "palworld");
  const edited = structuredClone(pal.data);
  edited.plans[0].pricing.monthly = 10.49;
  assert.equal((await a.post("games", { data: edited, sha: pal.sha }, {}, "palworld")).status, 200);
  assert.deepEqual(rig.gh.commits.map((c) => [c.branch, c.path, c.message]), [["dev", "src/content/games/palworld.json", "edited games palworld (admin, evan)"]]);
  assert.equal(rig.gh.branches.dev.get("src/content/games/palworld.json").content, JSON.stringify(edited, null, 2) + "\n");

  // the rules the build enforces, enforced before anything is written
  const bad = async (fn, path) => {
    const d = structuredClone((await a.get("games", "palworld")).data);
    fn(d);
    const r = await a.post("games", { data: d, sha: (await a.get("games", "palworld")).sha }, {}, "palworld");
    assert.equal(r.status, 422, path);
    assert.ok((await r.json()).errors.some((e) => e.path === path), `expected an error at ${path}`);
  };
  await bad((d) => { d.accent = "blue"; }, "accent");
  await bad((d) => { d.plans[1].pid = "31"; }, "plans.1.pid");
  await bad((d) => { delete d.plans[0].pricing.monthly; }, "plans.0.pricing.monthly");
  await bad((d) => { d.plans[0].pricing.monthly = 0; }, "plans.0.pricing.monthly");
  await bad((d) => { d.slug = "palworld-two"; }, "slug");
  await bad((d) => { d.image = "../../assets/games/nope.jpg"; }, "image");
  await bad((d) => { d.plans = []; }, "plans");
  await bad((d) => { d.status = "soon"; }, "status");

  // a brand new game, live to both branches
  const fresh = {
    slug: "test-game", label: "Test Game Hosting", shortLabel: "Test", status: "planned", tagline: "t", description: "d",
    logo: "../../assets/logos/rust.svg", image: "../../assets/games/rust.jpg", accent: "#112233", mark: "TG",
  };
  rig.gh.commits.length = 0;
  assert.equal((await a.post("games", { data: fresh, create: true, live: true }, {}, "test-game")).status, 200);
  assert.deepEqual(rig.gh.commits.map((c) => [c.branch, c.message]), [["dev", "added games test-game (admin, evan)"], ["main", "added games test-game (admin, evan)"]]);
  assert.equal((await a.post("games", { data: fresh, create: true }, {}, "test-game")).status, 409, "can't create twice");
  assert.equal((await a.post("games", { data: { ...fresh, slug: "other" }, create: true }, {}, "test-game")).status, 422, "slug must match file");

  // delete from both
  const made = await a.get("games", "test-game");
  const del = await a.del("games", "test-game", { sha: made.sha, live: true });
  assert.equal(del.status, 200);
  assert.ok(!rig.gh.branches.dev.has("src/content/games/test-game.json"));
  assert.ok(!rig.gh.branches.main.has("src/content/games/test-game.json"));
  assert.equal((await a.del("games", "palworld", { sha: "stale" })).status, 409);
  assert.equal((await a.del("locations", "x", { sha: "x" })).status, 405, "only datasets that allow it can be deleted");
  assert.equal((await a.del("legal", "terms", { sha: "x" })).status, 405, "legal pages can not be deleted");
});

test("legal pages: the date moves when the text does", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);
  const t = await a.get("legal", "terms");
  const d = structuredClone(t.data);
  d.body += "\n\nAn extra paragraph.\n";
  const r = await a.post("legal", { data: d, sha: t.sha }, {}, "terms");
  const out = await r.json();
  assert.equal(r.status, 200);
  assert.notEqual(out.data.lastUpdated, t.data.lastUpdated);
  assert.match(out.data.lastUpdated, /^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  const written = rig.gh.branches.dev.get("src/content/legal/terms.md").content;
  assert.ok(written.startsWith(`---\ntitle: ${t.data.title}\n`) && written.endsWith("An extra paragraph.\n"));
});

test("images: upload rules, overwrite guard, and going live copies the file to main", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);

  assert.equal((await a.upload("partners", "evil.exe", Buffer.from("MZ not an image"))).status, 415);
  assert.equal((await a.upload("partners", "x.svg", Buffer.from("<svg xmlns='x'></svg>"))).status, 415, "svg is for logos only");
  assert.equal((await a.upload("logos", "x.svg", Buffer.from("<svg><script>alert(1)</script></svg>"))).status, 415);
  assert.equal((await a.upload("nowhere", "x.png", PNG)).status, 404);
  assert.equal((await a.upload("partners", "big.png", Buffer.concat([PNG, Buffer.alloc(1_000_001)]))).status, 413);

  const up = await a.upload("partners", "New Studio Logo!.png", PNG);
  assert.equal(up.status, 200);
  assert.equal((await up.json()).name, "new-studio-logo.png");
  assert.ok(rig.gh.branches.dev.has("src/assets/partners/new-studio-logo.png"));
  assert.ok(!rig.gh.branches.main.has("src/assets/partners/new-studio-logo.png"), "uploads wait on dev");

  const again = await a.upload("partners", "New Studio Logo!.png", PNG);
  assert.equal(again.status, 409);
  assert.equal((await again.json()).exists, true);
  assert.equal((await a.upload("partners", "New Studio Logo!.png", PNG, { overwrite: "1" })).status, 200);
  assert.ok((await a.get("partners")).assets.partners.includes("new-studio-logo.png"));

  // point a partner at it and go live: the picture has to reach main with the data
  const p = await a.get("partners");
  p.data[0].logo = "new-studio-logo.png";
  assert.equal((await a.post("partners", { data: p.data, sha: p.sha, live: true })).status, 200);
  assert.ok(rig.gh.branches.main.has("src/assets/partners/new-studio-logo.png"));

  // and a logo that isn't there is refused
  const p2 = await a.get("partners");
  p2.data[0].logo = "does-not-exist.webp";
  const bad = await a.post("partners", { data: p2.data, sha: p2.sha });
  assert.equal(bad.status, 422);
  assert.equal((await bad.json()).errors[0].path, "0.logo");
});

test("site, navigation, faq and the trust date", T, async () => {
  const { cookie } = await login();
  const a = api(cookie);

  const nav = await a.get("navigation");
  const typo = structuredClone(nav.data);
  typo.nav[3].href = "@discrod";
  const r = await a.post("navigation", { data: typo, sha: nav.sha });
  assert.equal(r.status, 422);
  assert.equal((await r.json()).errors[0].path, "nav.3.href");
  assert.equal((await a.post("navigation", { data: { ...nav.data, nav: [{ label: "Home", href: "javascript:alert(1)" }] }, sha: nav.sha })).status, 422);

  const site = await a.get("site");
  site.data.botHosting.monthly = 5;
  assert.equal((await a.post("site", { data: site.data, sha: site.sha })).status, 200);
  site.data.links.discord = "not a url";
  assert.equal((await a.post("site", { data: site.data, sha: (await a.get("site")).sha })).status, 422);

  const faq = await a.get("faq");
  faq.data.push({ q: "Do you do refunds?", a: "Case by case." });
  assert.equal((await a.post("faq", { data: faq.data, sha: faq.sha })).status, 200);

  const s = await a.get("settings");
  s.data.trust.score = 4.1;
  const out = await (await a.post("settings", { data: s.data, sha: s.sha })).json();
  assert.match(out.data.trust.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(out.data.trust.updated, "2026-10-19");
});
