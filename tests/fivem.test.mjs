// the cfg maker is the one thing here a customer copies onto a live server, so
// it gets a test. fivem.ts has no imports, so transpiling it by hand is enough
// and nothing needs a bundler
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync(new URL("../src/lib/fivem.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { DEFAULTS, buildCfg, warnings } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));

const ok = { ...DEFAULTS, licenseKey: "cfxk_abc", dbHost: "db.example.com", dbPass: "hunter2", admins: "license:abc123" };
const stops = (s, field) => warnings(s).filter((w) => w.level === "stop" && w.field === field);
const line = (s, needle) => buildCfg(s).map((l) => l.text).find((t) => t.includes(needle));

test("a clean config has no stops", () => {
  assert.equal(warnings(ok).filter((w) => w.level === "stop").length, 0);
});

test("a double quote in the db password is a stop, not a silent swap", () => {
  assert.equal(stops({ ...ok, dbPass: 'pa"ss' }, "db").length, 1);
});

test("a double quote in the rcon password is a stop", () => {
  assert.equal(stops({ ...ok, rconPassword: 'a"b"cdefghijkl' }, "rconPassword").length, 1);
});

test("; in a key=value password is a stop", () => {
  assert.equal(stops({ ...ok, dbFormat: "kv", dbPass: "ab;cd" }, "db").length, 1);
});

test("enhanced drops a pinned legacy build from the file and says so", () => {
  const s = { ...ok, edition: "enhanced", gameBuild: "3095" };
  assert.equal(line(s, "sv_enforceGameBuild"), undefined);
  assert.equal(stops(s, "gameBuild").length, 1);
});

test("license in the startup tab leaves no sv_licenseKey line", () => {
  assert.equal(line({ ...ok, licenseInStartup: true }, 'sv_licenseKey "'), undefined);
});
