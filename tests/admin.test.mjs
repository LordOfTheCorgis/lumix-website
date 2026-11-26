// the admin can push to main, which deploys, so the parts that guard that get
// tests: the schemas against the real data files, login, lockout, and a full
// save/go-live round trip against a throwaway copy of the repo's data
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, cpSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATASETS, locationsSchema } from "../src/lib/schemas.mjs";
import { hashPassword, verifyPassword, checkLogin, makeLimiter } from "../admin/auth.mjs";
import { fsStore } from "../admin/store.mjs";
import { createApp } from "../admin/server.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url)); // not .pathname, this folder has a space in it

test("every data file passes its own schema", () => {
  for (const [name, ds] of Object.entries(DATASETS)) {
    const r = ds.schema.safeParse(JSON.parse(readFileSync(join(repo, ds.file), "utf8")));
    assert.ok(r.success, `${name}: ${r.error?.issues[0]?.path.join(".")} ${r.error?.issues[0]?.message}`);
  }
});

test("schemas refuse the things that would hurt", () => {
  const base = { city: "X", region: "Y", lat: 1, lng: 2 };
  const bad = (rows) => !locationsSchema.safeParse(rows).success;
  assert.ok(bad([{ ...base, vms: [{ name: "a", ip: "10.0.0.1" }] }]), "vm ip must stay blank");
  assert.ok(bad([{ ...base, whmcsId: 3 }, { ...base, city: "Z", whmcsId: 3 }]), "duplicate whmcsId");
  assert.ok(bad([{ ...base, pingUrl: "not a url" }]));
  assert.ok(bad([{ ...base, lat: 91 }]));
  assert.ok(!bad([{ ...base, whmcsId: 3 }]));
});

test("passwords and lockout", () => {
  const h = hashPassword("correct horse battery");
  assert.ok(verifyPassword("correct horse battery", h));
  assert.ok(!verifyPassword("wrong", h));
  assert.ok(!verifyPassword("x", "garbage"));
  assert.ok(!checkLogin({ evan: h }, "nobody", "correct horse battery"));
  assert.ok(checkLogin({ evan: h }, "evan", "correct horse battery"));
  let t = 0;
  const lim = makeLimiter({ max: 3, lockMs: 1000, now: () => t });
  for (let i = 0; i < 3; i++) lim.fail("1.1.1.1");
  assert.ok(lim.locked("1.1.1.1"));
  assert.ok(!lim.locked("2.2.2.2"));
  t = 1001;
  assert.ok(!lim.locked("1.1.1.1"));
});

// dev and "main" are two folders so going live is a real second write
function rig() {
  const mk = () => {
    const d = mkdtempSync(join(tmpdir(), "lumix-admin-"));
    cpSync(join(repo, "src/data"), join(d, "src/data"), { recursive: true });
    mkdirSync(join(d, "src/assets/partners"), { recursive: true });
    return d;
  };
  const devDir = mk();
  const liveDir = mk();
  const dev = fsStore(devDir);
  const live = fsStore(liveDir);
  const store = {
    read: (b, p) => (b === "main" ? live : dev).read(b, p),
    write: (b, p, c, s, m) => (b === "main" ? live : dev).write(b, p, c, s, m),
    list: (b, d) => dev.list(b, d),
    lastRun: async () => null,
  };
  const server = createApp({ store, users: { evan: hashPassword("a long enough password") } });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({ base, devDir, liveDir, close: () => { server.close(); rmSync(devDir, { recursive: true }); rmSync(liveDir, { recursive: true }); } });
    }),
  );
}

async function login(base, password = "a long enough password") {
  const r = await fetch(base + "/login", { method: "POST", redirect: "manual", body: new URLSearchParams({ user: "evan", password }) });
  return { r, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] };
}

test("admin api: auth, validation, conflict, dev save, go live", async (t) => {
  const { base, devDir, liveDir, close } = await rig();
  t.after(close);

  assert.equal((await fetch(base + "/api/data/locations")).status, 401);
  assert.equal((await fetch(base + "/", { redirect: "manual" })).status, 303);
  const miss = await login(base, "nope");
  assert.match(miss.r.headers.get("location"), /e=1/);

  const { cookie } = await login(base);
  assert.ok(cookie.startsWith("sid="));
  const H = { cookie, "Content-Type": "application/json" };
  const get = async () => (await fetch(base + "/api/data/locations", { headers: { cookie } })).json();
  const put = (body, extra = {}) => fetch(base + "/api/data/locations", { method: "PUT", headers: { ...H, ...extra }, body: JSON.stringify(body) });

  const first = await get();
  assert.equal(first.live, "same");
  const ashburn = first.data.find((r) => r.city === "Ashburn");
  assert.ok(!ashburn.soldOut);

  // csrf-ish: foreign origin is refused
  assert.equal((await put({ data: first.data, sha: first.sha }, { origin: "http://evil.example" })).status, 403);

  // bad data never touches the file
  const broken = structuredClone(first.data);
  broken[1].vms = [{ name: "gm-srv-02", ip: "1.2.3.4" }];
  const rej = await put({ data: broken, sha: first.sha });
  assert.equal(rej.status, 422);
  assert.match((await rej.json()).errors[0].path, /^1\.vms\.0\.ip$/);

  // toggle to dev only: one-field diff, live stays behind
  const next = structuredClone(first.data);
  next.find((r) => r.city === "Ashburn").soldOut = true;
  const ok = await put({ data: next, sha: first.sha });
  assert.equal(ok.status, 200);
  const saved = JSON.parse(readFileSync(join(devDir, "src/data/locations.json"), "utf8"));
  assert.equal(saved.find((r) => r.city === "Ashburn").soldOut, true);
  assert.deepEqual(saved.map((r) => r.city), first.data.map((r) => r.city), "order kept");
  assert.equal((await get()).live, "behind");
  assert.equal(JSON.parse(readFileSync(join(liveDir, "src/data/locations.json"), "utf8")).find((r) => r.city === "Ashburn").soldOut, undefined);

  // stale sha = somebody else saved first
  assert.equal((await put({ data: next, sha: first.sha })).status, 409);

  // go live writes the second branch too
  const cur = await get();
  assert.equal((await put({ data: cur.data, sha: cur.sha, live: true })).status, 200);
  assert.equal((await get()).live, "same");

  // main without the data files: refuse instead of littering
  rmSync(join(liveDir, "src/data/locations.json"));
  const cur2 = await get();
  assert.equal(cur2.live, "missing");
  assert.equal((await put({ data: cur2.data, sha: cur2.sha, live: true })).status, 409);
});

test("changing the trust score stamps the date", async (t) => {
  const { base, close } = await rig();
  t.after(close);
  const { cookie } = await login(base);
  const g = await (await fetch(base + "/api/data/settings", { headers: { cookie } })).json();
  g.data.trust.score = 4.1;
  const r = await fetch(base + "/api/data/settings", { method: "PUT", headers: { cookie, "Content-Type": "application/json" }, body: JSON.stringify({ data: g.data, sha: g.sha }) });
  const out = await r.json();
  assert.equal(r.status, 200);
  assert.match(out.data.trust.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(out.data.trust.updated, "2026-10-19");
});
