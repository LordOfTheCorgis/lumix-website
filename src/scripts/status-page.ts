// Client half of /status. Fetches status.json off the status-data branch and
// paints it. Shape is whatever scripts/status-check.mjs writes; keep the two
// in step.

interface Target {
  days: Record<string, [number, number]>; // [up checks, total checks]
  current: { up: boolean; ms: number | null; at: string } | null;
}
interface StatusFile {
  updated: string | null;
  targets: Record<string, Target>;
  outages: { id: string; start: string; end: string | null }[];
}

const CHECK_MINUTES = 5;
// Older than this and the checker itself has stalled (GitHub disabled the
// schedule, the secret broke). Saying "all up" off a day-old file would be a
// lie of omission, so say it's stale instead.
const STALE_MINUTES = 30;

const root = document.querySelector<HTMLElement>("[data-status]");
const headline = document.querySelector<HTMLElement>("[data-headline]");
const sub = document.querySelector<HTMLElement>("[data-sub]");
const outagesEl = document.querySelector<HTMLElement>("[data-outages]");

const names: Record<string, string> = {};
document.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
  names[row.dataset.row!] = row.querySelector(".font-medium")?.textContent ?? row.dataset.row!;
});

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(today.getTime() - i * 864e5).toISOString().slice(0, 10));
  return out;
}

function duration(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

function setHeadline(text: string, subText: string) {
  if (headline) headline.innerHTML = `${text}<span class="text-red">.</span>`;
  if (sub) sub.textContent = subText;
}

function paint(data: StatusFile) {
  const window90 = lastNDays(Number(root?.dataset.days ?? 90));
  const down: string[] = [];

  // Bars start at the first day anything was checked, not 90 days back. A
  // strip of "no data" before tracking began read as missing uptime, and
  // painting it green would be claiming checks that never ran. So only real
  // days get a tick; they sit at the right and the row fills leftward. Earliest
  // day across every target so all the rows line up with each other.
  const tracked = new Set(Object.values(data.targets).flatMap((t) => Object.keys(t.days)));
  const firstDay = window90.find((d) => tracked.has(d)) ?? null;
  const days = firstDay ? window90.filter((d) => d >= firstDay) : [];

  const title = document.querySelector<HTMLElement>("[data-window-title]");
  if (title && days.length) title.textContent = days.length === 1 ? "Today" : `Last ${days.length} days`;

  document.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
    const id = row.dataset.row!;
    const t = data.targets[id];
    const state = row.querySelector<HTMLElement>("[data-state]");
    const pct = row.querySelector<HTMLElement>("[data-pct]");
    if (!t) {
      if (state) state.textContent = "No data yet";
      return;
    }

    // Rebuilt every paint rather than reusing the server-rendered 90, so the
    // count always matches the window.
    const strip = row.querySelector<HTMLElement>("[data-bars]");
    const bars = days.map(() => document.createElement("span"));
    if (strip) {
      strip.replaceChildren(...bars);
      // Right-align into the fixed 90 (30 on phones). On a phone the first
      // *visible* span isn't the first child once there are more than 30, so
      // --start-m only matters while there are 30 or fewer.
      strip.style.setProperty("--start", String(91 - days.length));
      strip.style.setProperty("--start-m", String(31 - Math.min(days.length, 30)));
    }
    let up = 0;
    let total = 0;
    days.forEach((d, i) => {
      const b = t.days[d];
      if (!b) return;
      up += b[0];
      total += b[1];
      const failedMinutes = (b[1] - b[0]) * CHECK_MINUTES;
      bars[i].className = failedMinutes === 0 ? "ok" : failedMinutes > 60 ? "bad" : "part";
      bars[i].title = `${d}: ${((100 * b[0]) / b[1]).toFixed(2)}% up`;
    });

    const isUp = t.current?.up ?? true;
    if (!isUp) down.push(names[id]);
    if (state) {
      state.textContent = isUp ? "Up" : "Down";
      state.className = isUp ? "text-paper" : "text-red";
    }
    if (pct && total) pct.textContent = ` · ${((100 * up) / total).toFixed(2)}%`;
  });

  const since = document.querySelector<HTMLElement>("[data-since]");
  if (since && firstDay) since.textContent = `Tracking since ${dayFmt.format(new Date(firstDay))}`;

  const age = data.updated ? (Date.now() - Date.parse(data.updated)) / 60000 : Infinity;
  const checked = data.updated ? `Last checked ${dateFmt.format(new Date(data.updated))}.` : "";
  if (age > STALE_MINUTES) {
    setHeadline("Checks have stalled", `The last result is ${duration(age * 60000)} old, so this page can't vouch for right now. ${checked}`);
  } else if (down.length) {
    setHeadline(`${down.join(" and ")} ${down.length > 1 ? "are" : "is"} down`, `${checked} The outage log below updates the moment it's back.`);
  } else {
    setHeadline("Everything's up", checked);
  }

  if (!outagesEl) return;
  const list = [...data.outages].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 25);
  outagesEl.innerHTML = "";
  if (!list.length) {
    const li = document.createElement("li");
    li.className = "small text-fog";
    li.textContent = firstDay ? `None since ${dayFmt.format(new Date(firstDay))}.` : "None logged.";
    outagesEl.append(li);
    return;
  }
  for (const o of list) {
    const li = document.createElement("li");
    li.className = "border-t border-[var(--edge)] py-4 first:border-t-0 first:pt-0";
    const ongoing = o.end === null;
    const span = (ongoing ? Date.now() : Date.parse(o.end!)) - Date.parse(o.start);
    // textContent, not innerHTML: ids come from a file anyone could PR.
    const name = document.createElement("p");
    name.className = "text-paper";
    name.textContent = `${names[o.id] ?? o.id}${ongoing ? ", ongoing" : ""}`;
    const when = document.createElement("p");
    when.className = "small text-fog mt-1 tabular";
    when.textContent = `${dateFmt.format(new Date(o.start))} · ${ongoing ? "down for" : "lasted"} ${duration(span)}`;
    li.append(name, when);
    outagesEl.append(li);
  }
}

async function load() {
  const url = root?.dataset.url;
  if (!url) return;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    paint((await res.json()) as StatusFile);
  } catch {
    setHeadline("Couldn't load the results", "The status file didn't come back. That's our checker, not necessarily the servers. Try again in a minute.");
    if (outagesEl) outagesEl.innerHTML = "";
  }
}

// ── Incident reports ────────────────────────────────────────────────────
// Hand-written, status/incidents.json on the default branch. Format and
// how-to in status/README.md. Everything in there goes in as textContent:
// it's a file people edit in a browser, so treat it as untrusted.

interface Incident {
  title: string;
  region?: string;
  status: "investigating" | "monitoring" | "resolved";
  started: string;
  resolved?: string | null;
  updates?: { at: string; text: string }[];
}

const STATUS_LABEL: Record<Incident["status"], string> = {
  investigating: "Investigating",
  monitoring: "Fixed, watching it",
  resolved: "Resolved",
};

const reportsEl = document.querySelector<HTMLElement>("[data-reports]");
const activeEl = document.querySelector<HTMLElement>("[data-active]");
const incidentsUrl = document.querySelector<HTMLElement>("[data-incidents-url]")?.dataset.incidentsUrl;

// Skip anything malformed rather than letting one typo blank the list.
function isIncident(x: unknown): x is Incident {
  const i = x as Incident;
  return (
    !!i &&
    typeof i.title === "string" &&
    ["investigating", "monitoring", "resolved"].includes(i.status) &&
    !Number.isNaN(Date.parse(i.started))
  );
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function incidentBlock(i: Incident, compact: boolean): HTMLElement {
  const wrap = el("div", compact ? "border-l-2 border-[var(--color-gold)] pl-4" : "");
  const head = el("p", "text-paper");
  head.textContent = i.title;
  const meta = el(
    "p",
    "small text-fog mt-1 tabular",
    [
      STATUS_LABEL[i.status],
      i.region ? names[i.region] ?? i.region : null,
      dateFmt.format(new Date(i.started)),
      i.resolved ? `lasted ${duration(Date.parse(i.resolved) - Date.parse(i.started))}` : null,
    ]
      .filter(Boolean)
      .join(" · ")
  );
  wrap.append(head, meta);
  const updates = (i.updates ?? []).filter((u) => typeof u?.text === "string" && !Number.isNaN(Date.parse(u.at)));
  for (const u of compact ? updates.slice(0, 1) : updates) {
    const p = el("p", "small text-fog mt-3 max-w-prose");
    const when = el("span", "text-slate tabular", `${dateFmt.format(new Date(u.at))} · `);
    p.append(when, document.createTextNode(u.text));
    wrap.append(p);
  }
  return wrap;
}

async function loadIncidents() {
  if (!incidentsUrl || !reportsEl) return;
  let list: Incident[];
  try {
    const res = await fetch(incidentsUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error("not a list");
    list = raw.filter(isIncident).sort((a, b) => b.started.localeCompare(a.started));
  } catch {
    reportsEl.replaceChildren(el("li", "small text-fog", "Couldn't read the incident reports right now."));
    return;
  }

  const active = list.filter((i) => i.status !== "resolved");
  if (activeEl) {
    activeEl.replaceChildren(...active.map((i) => incidentBlock(i, true)));
    activeEl.hidden = active.length === 0;
  }

  if (!list.length) {
    reportsEl.replaceChildren(el("li", "small text-fog", "Nothing to report."));
    return;
  }
  reportsEl.replaceChildren(
    ...list.slice(0, 20).map((i) => {
      const li = el("li", "border-t border-[var(--edge)] py-6 first:border-t-0 first:pt-0");
      li.append(incidentBlock(i, false));
      return li;
    })
  );
}

function refresh() {
  load();
  loadIncidents();
}

refresh();
// Keep it fresh for anyone who leaves the tab open during an outage.
setInterval(refresh, 60_000);
