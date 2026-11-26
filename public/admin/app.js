"use strict";
// one generic editor. a TAB says what a dataset's fields look like, the rest
// (cards, nested lists, add/remove/reorder, uploads, save, errors) is shared.
// no framework: state is one object, structural changes re-render, typing just
// updates state

const $ = (s) => document.querySelector(s);
// the php file that answers every call, set by the page (see app_page() in index.php)
const API = document.currentScript.dataset.api;
const call = (x, extra = "") => `${API}?x=${x}${extra}`;

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
const LINK_HINT = "A path like /games/, a full https:// link, or @name to reuse a link from the Site tab (like @discord).";

// kinds: text (default) area lines num bool select file slug readonly items
// items = a nested list: { key, fields, blank, title, sub, noun }
const TABS = {
  locations: {
    label: "Regions",
    list: true,
    blank: () => ({ city: "", region: "", lat: 0, lng: 0, soldOut: true }),
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
        key: "vms", label: "VM names, one per line", kind: "area", wide: true,
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
      { key: "logo", label: "Logo", kind: "file", dir: "partners", hint: "Transparent background works best." },
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
      { key: "image", label: "Photo", kind: "file", dir: "staff", wide: true, hint: "Any shape, the card crops to 4:5 from the top." },
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
  games: {
    label: "Games",
    items: { noun: "game", blank: (slug) => ({ slug, label: "", shortLabel: "", status: "planned", tagline: "", description: "", logo: "", image: "", accent: "#60a5fa", mark: "" }) },
    fields: [
      { key: "slug", label: "File name (slug)", kind: "slug", hint: "Lowercase and dashes. Can't change once it exists." },
      { key: "label", label: "Page title", hint: "Example: Palworld Server Hosting" },
      { key: "shortLabel", label: "Short name" },
      { key: "status", label: "Status", kind: "select", options: ["live", "beta", "planned"], hint: "Live needs at least one plan. Planned shows dimmed so people can ask." },
      { key: "mark", label: "Monogram (2 to 4 letters)" },
      { key: "accent", label: "Accent color", hint: "Hex like #60a5fa" },
      { key: "tagline", label: "Tagline", kind: "area", wide: true },
      { key: "description", label: "Description", kind: "area", wide: true },
      { key: "image", label: "Cover art", kind: "file", dir: "games", prefix: "../../assets/games/", wide: true, hint: "Under 1 MB. webp, png or jpg." },
      { key: "logo", label: "Logo", kind: "file", dir: "logos", prefix: "../../assets/logos/", wide: true, hint: "webp, png, jpg or svg." },
      { key: "locations", label: "Customer picks a region at checkout", kind: "bool", def: true, hint: "Untick for a game with no Server Location option in WHMCS (BeamMP)." },
      { key: "highlights", label: "Highlights, one per line", kind: "lines", wide: true },
      {
        key: "plans", label: "Plans", kind: "items", noun: "plan", wide: true,
        blank: () => ({ key: "", name: "", popular: false, specs: { vcores: "", ramGb: "", storageGb: "", slots: "Up", databases: "0", backups: "3" }, pricing: {} }),
        title: (p) => p.name || "New plan",
        sub: (p) => [p.pid ? `pid ${p.pid}` : "", p.pricing?.monthly ? `$${p.pricing.monthly}/mo` : ""].filter(Boolean).join(" / "),
        fields: [
          { key: "key", label: "Key", hint: "Short id like starter or standard." },
          { key: "name", label: "Plan name" },
          { key: "pid", label: "WHMCS product id", kind: "num", hint: "A wrong one sells the wrong product." },
          { key: "popular", label: "Mark as the popular plan", kind: "bool" },
          { key: "specs.vcores", label: "vCores", hint: "Text, like 2 or 3.5" },
          { key: "specs.ramGb", label: "RAM (GB)" },
          { key: "specs.storageGb", label: "Storage (GB)" },
          { key: "specs.slots", label: "Slots", hint: "Up = unmetered" },
          { key: "specs.databases", label: "Databases" },
          { key: "specs.backups", label: "Backups" },
          { key: "pricing.monthly", label: "Monthly price", kind: "num", hint: "Display copy. Keep WHMCS in sync by hand." },
          { key: "pricing.quarterly", label: "Quarterly", kind: "num" },
          { key: "pricing.semiannually", label: "Every 6 months", kind: "num" },
          { key: "pricing.annually", label: "Annually", kind: "num" },
          { key: "pricing.biennially", label: "Every 2 years", kind: "num" },
          { key: "pricing.triennially", label: "Every 3 years", kind: "num" },
        ],
      },
    ],
  },
  legal: {
    label: "Legal pages",
    items: { noun: "page", noCreate: true },
    note: "Plain markdown. Saving with new text and the same date moves the date to today, since it's a legal claim. Louisiana counsel has not reviewed Terms sections 7 and 9.",
    fields: [
      { key: "title", label: "Title" },
      { key: "lastUpdated", label: "Last updated", hint: "Moves to today on its own when the text changes." },
      { key: "description", label: "Description", kind: "area", wide: true },
      { key: "body", label: "Page text (markdown)", kind: "area", tall: true, wide: true },
    ],
  },
  faq: {
    label: "FAQ",
    list: true,
    note: "Answers can hold {fullNote} (which regions are full), {promoCode}, {promoPercent}, {botPrice} and {botRuntimes}, so they follow the real data. An answer with {promoCode} says its \"when the promo is off\" text, or drops out, while the promo isn't live.",
    blank: () => ({ q: "", a: "" }),
    title: (x) => x.q || "New question",
    fields: [
      { key: "q", label: "Question", wide: true },
      { key: "a", label: "Answer", kind: "area", wide: true },
      { key: "aOff", label: "Answer while the promo is off (only for answers using {promoCode})", kind: "area", wide: true },
    ],
  },
  site: {
    label: "Site",
    fields: [
      { key: "site.name", label: "Site name" },
      { key: "site.legalName", label: "Legal name" },
      { key: "site.domain", label: "Domain" },
      { key: "site.tagline", label: "Tagline", wide: true },
      { key: "site.description", label: "Description", kind: "area", wide: true },
      { key: "links.billing", label: "Billing / client area" },
      { key: "links.ticket", label: "Open a ticket" },
      { key: "links.panel", label: "Game panel" },
      { key: "links.docs", label: "Docs" },
      { key: "links.careers", label: "Careers" },
      { key: "links.discord", label: "Discord invite", hint: "Used wherever navigation says @discord." },
      { key: "links.email", label: "Support email" },
      { key: "links.x", label: "X" },
      { key: "links.instagram", label: "Instagram" },
      { key: "links.tiktok", label: "TikTok" },
      { key: "links.github", label: "GitHub" },
      { key: "botHosting.monthly", label: "Application hosting, per month ($)", kind: "num", hint: "Display copy. The WHMCS price is separate." },
      { key: "botHosting.pid", label: "Application hosting WHMCS product id", kind: "num" },
      { key: "botHosting.runtimes", label: "Runtimes the copy names, one per line", kind: "lines", wide: true },
      { key: "demoPanel.url", label: "Demo panel URL", nullable: true, wide: true, hint: "Blank hides the 'Look around the panel' buttons." },
      { key: "demoPanel.user", label: "Demo panel user" },
      { key: "demoPanel.password", label: "Demo panel password", hint: "Public on purpose, it's a no-power demo account." },
    ],
  },
  navigation: {
    label: "Navigation",
    fields: [
      { key: "nav", label: "Header links", kind: "items", noun: "link", wide: true, hint: LINK_HINT, blank: () => ({ label: "", href: "" }), title: (x) => x.label || "New link", sub: (x) => x.href, fields: [{ key: "label", label: "Label" }, { key: "href", label: "Link" }] },
      { key: "moreNav", label: "'More' menu", kind: "items", noun: "entry", wide: true, blank: () => ({ label: "", href: "", note: "" }), title: (x) => x.label || "New entry", sub: (x) => x.href, fields: [{ key: "label", label: "Label" }, { key: "href", label: "Link" }, { key: "note", label: "One-line description", wide: true }] },
      {
        key: "footerNav", label: "Footer columns", kind: "items", noun: "column", wide: true, blank: () => ({ heading: "", items: [] }), title: (x) => x.heading || "New column",
        fields: [
          { key: "heading", label: "Heading" },
          { key: "items", label: "Links", kind: "items", noun: "link", wide: true, blank: () => ({ label: "", href: "" }), title: (x) => x.label || "New link", sub: (x) => x.href, fields: [{ key: "label", label: "Label" }, { key: "href", label: "Link" }] },
        ],
      },
      { key: "social", label: "Social icons", kind: "items", noun: "link", wide: true, blank: () => ({ label: "", href: "" }), title: (x) => x.label || "New link", sub: (x) => x.href, fields: [{ key: "label", label: "Label" }, { key: "href", label: "Link" }] },
    ],
  },
  settings: {
    label: "Promo and Trust",
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

const state = {
  tab: "locations", items: null, item: null, isNew: false,
  data: null, orig: null, sha: null, live: null, assets: {},
  dirty: false, errors: [], open: new Set(), msg: null,
};

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (r.status === 401) {
    location.href = location.pathname; // session ran out, the page shows the login
    throw new Error("logged out");
  }
  const body = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, body };
}

const itemQuery = () => `&name=${state.tab}${state.item ? `&item=${state.item}` : ""}`;

// ---- loading ----
async function load(tab, item) {
  if (state.dirty && !confirm("You have unsaved edits here. Throw them away?")) return render();
  state.tab = tab;
  state.errors = [];
  state.msg = null;
  state.open = new Set();
  state.data = null;
  state.isNew = false;
  const T = TABS[tab];
  if (T.items) {
    const { ok, body } = await api(call("data", `&name=${tab}`));
    if (!ok) {
      state.msg = { bad: true, text: body.error ?? "couldn't load that" };
      state.dirty = false;
      return render();
    }
    state.items = body.items;
    state.canDelete = body.delete;
    state.assets = body.assets ?? {};
    state.item = item ?? state.items[0] ?? null;
    state.dirty = false;
    if (state.item) return loadItem();
    return render();
  }
  state.items = null;
  state.item = null;
  await loadData();
}

async function loadItem() {
  const { ok, body } = await api(call("data", itemQuery()));
  if (!ok) state.msg = { bad: true, text: body.error ?? "couldn't load that" };
  else applyLoaded(body);
  state.dirty = false;
  render();
  refreshDeploys();
}

async function loadData() {
  const { ok, body } = await api(call("data", itemQuery()));
  if (!ok) state.msg = { bad: true, text: body.error ?? "couldn't load that" };
  else applyLoaded(body);
  state.dirty = false;
  render();
  refreshDeploys();
}

function applyLoaded(body) {
  state.data = body.data;
  state.orig = structuredClone(body.data);
  state.sha = body.sha;
  state.live = body.live;
  state.assets = { ...state.assets, ...(body.assets ?? {}) };
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
  if (raw === "") return f.nullable ? setPath(item, f.key, null) : setPath(item, f.key, undefined, true);
  setPath(item, f.key, raw);
}

function errorsFor(prefix) {
  return state.errors.filter((e) => e.path === prefix || e.path.startsWith(prefix + "."));
}
const pathOf = (prefix, key) => (prefix ? `${prefix}.${key}` : key);

async function upload(dir, file, overwrite) {
  const fd = new FormData();
  fd.set("file", file);
  if (overwrite) fd.set("overwrite", "1");
  const { status, body } = await api(call("upload", `&dir=${dir}`), { method: "POST", body: fd });
  if (status === 409 && body.exists) return confirm(`${body.name} already exists. Replace it?`) ? upload(dir, file, true) : null;
  if (status !== 200) {
    state.msg = { bad: true, text: body.error ?? "upload failed" };
    renderBanner();
    return null;
  }
  state.assets[dir] = [...new Set([...(state.assets[dir] ?? []), body.name])].sort();
  return body.name;
}

function fileField(item, f, errMsg) {
  const prefix = f.prefix ?? "";
  const stored = getPath(item, f.key) ?? "";
  const cur = stored.startsWith(prefix) ? stored.slice(prefix.length) : stored;
  const names = state.assets[f.dir] ?? [];
  const opts = cur && !names.includes(cur) ? [cur, ...names] : names;
  const choose = (name) => { fieldSet(item, { ...f, kind: "text" }, name ? prefix + name : ""); touch(); };
  const picker = h("input", { type: "file", class: "hidden", accept: ".webp,.png,.jpg,.jpeg" + (f.dir === "logos" ? ",.svg" : "") });
  picker.addEventListener("change", async () => {
    if (!picker.files[0]) return;
    const name = await upload(f.dir, picker.files[0]);
    if (name) { choose(name); render(); }
  });
  return h("label", { class: "f" + (f.wide ? " wide" : "") }, f.label,
    h("div", { class: "filerow" },
      h("select", { onchange: (e) => choose(e.target.value) },
        h("option", { value: "" }, "None"),
        opts.map((n) => h("option", { value: n, selected: n === cur }, n))),
      h("button", { type: "button", class: "small", onclick: () => picker.click() }, "Upload new"),
      picker),
    f.hint && h("div", { class: "hint" }, f.hint),
    errMsg && h("div", { class: "msg" }, errMsg));
}

function field(item, f, prefix) {
  if (f.kind === "items") return repeater(item, f, prefix);
  const errs = errorsFor(pathOf(prefix, f.key));
  const msg = errs.map((e) => e.message).join(" ");
  const v = fieldValue(item, f);
  const cls = "f" + (f.wide ? " wide" : "");
  const wrap = (child) => h("label", { class: cls }, f.label, child, f.hint && h("div", { class: "hint" }, f.hint), msg && h("div", { class: "msg" }, msg));
  if (f.kind === "bool") {
    const val = getPath(item, f.key) ?? f.def ?? false;
    return h("label", { class: "check" + (f.wide ? " wide" : "") },
      h("input", { type: "checkbox", checked: Boolean(val), onchange: (e) => { setPath(item, f.key, e.target.checked); touch(); } }), f.label,
      f.hint && h("span", { class: "hint inline" }, f.hint));
  }
  if (f.kind === "readonly") return wrap(h("input", { type: "text", value: String(v), readOnly: true }));
  if (f.kind === "slug" && !state.isNew) return wrap(h("input", { type: "text", value: String(v), readOnly: true }));
  if (f.kind === "file") return fileField(item, f, msg);
  if (f.kind === "select") {
    return wrap(h("select", { onchange: (e) => { fieldSet(item, f, e.target.value); touch(); } },
      f.options.map((o) => h("option", { value: o, selected: o === v }, o))));
  }
  const input = f.kind === "area" || f.kind === "lines"
    ? h("textarea", { class: f.tall ? "tall" : "", value: v, oninput: (e) => { fieldSet(item, f, e.target.value); touch(); } })
    : h("input", {
        type: "text", value: String(v), inputmode: f.kind === "num" ? "decimal" : null,
        oninput: (e) => {
          // the slug is the file name: keep it to what the server will accept as you type
          if (f.kind === "slug") { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); state.item = e.target.value; }
          fieldSet(item, f, e.target.value);
          touch();
        },
      });
  return wrap(input);
}

// a nested list inside an object (plans, footer columns, ...)
function repeater(parent, f, prefix) {
  const base = pathOf(prefix, f.key);
  const arr = getPath(parent, f.key) ?? [];
  const errs = errorsFor(base);
  return h("div", { class: "wide rep" },
    h("div", { class: "rep-title" }, f.label, f.hint && h("span", { class: "hint inline" }, f.hint)),
    arr.map((it, i) => card(f, it, i, arr, `${base}.${i}`, false)),
    errs.length && !arr.length ? h("div", { class: "msg" }, errs.map((e) => e.message).join(" ")) : null,
    h("button", { type: "button", class: "small", onclick: () => {
      const list = getPath(parent, f.key) ?? [];
      list.push(f.blank());
      setPath(parent, f.key, list);
      touch();
      render();
    } }, `Add ${f.noun}`));
}

// one entry of a list. opts = a TAB (top-level list) or an items field (nested)
function card(opts, item, i, arr, prefix, collapsible) {
  const bad = errorsFor(prefix).length > 0;
  const sw = opts.switchKey && h("button", {
    class: "switch", role: "switch", "aria-checked": String(Boolean(item[opts.switchKey])),
    title: "Sold out means no new servers there. Existing ones keep running.",
    onclick: () => { item[opts.switchKey] = !item[opts.switchKey]; touch(); render(); },
  }, h("span", { class: "knob" }), item[opts.switchKey] ? "Sold out" : "Open");
  const move = (d) => () => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    state.open = new Set();
    touch();
    render();
  };
  const title = opts.title ? opts.title(item) : `#${i + 1}`;
  const head = h("div", { class: "head" },
    h("div", {}, h("div", { class: "title" }, title), opts.sub && h("div", { class: "sub" }, opts.sub(item))),
    sw,
    h("div", { class: "tools" },
      h("button", { type: "button", class: "small", "aria-label": "Move up", disabled: i === 0, onclick: move(-1) }, "Up"),
      h("button", { type: "button", class: "small", "aria-label": "Move down", disabled: i === arr.length - 1, onclick: move(1) }, "Down"),
      h("button", { type: "button", class: "small danger", onclick: () => { if (confirm(`Remove ${title}?`)) { arr.splice(i, 1); state.open = new Set(); touch(); render(); } } }, "Remove")));
  const body = h("div", { class: "body" + (collapsible ? "" : " pt") }, opts.fields.map((f) => field(item, f, prefix)));
  if (!collapsible) return h("div", { class: "card inner" + (bad ? " err" : "") }, head, body);
  return h("div", { class: "card" + (bad ? " err" : "") }, head,
    h("details", { open: state.open.has(prefix) || bad, ontoggle: (e) => (e.target.open ? state.open.add(prefix) : state.open.delete(prefix)) },
      h("summary", {}, "Details"), body));
}

// ---- render ----
function render() {
  const tabs = $("#tabs");
  tabs.replaceChildren(...Object.entries(TABS).map(([k, t]) =>
    h("button", { role: "tab", "aria-selected": String(k === state.tab), onclick: () => load(k) }, t.label)));

  const T = TABS[state.tab];
  renderPicker();
  const list = $("#list");
  list.replaceChildren();
  renderBanner();
  if (T.note) list.append(h("p", { class: "tabnote" }, T.note));
  if (!state.data) {
    if (T.items && !state.item && !state.msg) list.append(h("div", { class: "empty" }, `No ${T.items.noun}s yet.`));
    return renderBar();
  }

  if (T.list) {
    if (!state.data.length) list.append(h("div", { class: "empty" }, "Nothing here yet."));
    state.data.forEach((item, i) => list.append(card(T, item, i, state.data, String(i), true)));
    list.append(h("button", { onclick: () => { state.data.push(T.blank()); state.open.add(String(state.data.length - 1)); touch(); render(); } }, `Add ${T.label.toLowerCase().replace(/s$/, "")}`));
  } else {
    list.append(h("div", { class: "card" }, h("div", { class: "body pt" }, T.fields.map((f) => field(state.data, f, "")))));
  }
  renderBar();
}

function renderPicker() {
  const T = TABS[state.tab];
  const p = $("#picker");
  p.replaceChildren();
  if (!T.items) return;
  const names = state.items ?? [];
  const all = state.isNew && state.item && !names.includes(state.item) ? [state.item, ...names] : names;
  p.append(h("div", { class: "picker" },
    h("label", { class: "f" }, `Which ${T.items.noun}`,
      h("select", { onchange: (e) => load(state.tab, e.target.value) },
        all.map((n) => h("option", { value: n, selected: n === state.item }, n === state.item && state.isNew ? `${n} (new, not saved)` : n)))),
    !T.items.noCreate && h("button", { onclick: startNew }, `New ${T.items.noun}`),
    state.canDelete && state.item && !state.isNew && h("button", { class: "danger", onclick: removeItem }, `Delete ${T.items.noun}`)));
}

function startNew() {
  const T = TABS[state.tab];
  if (state.dirty && !confirm("You have unsaved edits here. Throw them away?")) return;
  const slug = (prompt(`File name for the new ${T.items.noun} (lowercase letters, numbers, dashes):`) ?? "").trim();
  if (!slug) return;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return alert("Lowercase letters, numbers and dashes only.");
  if (state.items.includes(slug)) return alert(`${slug} already exists, pick it from the list.`);
  state.item = slug;
  state.isNew = true;
  state.data = T.items.blank(slug);
  state.orig = structuredClone(state.data);
  state.sha = null;
  state.live = "missing";
  state.errors = [];
  state.msg = null;
  state.dirty = true;
  render();
}

async function removeItem() {
  const T = TABS[state.tab];
  if (!confirm(`Delete ${state.item} from the dev site?`)) return;
  const live = confirm(`Also delete it from the LIVE site now (deploys lumixsolutions.org)?\n\nOK = delete from live too. Cancel = dev only.`);
  const { ok, body } = await api(call("delete", itemQuery()), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sha: state.sha, live }),
  });
  if (!ok) {
    state.msg = { bad: true, text: body.error ?? "delete failed" };
    return renderBanner();
  }
  const gone = state.item;
  state.dirty = false;
  await load(state.tab);
  state.msg = { text: `Deleted ${gone} from ${live ? "dev and the live site" : "dev"}. ${live ? "Deploys are running." : "It stays live until you remove it there too."}` };
  renderBanner();
  watchDeploys();
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
  const liveTxt = state.data ? { same: "Live matches dev.", behind: "Dev is ahead of live. Save and go live to ship it.", missing: state.isNew ? "Not created yet." : "main has no copy of this yet, going live is off until the data refactor ships there." }[state.live] ?? "" : "";
  status.replaceChildren(h("span", {}, h("b", {}, "Saves go to dev. "), liveTxt), h("span", { id: "deploys" }, ""));
  const canLive = state.live !== "missing" || state.isNew;
  bar.replaceChildren(
    h("button", { disabled: !state.dirty, onclick: () => save(false) }, "Save to dev"),
    h("button", { class: "primary", disabled: (!state.dirty && !behind) || !canLive || !state.data, onclick: () => save(true) }, "Save and go live"),
    h("span", { class: "note" }, state.dirty ? "Unsaved edits." : ""));
  paintDeploys();
}

// ---- saving ----
async function save(live) {
  if (live && !confirm("Push this to main? It deploys to lumixsolutions.org in about two minutes.")) return;
  const { status, ok, body } = await api(call("data", itemQuery()), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: state.data, sha: state.sha, live, create: state.isNew }),
  });
  state.errors = status === 422 ? body.errors : [];
  if (!ok) {
    state.msg = status === 422 ? null : { bad: true, text: body.error ?? "save failed" + (body.devSaved ? " (dev did save, live didn't)" : "") };
    if (body.devSaved) { state.sha = body.sha; state.live = "behind"; state.isNew = false; }
    render();
    return;
  }
  const flips = state.tab === "locations" ? soldOutFlips(state.orig, body.data) : [];
  const created = state.isNew;
  state.data = body.data;
  state.orig = structuredClone(body.data);
  state.sha = body.sha;
  state.isNew = false;
  if (created && state.items && !state.items.includes(state.item)) state.items = [...state.items, state.item].sort();
  state.live = live ? "same" : created || (state.live === "same" && !body.unchanged) ? "behind" : state.live;
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
  const { ok, body } = await api(call("deploys")).catch(() => ({ ok: false }));
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
  const { body } = await api(call("me"));
  $("#who").textContent = body.user ? `Signed in as ${body.user}` : "";
  load("locations");
})();
