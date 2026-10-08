// Runs every few minutes in GitHub Actions (.github/workflows/status.yml).
// Checks each target once, folds the result into status.json, writes it back.
// The workflow commits that file to the `status-data` branch and /status reads
// it straight off raw.githubusercontent.com. No server of ours involved, which
// is the point: a status page that runs on the thing it's reporting on goes
// dark exactly when people come looking.
//
// Node targets come from the STATUS_TARGETS secret, never from this repo. The
// repo is public and those are origin IPs; publishing them hands anyone a way
// around the DDoS scrubbing. Format:
//   dallas=1.2.3.4:22;ashburn=5.6.7.8:22
// Only the label before "=" ever reaches status.json.
//
// Usage: node scripts/status-check.mjs <path/to/status.json>

import net from "node:net";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = process.argv[2] ?? "status.json";
const DAYS_KEPT = 90;
const TIMEOUT_MS = 5000;

// Public endpoints are fine to keep in the open; they're on the site already.
const HTTP_TARGETS = [
  { id: "panel", url: "https://panel.lumixsolutions.org" },
  { id: "billing", url: "https://billing.lumixsolutions.org" },
];

function parseTcpTargets(raw = "") {
  return raw
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, hostPort] = entry.split("=");
      const [host, port] = (hostPort ?? "").split(":");
      if (!id || !host || !port) throw new Error(`bad STATUS_TARGETS entry for "${id ?? "?"}"`);
      return { id: id.trim(), host: host.trim(), port: Number(port) };
    });
}

function tcpCheck({ host, port }) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = net.connect({ host, port });
    const done = (up) => {
      sock.destroy();
      resolve({ up, ms: up ? Date.now() - started : null });
    };
    sock.setTimeout(TIMEOUT_MS, () => done(false));
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
  });
}

async function httpCheck({ url }) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) });
    // A redirect to a login page is up. A 5xx is down.
    return { up: res.status < 500, ms: Date.now() - started };
  } catch {
    return { up: false, ms: null };
  }
}

// One retry before calling it down. GitHub's runners have the odd network
// hiccup of their own and a single dropped SYN isn't an outage.
async function check(target) {
  const run = target.url ? () => httpCheck(target) : () => tcpCheck(target);
  const first = await run();
  return first.up ? first : run();
}

function load() {
  if (!existsSync(FILE)) return { updated: null, targets: {}, outages: [] };
  return JSON.parse(readFileSync(FILE, "utf8"));
}

function fold(state, id, result, now) {
  const day = now.toISOString().slice(0, 10);
  const t = (state.targets[id] ??= { days: {}, current: null });
  const bucket = (t.days[day] ??= [0, 0]); // [up checks, total checks]
  bucket[1] += 1;
  if (result.up) bucket[0] += 1;

  const wasUp = t.current?.up ?? true;
  t.current = { up: result.up, ms: result.ms, at: now.toISOString() };

  // Outages are runs of failed checks. Open one on the first failure, close it
  // on the first success after.
  if (!result.up && wasUp) state.outages.push({ id, start: now.toISOString(), end: null });
  if (result.up && !wasUp) {
    const open = state.outages.findLast((o) => o.id === id && o.end === null);
    if (open) open.end = now.toISOString();
  }

  const cutoff = new Date(now.getTime() - DAYS_KEPT * 864e5).toISOString().slice(0, 10);
  for (const d of Object.keys(t.days)) if (d < cutoff) delete t.days[d];
}

const tcp = parseTcpTargets(process.env.STATUS_TARGETS);
if (tcp.length === 0) console.warn("STATUS_TARGETS is empty, only checking the panel and billing");

const state = load();
const now = new Date();
const targets = [...tcp, ...HTTP_TARGETS];
const results = await Promise.all(targets.map(check));
targets.forEach((t, i) => fold(state, t.id, results[i], now));

const cutoff = new Date(now.getTime() - DAYS_KEPT * 864e5).toISOString();
state.outages = state.outages.filter((o) => o.end === null || o.end >= cutoff);
state.updated = now.toISOString();

writeFileSync(FILE, JSON.stringify(state) + "\n");
// Labels and up/down only. Never print host:port, Actions logs are public too.
console.log(targets.map((t, i) => `${t.id}: ${results[i].up ? "up" : "DOWN"}`).join(", "));
