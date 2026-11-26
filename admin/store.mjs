// where the data files actually live. two backends with the same four methods:
// github (the real thing, every save is a commit) and fs (a checkout on disk,
// for trying the admin without a token and for the tests)
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export class Conflict extends Error {}

export function githubStore({ token, repo, fetchImpl = fetch }) {
  const call = async (method, path, body) => {
    const r = await fetchImpl(`https://api.github.com/repos/${repo}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "lumix-admin",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 404) return null;
    if (r.status === 409) throw new Conflict("the file changed on github while you were saving");
    if (!r.ok) throw new Error(`github ${method} ${path}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    return r.json();
  };
  const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
  return {
    async read(branch, path) {
      const j = await call("GET", `contents/${enc(path)}?ref=${encodeURIComponent(branch)}`);
      if (!j || Array.isArray(j)) return null;
      return { content: Buffer.from(j.content, "base64").toString("utf8"), sha: j.sha };
    },
    async write(branch, path, content, sha, message) {
      const j = await call("PUT", `contents/${enc(path)}`, {
        message,
        branch,
        content: Buffer.from(content).toString("base64"),
        ...(sha ? { sha } : {}),
      });
      return { sha: j.content.sha };
    },
    async list(branch, dir) {
      const j = await call("GET", `contents/${enc(dir)}?ref=${encodeURIComponent(branch)}`);
      return Array.isArray(j) ? j.filter((f) => f.type === "file").map((f) => f.name) : [];
    },
    // newest workflow run on a branch, so the page can say "deploying" / "live"
    async lastRun(branch) {
      const j = await call("GET", `actions/runs?branch=${encodeURIComponent(branch)}&per_page=1`);
      const r = j?.workflow_runs?.[0];
      return r ? { status: r.status, conclusion: r.conclusion, url: r.html_url, at: r.created_at } : null;
    },
  };
}

export function fsStore(root) {
  const sha = (s) => createHash("sha1").update(s).digest("hex");
  return {
    async read(_branch, path) {
      const f = join(root, path);
      if (!existsSync(f)) return null;
      const content = readFileSync(f, "utf8");
      return { content, sha: sha(content) };
    },
    async write(_branch, path, content, prev) {
      const f = join(root, path);
      if (existsSync(f) && prev && sha(readFileSync(f, "utf8")) !== prev) throw new Conflict("file changed on disk");
      writeFileSync(f, content);
      return { sha: sha(content) };
    },
    async list(_branch, dir) {
      const d = join(root, dir);
      return existsSync(d) ? readdirSync(d) : [];
    },
    async lastRun() {
      return null;
    },
  };
}
