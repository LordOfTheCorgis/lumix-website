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
  const days = lastNDays(Number(root?.dataset.days ?? 90));
  const down: string[] = [];
  let firstDay: string | null = null;

  document.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
    const id = row.dataset.row!;
    const t = data.targets[id];
    const state = row.querySelector<HTMLElement>("[data-state]");
    const pct = row.querySelector<HTMLElement>("[data-pct]");
    if (!t) {
      if (state) state.textContent = "No data yet";
      return;
    }

    const bars = Array.from(row.querySelectorAll<HTMLElement>("[data-bars] span"));
    let up = 0;
    let total = 0;
    days.forEach((d, i) => {
      const b = t.days[d];
      if (!b) return;
      if (!firstDay || d < firstDay) firstDay = d;
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

load();
// Keep it fresh for anyone who leaves the tab open during an outage.
setInterval(load, 60_000);
