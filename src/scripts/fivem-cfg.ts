// Client half of /tools/fivem-server-cfg. Lived inline in the page until the
// page hit 1,064 lines; nothing here changed in the move, so if it breaks it
// broke in the markup the selectors point at, not here.
//
// All the FiveM knowledge is in src/lib/fivem.ts. This file only reads the
// form, renders the file, and keeps secrets out of localStorage.

import { DEFAULTS, HOSTNAME_COLOURS, buildCfg, warnings, type CfgState } from "../lib/fivem";

const form = document.querySelector<HTMLFormElement>("[data-cfg-form]")!;
const fileEl = document.querySelector<HTMLElement>("[data-file]")!;
const scrollEl = document.querySelector<HTMLElement>("[data-file-scroll]")!;
const lineCount = document.querySelector<HTMLElement>("[data-line-count]")!;
const checkList = document.querySelector<HTMLElement>("[data-check-list]")!;
const checkCount = document.querySelector<HTMLElement>("[data-check-count]")!;
const copyBtn = document.querySelector<HTMLButtonElement>("[data-copy]")!;
const dlBtn = document.querySelector<HTMLButtonElement>("[data-download]")!;
const resetBtn = document.querySelector<HTMLButtonElement>("[data-reset]")!;
const genRcon = document.querySelector<HTMLButtonElement>("[data-gen-rcon]")!;
const dbFields = document.querySelector<HTMLElement>("[data-db-fields]")!;
const dbEndpoint = document.querySelector<HTMLInputElement>("[data-db-endpoint]")!;
const hostPreview = document.querySelector<HTMLElement>("[data-hostname-preview]")!;

const STORE = "lumix:fivem-cfg";
// Never persisted, whatever else is. Shared machines exist.
const SECRET = new Set(["licenseKey", "steamKey", "rconPassword", "dbPass"]);

type Ctl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const controls = () => Array.from(form.elements).filter((e) => (e as Ctl).name) as Ctl[];

function readState(): CfgState {
  const s: Record<string, unknown> = { ...DEFAULTS };
  let enhancedBuild = "";
  for (const el of controls()) {
    const key = el.name;
    if (el instanceof HTMLInputElement && el.type === "checkbox") s[key] = el.checked;
    else if (el instanceof HTMLInputElement && el.type === "radio") { if (el.checked) s[key] = el.value; }
    else if (el instanceof HTMLInputElement && el.type === "number") s[key] = Number(el.value);
    else if (key === "gameBuildEnhanced") enhancedBuild = el.value;
    else s[key] = el.value;
  }
  if (s.edition === "enhanced") s.gameBuild = enhancedBuild;
  return s as unknown as CfgState;
}

function writeState(s: Partial<CfgState>) {
  for (const el of controls()) {
    const key = el.name === "gameBuildEnhanced" ? "gameBuild" : el.name;
    if (!(key in s)) continue;
    const v = (s as Record<string, unknown>)[key];
    if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = Boolean(v);
    else if (el instanceof HTMLInputElement && el.type === "radio") el.checked = el.value === String(v);
    else el.value = String(v ?? "");
  }
}

// ── Rendering ─────────────────────────────────────────────────────────
const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Comment, or command + args with quoted strings picked out. Two tones plus
// dim, on purpose; a third colour for numbers looked like an IDE theme.
function highlight(text: string): string {
  if (text.startsWith("#")) return `<span class="c">${esc(text)}</span>`;
  if (!text) return "";
  const parts = text.split('"');
  let html = "";
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      html += `<span class="s">"${esc(part)}"</span>`;
    } else if (i === 0) {
      const m = part.match(/^(\S+)(.*)$/s);
      if (m) html += `<span class="k">${esc(m[1])}</span><span class="a">${esc(m[2])}</span>`;
      else html += `<span class="a">${esc(part)}</span>`;
    } else {
      html += `<span class="a">${esc(part)}</span>`;
    }
  });
  return html;
}

// ^1Red ^7White, as the server browser draws it. Unknown codes pass through.
function hostnamePreview(raw: string): string {
  if (!raw) return "";
  let colour = "#ffffff";
  let html = "";
  for (const chunk of raw.split(/(\^\d)/)) {
    if (/^\^\d$/.test(chunk)) { colour = HOSTNAME_COLOURS[chunk[1]] ?? colour; continue; }
    if (chunk) html += `<span style="color:${colour}">${esc(chunk)}</span>`;
  }
  return html;
}

let currentText = "";
let hotField: string | null = null;

function render() {
  const s = readState();
  const lines = buildCfg(s);
  currentText = lines.map((l) => l.text).join("\n") + "\n";

  fileEl.innerHTML = lines
    // One wrapper span per line: .line is a grid and every direct child is a
    // cell, so the highlight spans have to be nested or they each get a column.
    .map((l) => `<span class="line"${l.field ? ` data-field="${l.field}"` : ""}><span>${highlight(l.text) || " "}</span></span>`)
    .join("");
  lineCount.textContent = `${lines.length} lines`;

  hostPreview.innerHTML = hostnamePreview(s.hostname.trim() || s.projectName.trim() || "");

  const w = warnings(s);
  const stops = w.filter((x) => x.level === "stop").length;
  checkCount.textContent = w.length
    ? `${stops ? `${stops} will stop the server` : "nothing fatal"} · ${w.length - stops} worth a look`
    : "";
  const mobile = document.querySelector<HTMLElement>("[data-mobile-status]");
  if (mobile) mobile.textContent = `${lines.length} lines · ${stops ? `${stops} stop` : "no stops"}`;
  checkList.innerHTML = w.length
    ? w
        .map(
          (x) =>
            `<li><span class="mark ${x.level}"></span><button type="button" data-goto="${x.field}">${esc(x.text)}</button></li>`
        )
        .join("")
    : `<li><span class="mark"></span><span class="all-clear">All quiet. Copy it.</span></li>`;

  applyHot();
  persist(s);
}

function applyHot() {
  fileEl.querySelectorAll<HTMLElement>(".line[data-hot]").forEach((l) => l.removeAttribute("data-hot"));
  if (!hotField) return;
  const hot = fileEl.querySelectorAll<HTMLElement>(`.line[data-field="${hotField}"]`);
  hot.forEach((l) => l.setAttribute("data-hot", ""));
  const first = hot[0];
  if (!first) return;
  // Scroll the file, not the page. scrollIntoView would drag the whole
  // document around every time you tab to a field.
  const top = first.offsetTop - scrollEl.clientHeight / 2 + first.offsetHeight / 2;
  scrollEl.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Visibility that depends on other fields ───────────────────────────
function syncVisibility() {
  const s = readState();
  form.querySelectorAll<HTMLElement>("[data-edition]").forEach((el) => {
    el.hidden = el.dataset.edition !== s.edition;
  });
  dbFields.classList.toggle("is-off", !s.dbEnabled);
  dbFields.querySelectorAll<Ctl>("input").forEach((i) => (i.tabIndex = s.dbEnabled ? 0 : -1));
  const keyOff = s.licenseInStartup;
  form.querySelector<HTMLInputElement>('[name="licenseKey"]')!.classList.toggle("is-off", keyOff);
}

// ── Persistence ───────────────────────────────────────────────────────
function persist(s: CfgState) {
  try {
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s)) if (!SECRET.has(k)) safe[k] = v;
    localStorage.setItem(STORE, JSON.stringify(safe));
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) writeState(JSON.parse(raw));
  } catch {}
}

// ── Events ────────────────────────────────────────────────────────────
const onChange = (e: Event) => {
  const t = e.target as Ctl;
  if (["edition", "dbEnabled", "licenseInStartup"].includes(t.name)) syncVisibility();
  // vRP wants kv. Flip it once on selection; the user can flip it back and
  // the check will nag them, which is the right amount of nagging.
  if (t.name === "framework" && t.value === "vrp") {
    const kv = form.querySelector<HTMLInputElement>('input[name="dbFormat"][value="kv"]');
    if (kv) kv.checked = true;
  }
  render();
};
form.addEventListener("input", render);
form.addEventListener("change", onChange);

// The Databases tab gives one string, host:port. Split it into the two
// fields the emitter reads. Keep the box's own text as typed.
dbEndpoint.addEventListener("input", () => {
  const m = dbEndpoint.value.trim().match(/^\s*(?:[a-z]+:\/\/)?([^:\/\s]+)(?::(\d{1,5}))?/i);
  if (!m) return;
  form.querySelector<HTMLInputElement>('[name="dbHost"]')!.value = m[1];
  if (m[2]) form.querySelector<HTMLInputElement>('[name="dbPort"]')!.value = m[2];
});

const onFocusIn = (e: Event) => {
  const t = e.target as HTMLElement;
  const f = t.closest<HTMLElement>("[data-field]")?.dataset.field ?? null;
  if (f !== hotField) {
    hotField = f;
    applyHot();
  }
};
form.addEventListener("focusin", onFocusIn);

form.addEventListener("focusout", () => {
  // Let the next focusin win first, otherwise tabbing between fields
  // flickers the marker off and on.
  requestAnimationFrame(() => {
    if (!form.contains(document.activeElement)) {
      hotField = null;
      applyHot();
    }
  });
});

checkList.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
  if (!btn) return;
  // Several controls can share a field (the host radios light the port
  // lines, the Startup-tab box lights the key lines). Land on the one you
  // can type into, and never on something inside a hidden block.
  const visible = Array.from(form.querySelectorAll<Ctl>(`[data-field="${btn.dataset.goto}"]`))
    .filter((el) => !el.closest("[hidden]"));
  const target =
    visible.find((el) => !(el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox"))) ??
    visible[0];
  if (!target) return;
  // Advanced is closed by default and a field inside it can't take focus.
  target.closest("details")?.setAttribute("open", "");
  target.focus();
  target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
});

copyBtn.addEventListener("click", async () => {
  const label = copyBtn.textContent;
  try {
    await navigator.clipboard.writeText(currentText);
    copyBtn.textContent = "Copied";
  } catch {
    copyBtn.textContent = "Select and copy";
    const range = document.createRange();
    range.selectNodeContents(fileEl);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
  }
  setTimeout(() => (copyBtn.textContent = label), 1500);
});

dlBtn.addEventListener("click", () => {
  const blob = new Blob([currentText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "server.cfg";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

genRcon.addEventListener("click", () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const pw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const input = form.querySelector<HTMLInputElement>('[name="rconPassword"]')!;
  input.value = pw;
  input.focus();
  render();
});

resetBtn.addEventListener("click", () => {
  try { localStorage.removeItem(STORE); } catch {}
  writeState(DEFAULTS);
  dbEndpoint.value = "";
  syncVisibility();
  render();
});

restore();
syncVisibility();
render();
