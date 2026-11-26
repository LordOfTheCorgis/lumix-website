"use strict";
// one generic editor. a TAB says what a dataset's fields look like, the rest
// (cards, add/remove/reorder, save, errors) is shared. no framework: state is
// one object, structural changes re-render, typing just updates state

const $ = (s) => document.querySelector(s);

function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k === "value" || k === "checked" || k === "readOnly") e[k] = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}

// dotted paths so "offer.code" works. clearing a field deletes the key (the
// schemas treat missing as "not set"), and an emptied parent goes with it
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v, drop) {
  const ks = p.split(".");
  const last = ks.pop();
  const chain = [[null, null, o]];
  let cur = o;
  for (const k of ks) {
    if (drop && cur[k] === undefined) return;
    cur[k] ??= {};
    chain.push([cur, k, cur[k]]);
    cur = cur[k];
  }
  if (drop) delete cur[last];
  else cur[last] = v;
  for (let i = chain.length - 1; i > 0; i--) {
    const [parent, key, obj] = chain[i];
    if (!Object.keys(obj).length) delete parent[key];
  }
}

const lines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

const TABS = {
  locations: {
    label: "Regions",
    list: true,
    blank: () => ({ city: "", region: "", lat: 0, lng: 0, soldOut: true, whmcsId: undefined }),
    title: (r) => r.city || "New region",
    sub: (r) => [r.region, r.whmcsId ? `WHMCS id ${r.whmcsId}` : ""].filter(Boolean).join(" / "),
    // the whole reason this exists, so it sits in the card header
    switchKey: "soldOut",
    fields: [
      { key: "city", label: "City" },
      { key: "region", label: "State or region" },
      { key: "whmcsId", label: "WHMCS Server Location id", kind: "num", hint: "Config option 3 value id. Not the Pterodactyl node id." },
      { key: "slug", label: "Slug", hint: "Lowercase, used for /regions#slug" },
      { key: "lat", label: "Latitude", kind: "num" },
      { key: "lng", label: "Longitude", kind: "num" },
      { key: "serves", label: "Who it serves", kind: "area", wide: true },
      { key: "pingUrl", label: "Ping URL", wide: true, hint: "https://node-ip/ . A refused connection still times right." },
      {
        key: "vms", label: "VM names, one per line", kind: "area", wide: true, keepEmpty: false,
        hint: "Names only. IPs stay out of the repo on purpose.",
        get: (r) => (r.vms ?? []).map((v) => v.name).join("\n"),
        set: (r, v) => { const n = lines(v); n.length ? (r.vms = n.map((name) => ({ name, ip: "" }))) : delete r.vms; },
      },
    ],
  },
  partners: {
    label: "Partners",
    list: true,
    blank: () => ({ name: "", mark: "", founder: "", description: "", services: [], discord: "" }),
    title: (p) => p.name || "New partner",
    sub: (p) => (p.offer ? `code ${p.offer.code}` : p.founder || ""),
    fields: [
      { key: "name", label: "Name" },
      { key: "mark", label: "Monogram (1 to 4 letters)", hint: "Shows when there's no logo." },
      { key: "founder", label: "Founder" },
      { key: "logo", label: "Logo", kind: "file", hint: "Files in src/assets/partners. New logos still go in through git." },
      { key: "description", label: "Description", kind: "area", wide: true },
      { key: "services", label: "Services, one per line", kind: "lines", wide: true },
      { key: "note", label: "Note", kind: "area", wide: true, hint: "Hiring, commissions open, whatever they want said." },
      { key: "offer.code", label: "Offer code", hint: "Redeemed at their checkout, not ours." },
      { key: "offer.text", label: "Offer text", hint: "Example: 15% off at checkout" },
      { key: "url", label: "Website" },
      { key: "gallery", label: "Gallery" },
      { key: "discord", label: "Discord invite", wide: true },
    ],
  },
  staff: {
    label: "Staff",
    list: true,
    blank: () => ({ name: "", mark: "", title: "", bio: "", links: [] }),
    title: (p) => p.name || "New person",
    sub: (p) => p.title || "",
    fields: [
      { key: "name", label: "Name" },
      { key: "mark", label: "Monogram (1 to 4 letters)" },
      { key: "title", label: "Title", wide: true },
      { key: "image", label: "Photo", kind: "file", wide: true, hint: "Files in src/assets/staff." },
      { key: "bio", label: "Bio", kind: "area", wide: true },
      {
        key: "links", label: "Links, one per line as: Label | https://url", kind: "area", wide: true,
        hint: "Public stuff only.",
        get: (p) => (p.links ?? []).map((l) => `${l.label} | ${l.href}`).join("\n"),
        set: (p, v) => {
          p.links = lines(v).map((l) => {
            const [label, ...rest] = l.split("|");
            return { label: label.trim(), href: rest.join("|").trim() };
          });
        },
      },
    ],
  },
  settings: {
    label: "Promo and Trustpilot",
    list: false,
    fields: [
      { key: "promo.code", label: "Promo code", hint: "Has to exist in WHMCS with the same string first." },
      { key: "promo.percent", label: "Percent off", kind: "num" },
      { key: "promo.live", label: "Promo is live", kind: "bool" },
      { key: "trust.score", label: "Trustpilot score", kind: "num", nullable: true, hint: "Blank hides the rating. Check it against the real page." },
      { key: "trust.reviews", label: "Review count", kind: "num", nullable: true, hint: "Blank on purpose while the count is small." },
      { key: "trust.url", label: "Trustpilot URL", wide: true },
      { key: "trust.updated", label: "Score last updated", kind: "readonly", hint: "Set for you when the score or count changes." },
    ],
  },
};

const state = { tab: "locations", data: null, orig: null, sha: null, live: null, assets: [], dirty: false, errors: [], open: new Set(), msg: null };

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (r.status === 401) {
    location.href = "/login";
    throw new Error("logged out");
  }
  const body = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, body };
}

async function load(tab) {
  if (state.dirty && !confirm("You have unsaved edits on this tab. Throw them away?")) return;
  state.tab = tab;
  state.errors = [];
  state.msg = null;
  state.open = new Set();
  const { ok, body } = await api(`/api/data/${tab}`);
  if (!ok) {
    state.data = null;
    state.msg = { bad: true, text: body.error ?? "couldn't load that" };
  } else {
    state.data = body.data;
    state.orig = structuredClone(body.data);
    state.sha = body.sha;
    state.live = body.live;
    state.assets = (body.assets ?? []).filter((f) => /\.(webp|png|jpe?g|svg|avif)$/i.test(f));
  }
  state.dirty = false;
  render();
  refreshDeploys();
}

const touch = () => {
  state.dirty = true;
  renderBar();
};

// ---- fields ----
function fieldValue(item, f) {
  if (f.get) return f.get(item);
  const v = getPath(item, f.key);
  if (f.kind === "lines") return (v ?? []).join("\n");
  return v ?? "";
}
function fieldSet(item, f, raw) {
  if (f.set) return f.set(item, raw);
  if (f.kind === "lines") return setPath(item, f.key, lines(raw));
  if (f.kind === "num") {
    if (raw.trim() === "") return f.nullable ? setPath(item, f.key, null) : setPath(item, f.key, undefined, true);
    const n = Number(raw);
    return setPath(item, f.key, Number.isNaN(n) ? raw : n); // junk goes through so the server says so
  }
  if (raw === "") return setPath(item, f.key, undefined, true);
  setPath(item, f.key, raw);
}

function errorsFor(prefix) {
  return state.errors.filter((e) => e.path === prefix || e.path.startsWith(prefix + "."));
}

function field(item, f, prefix) {
  const errs = errorsFor(prefix ? `${prefix}.${f.key}` : f.key);
  const msg = errs.map((e) => e.message).join(" ");
  const v = fieldValue(item, f);
  const wrap = (child) =>
    h("label", { class: "f" + (f.wide ? " wide" : "") }, f.label, child, f.hint && h("div", { class: "hint" }, f.hint), msg && h("div", { class: "msg" }, msg));
  if (f.kind === "bool") {
    return h("label", { class: "check" + (f.wide ? " wide" : "") },
      h("input", { type: "checkbox", checked: Boolean(getPath(item, f.key)), onchange: (e) => { setPath(item, f.key, e.target.checked); touch(); } }), f.label);
  }
  if (f.kind === "readonly") return wrap(h("input", { type: "text", value: String(v), readOnly: true }));
  if (f.kind === "file") {
    const names = state.assets.includes(v) || !v ? state.assets : [v, ...state.assets];
    return wrap(h("select", { onchange: (e) => { fieldSet(item, f, e.target.value); touch(); } },
      h("option", { value: "" }, "None"),
      names.map((n) => h("option", { value: n, selected: n === v }, n))));
  }
  const input = f.kind === "area" || f.kind === "lines"
    ? h("textarea", { value: v, oninput: (e) => { fieldSet(item, f, e.target.value); touch(); } })
    : h("input", { type: "text", value: String(v), inputmode: f.kind === "num" ? "decimal" : null, oninput: (e) => { fieldSet(item, f, e.target.value); touch(); } });
  return wrap(input);
}

// ---- render ----
function render() {
  const tabs = $("#tabs");
  tabs.replaceChildren(...Object.entries(TABS).map(([k, t]) =>
    h("button", { role: "tab", "aria-selected": String(k === state.tab), onclick: () => load(k) }, t.label)));

  const T = TABS[state.tab];
  const list = $("#list");
  list.replaceChildren();
  renderBanner();
  if (!state.data) return renderBar();

  if (!T.list) {
    list.append(h("div", { class: "card" + (state.errors.length ? " err" : "") }, h("div", { class: "body pt" }, T.fields.map((f) => field(state.data, f, "")))));
    return renderBar();
  }

  if (!state.data.length) list.append(h("div", { class: "empty" }, "Nothing here yet."));
  state.data.forEach((item, i) => list.append(card(T, item, i)));
  list.append(h("button", { onclick: () => { state.data.push(T.blank()); state.open.add(state.data.length - 1); touch(); render(); } }, `Add ${T.label.toLowerCase().replace(/s$/, "")}`));
  renderBar();
}

function card(T, item, i) {
  const bad = errorsFor(String(i)).length > 0;
  const sw = T.switchKey && h("button", {
    class: "switch", role: "switch", "aria-checked": String(Boolean(item[T.switchKey])),
    title: "Sold out means no new servers there. Existing ones keep running.",
    onclick: () => { item[T.switchKey] = !item[T.switchKey]; touch(); render(); },
  }, h("span", { class: "knob" }), item[T.switchKey] ? "Sold out" : "Open");
  const move = (d) => () => {
    const j = i + d;
    if (j < 0 || j >= state.data.length) return;
    [state.data[i], state.data[j]] = [state.data[j], state.data[i]];
    state.open = new Set();
    touch();
    render();
  };
  const details = h("details", { open: state.open.has(i) || bad, ontoggle: (e) => (e.target.open ? state.open.add(i) : state.open.delete(i)) },
    h("summary", {}, "Details"),
    h("div", { class: "body" }, T.fields.map((f) => field(item, f, String(i)))));
  return h("div", { class: "card" + (bad ? " err" : "") },
    h("div", { class: "head" },
      h("div", {}, h("div", { class: "title" }, T.title(item)), h("div", { class: "sub" }, T.sub(item))),
      sw,
      h("div", { class: "tools" },
        h("button", { class: "small", "aria-label": "Move up", disabled: i === 0, onclick: move(-1) }, "Up"),
        h("button", { class: "small", "aria-label": "Move down", disabled: i === state.data.length - 1, onclick: move(1) }, "Down"),
        h("button", { class: "small danger", onclick: () => { if (confirm(`Remove ${T.title(item)}?`)) { state.data.splice(i, 1); state.open = new Set(); touch(); render(); } } }, "Remove"))),
    details);
}

function renderBanner() {
  const b = $("#banner");
  b.replaceChildren();
  if (state.msg) b.append(h("div", { class: "banner" + (state.msg.bad ? "" : " ok") }, state.msg.text, state.msg.extra));
  if (state.errors.length) {
    const T = TABS[state.tab];
    const name = (p) => {
      const [first, ...rest] = p.split(".");
      return T.list && /^\d+$/.test(first) ? `${T.title(state.data[+first] ?? {})}: ${rest.join(".")}` : p;
    };
    b.append(h("div", { class: "banner" }, "Nothing was saved. Fix these first:", h("ul", {}, state.errors.map((e) => h("li", {}, `${name(e.path)} (${e.message})`)))));
  }
}

function renderBar() {
  const bar = $("#bar");
  const behind = state.live === "behind";
  const status = $("#status");
  const liveTxt = { same: "Live matches dev.", behind: "Dev is ahead of live. Save and go live to ship it.", missing: "main has no data files yet, going live is off until the refactor ships there." }[state.live] ?? "";
  status.replaceChildren(h("span", {}, h("b", {}, "Saves go to dev. "), liveTxt), h("span", { id: "deploys" }, ""));
  bar.replaceChildren(
    h("button", { disabled: !state.dirty, onclick: () => save(false) }, "Save to dev"),
    h("button", { class: "primary", disabled: !state.dirty && !behind || state.live === "missing", onclick: () => save(true) }, "Save and go live"),
    h("span", { class: "note" }, state.dirty ? "Unsaved edits." : ""));
  paintDeploys();
}

// ---- saving ----
async function save(live) {
  if (live && !confirm("Push this to main? It deploys to lumixsolutions.org in about two minutes.")) return;
  const { status, ok, body } = await api(`/api/data/${state.tab}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: state.data, sha: state.sha, live }),
  });
  state.errors = status === 422 ? body.errors : [];
  if (!ok) {
    state.msg = status === 422 ? null : { bad: true, text: body.error ?? "save failed" + (body.devSaved ? " (dev did save, live didn't)" : "") };
    if (body.devSaved) { state.sha = body.sha; state.live = "behind"; }
    render();
    return;
  }
  const flips = state.tab === "locations" ? soldOutFlips(state.orig, body.data) : [];
  state.data = body.data;
  state.orig = structuredClone(body.data);
  state.sha = body.sha;
  state.live = live ? "same" : state.live === "same" && !body.unchanged ? "behind" : state.live;
  state.dirty = false;
  state.msg = {
    text: body.unchanged && !live ? "Nothing changed." : live ? "Saved to dev and main. Deploys are running." : "Saved to dev. The dev site rebuilds in a minute or two.",
    extra: flips.length ? h("div", {}, `Also set hidden in WHMCS (Server Location option) for: ${flips.join(", ")}. The site can't do that part.`) : null,
  };
  render();
  watchDeploys();
}

function soldOutFlips(before, after) {
  const was = new Map(before.map((r) => [r.city, Boolean(r.soldOut)]));
  return after.filter((r) => was.has(r.city) && was.get(r.city) !== Boolean(r.soldOut)).map((r) => `${r.city} (${r.soldOut ? "hide" : "unhide"})`);
}

// ---- deploy status ----
let deploys = null;
let poll = null;
async function refreshDeploys() {
  const { ok, body } = await api("/api/deploys").catch(() => ({ ok: false }));
  deploys = ok ? body : null;
  paintDeploys();
  return deploys;
}
function paintDeploys() {
  const el = $("#deploys");
  if (!el) return;
  el.replaceChildren();
  if (!deploys) return;
  for (const [branch, run] of Object.entries(deploys)) {
    if (!run) continue;
    const cls = run.status !== "completed" ? "run" : run.conclusion === "success" ? "ok" : "bad";
    const word = run.status !== "completed" ? "building" : run.conclusion === "success" ? "deployed" : "failed";
    el.append(h("span", { class: "dep" }, h("span", { class: "dot " + cls }), `${branch === "main" ? "live" : branch}: `, h("a", { href: run.url, target: "_blank", rel: "noopener" }, word)));
  }
}
function watchDeploys() {
  clearInterval(poll);
  let n = 0;
  poll = setInterval(async () => {
    const d = await refreshDeploys();
    const busy = d && Object.values(d).some((r) => r && r.status !== "completed");
    if (++n > 30 || (!busy && n > 2)) clearInterval(poll);
  }, 8000);
  setTimeout(refreshDeploys, 2500);
}

window.addEventListener("beforeunload", (e) => {
  if (state.dirty) e.preventDefault();
});

(async () => {
  const { body } = await api("/api/me");
  $("#who").textContent = body.user ? `Signed in as ${body.user}` : "";
  load("locations");
})();
