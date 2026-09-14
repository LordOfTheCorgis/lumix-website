// Everything the server.cfg generator knows, kept out of the page so the
// builds list and the framework presets can be edited without wading through
// markup. The page's client script imports this and Vite bundles it.
//
// Sources, 2026-09-14: docs.fivem.net server-commands and the vanilla setup
// guide's default server.cfg, the QBCore txAdminRecipe server.cfg, ESX's
// esx_core server.cfg, oxmysql's readme. The Enhanced rules come from
// docs.fivem.net/docs/developers/legacy-vs-enhanced. The Lumi-Panel rules
// (port allocations, the database endpoint, FIVEM_LICENSE in the Startup
// tab) come from docs.lumixsolutions.org/games/fivem,
// also available to a session as the lumix-docs MCP server in .mcp.json.
// If cfx moves a goalpost it'll show up here first, so check those before
// "fixing" a preset.

export type Edition = "legacy" | "enhanced";
export type Framework = "vanilla" | "qbcore" | "esx" | "vrp" | "custom";
export type DbFormat = "uri" | "kv";
export type OneSync = "on" | "legacy" | "off";
export type PureLevel = "0" | "1" | "2";

export interface CfgState {
  // Lumi-Panel boots with `+set sv_licenseKey {{FIVEM_LICENSE}}`, so the key
  // can live in the Startup tab instead of the file. Off by default: a file
  // with a redundant key boots everywhere, a file with no key boots nowhere.
  licenseInStartup: boolean;

  projectName: string;
  projectDesc: string;
  hostname: string;
  tags: string;
  locale: string;
  bannerDetail: string;
  bannerConnecting: string;
  serverIcon: string;

  port: number;
  maxClients: number;
  licenseKey: string;
  steamKey: string;

  edition: Edition;
  gameBuild: string; // "" = don't enforce
  onesync: OneSync;
  scriptHook: boolean;

  rconPassword: string;
  endpointPrivacy: boolean;
  lan: boolean;
  privateListing: boolean;
  pureLevel: PureLevel;
  syncTickRate: number;

  dbEnabled: boolean;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPass: string;
  dbName: string;
  dbFormat: DbFormat;

  framework: Framework;
  extraResources: string; // one per line
  admins: string; // one identifier per line
}

export const DEFAULTS: CfgState = {
  licenseInStartup: false,

  projectName: "",
  projectDesc: "",
  hostname: "",
  tags: "roleplay",
  locale: "en-US",
  bannerDetail: "",
  bannerConnecting: "",
  serverIcon: "",

  port: 30120,
  maxClients: 48,
  licenseKey: "",
  steamKey: "",

  edition: "legacy",
  gameBuild: "3095",
  onesync: "on",
  scriptHook: false,

  rconPassword: "",
  endpointPrivacy: true,
  lan: false,
  privateListing: false,
  pureLevel: "0",
  syncTickRate: 60,

  dbEnabled: true,
  dbHost: "",
  dbPort: 3306,
  dbUser: "root",
  dbPass: "",
  dbName: "fivem",
  dbFormat: "uri",

  framework: "qbcore",
  extraResources: "",
  admins: "",
};

// Legacy only. Enhanced ships one build (the current one) and refuses to
// register if you pin any of these, see the emitter. Straight off
// docs.fivem.net/docs/server-manual/server-commands/#sv_enforcegamebuild-build
// as of 2026-09-14; every build includes everything before it. 2612 has no
// DLC name in the docs, only its alias.
export const GAME_BUILDS: { value: string; label: string }[] = [
  { value: "", label: "Don't enforce (client picks)" },
  { value: "3889", label: "3889 · The Kortz Center Heist" },
  { value: "3751", label: "3751 · A Safehouse in the Hills" },
  { value: "3570", label: "3570 · Money Fronts" },
  { value: "3407", label: "3407 · Agents of Sabotage" },
  { value: "3258", label: "3258 · Bottom Dollar Bounties" },
  { value: "3095", label: "3095 · The Chop Shop" },
  { value: "2944", label: "2944 · San Andreas Mercenaries" },
  { value: "2802", label: "2802 · Los Santos Drug Wars" },
  { value: "2699", label: "2699 · The Criminal Enterprises" },
  { value: "2612", label: "2612 · mpg9ec" },
  { value: "2545", label: "2545 · The Contract" },
  { value: "2372", label: "2372 · Los Santos Tuners" },
  { value: "2189", label: "2189 · Cayo Perico Heist" },
  { value: "2060", label: "2060 · Los Santos Summer Special" },
  { value: "1604", label: "1604 · Arena War" },
  { value: "1", label: "1 · Base game, no DLC" },
];

export const LOCALES: { value: string; label: string }[] = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "fr-CA", label: "Français (Canada)" },
  { value: "es-ES", label: "Español" },
  { value: "es-MX", label: "Español (México)" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "nl-NL", label: "Nederlands" },
  { value: "it-IT", label: "Italiano" },
  { value: "pl-PL", label: "Polski" },
  { value: "sv-SE", label: "Svenska" },
  { value: "da-DK", label: "Dansk" },
  { value: "cs-CZ", label: "Čeština" },
  { value: "tr-TR", label: "Türkçe" },
  { value: "ru-RU", label: "Русский" },
  { value: "ar-SA", label: "العربية" },
];

// ^N colour codes for sv_hostname, as the docs list them. These are the
// game's colours quoted for a preview, same status as the terminal's traffic
// lights: not palette, don't "fix" them to brand red.
export const HOSTNAME_COLOURS: Record<string, string> = {
  "0": "#ffffff",
  "1": "#ff4444",
  "2": "#55d955",
  "3": "#ffdd44",
  "4": "#5577ff",
  "5": "#55ccff",
  "6": "#cc66ff",
  "7": "#ffffff",
  "8": "#ff9933",
  "9": "#999999",
};

// The base set every server needs regardless of framework. The docs' vanilla
// cfg lists these minus baseevents; QBCore's recipe adds it and nothing
// breaks with it present, so frameworks get it and vanilla stays as documented.
const BASE_RESOURCES = [
  "mapmanager",
  "chat",
  "spawnmanager",
  "sessionmanager",
  "basic-gamemode",
  "hardcap",
];

export const FRAMEWORKS: Record<
  Framework,
  { label: string; hint: string; resources: string[]; extras?: string[] }
> = {
  qbcore: {
    label: "QBCore",
    hint: "qb-core has to start before anything in [qb] touches it. Folder names match a stock install.",
    resources: ["qb-core", "[qb]", "[standalone]", "[voice]", "[defaultmaps]"],
    extras: ["set resources_useSystemChat true"],
  },
  esx: {
    label: "ESX Legacy",
    hint: "es_extended first, then the folders. Rename [esx] if your install calls it [core].",
    resources: ["es_extended", "[esx]", "[standalone]", "[voice]"],
  },
  vrp: {
    label: "vRP",
    hint: "vRP wants the key=value connection string, not the URI. Switched for you below.",
    resources: ["vrp", "[vrp]", "[standalone]"],
  },
  vanilla: {
    label: "Vanilla (cfx-server-data)",
    hint: "Exactly what the FiveM docs ship. Good for a freeroam or a test box.",
    resources: ["rconlog"],
  },
  custom: {
    label: "Custom / none",
    hint: "Just the base resources. Add yours in the box below, one per line.",
    resources: [],
  },
};

export type Line = { text: string; field?: string };

const LOCALHOST = /^(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)$/i;

// Quotes inside a cfg string have no escape sequence, so a stray " ends the
// value early and the rest of the line gets parsed as a command. Swapping to
// ' keeps the meaning and keeps the parser happy.
const q = (v: string) => `"${String(v).trim().replace(/"/g, "'")}"`;

// Characters oxmysql's URI parser chokes on. Any of these in the password
// means the kv form, no argument.
export const URI_UNSAFE = /[;,\/?:@&=+$#]/;

export function connectionString(s: CfgState): string {
  const pass = s.dbPass;
  if (s.dbFormat === "kv") {
    // mysql-async's spelling. oxmysql reads it too, so one kv form covers both.
    return `server=${s.dbHost};port=${s.dbPort};database=${s.dbName};userid=${s.dbUser};password=${pass}`;
  }
  const auth = pass ? `${s.dbUser}:${pass}` : s.dbUser;
  return `mysql://${auth}@${s.dbHost}:${s.dbPort}/${s.dbName}?charset=utf8mb4`;
}

export function buildCfg(s: CfgState): Line[] {
  const out: Line[] = [];
  const push = (text: string, field?: string) => out.push({ text, field });
  const blank = () => push("");
  const enhanced = s.edition === "enhanced";
  const name = s.projectName.trim() || "My FiveM Server";

  push(`# ${name} · server.cfg`, "projectName");
  push(`# Built with lumixsolutions.org/tools/fivem-server-cfg`);
  push(`# Edition: GTA V ${enhanced ? "Enhanced" : "Legacy"}`, "edition");
  push("# Only read on boot. Restart after every edit.");
  blank();

  push("# Port = the game allocation in the Network tab, not the", "port");
  push(
    "# txAdmin one. 0.0.0.0 is fine, the container has one interface.",
    "port",
  );
  push(`endpoint_add_tcp "0.0.0.0:${s.port}"`, "port");
  push(`endpoint_add_udp "0.0.0.0:${s.port}"`, "port");
  blank();

  push("# What players see");
  push(`sv_hostname ${q(s.hostname.trim() || name)}`, "hostname");
  push(`sets sv_projectName ${q(name)}`, "projectName");
  push(
    `sets sv_projectDesc ${q(s.projectDesc.trim() || "A FiveM server")}`,
    "projectDesc",
  );
  push(`sets tags ${q(s.tags.trim() || "default")}`, "tags");
  push(`sets locale ${q(s.locale)}`, "locale");
  if (s.bannerDetail.trim())
    push(`sets banner_detail ${q(s.bannerDetail)}`, "bannerDetail");
  if (s.bannerConnecting.trim())
    push(`sets banner_connecting ${q(s.bannerConnecting)}`, "bannerConnecting");
  if (s.serverIcon.trim()) {
    push("# 96x96 PNG, sits next to this file.");
    push(`load_server_icon ${s.serverIcon.trim()}`, "serverIcon");
  }
  blank();

  push("# Slots and keys");
  push(`sv_maxclients ${s.maxClients}`, "maxClients");
  if (s.licenseInStartup) {
    push(
      "# sv_licenseKey comes in from FIVEM_LICENSE in the Startup tab.",
      "licenseKey",
    );
    push("# A line here would override it, so there isn't one.", "licenseKey");
  } else {
    push(`sv_licenseKey ${q(s.licenseKey.trim() || "changeme")}`, "licenseKey");
  }
  push("# Without this, steam: identifiers never resolve.");
  push(`set steam_webApiKey ${q(s.steamKey.trim() || "")}`, "steamKey");
  blank();

  push("# Game");
  if (enhanced) {
    push("# Enhanced ships one build and won't register with an older");
    push("# one pinned. The only valid pin is 1: base game, no DLC.");
    if (s.gameBuild === "1") push("sv_enforceGameBuild 1", "gameBuild");
    push("# OneSync is always on in Enhanced, no convar any more.", "onesync");
    push(`set sv_syncTickRate ${s.syncTickRate}`, "syncTickRate");
  } else {
    if (s.gameBuild) push(`sv_enforceGameBuild ${s.gameBuild}`, "gameBuild");
    else
      push("# No build pinned, clients load whatever they have.", "gameBuild");
    push(`set onesync ${s.onesync}`, "onesync");
  }
  push(`sv_scriptHookAllowed ${s.scriptHook ? 1 : 0}`, "scriptHook");
  blank();

  push("# Listing and access");
  if (s.rconPassword.trim())
    push(`set rcon_password ${q(s.rconPassword)}`, "rconPassword");
  else push("# RCON is off. Set a password to turn it on.", "rconPassword");
  push(`sv_endpointPrivacy ${s.endpointPrivacy}`, "endpointPrivacy");
  if (s.lan) push("sv_lan true", "lan");
  if (s.privateListing) {
    push("# Off the public list. Direct connect only.", "privateListing");
    push(`sv_master1 ""`, "privateListing");
  }
  if (s.pureLevel !== "0") push(`sv_pureLevel ${s.pureLevel}`, "pureLevel");
  blank();

  if (s.dbEnabled) {
    push("# Database. Must be set before anything that reads it starts.");
    push("# Host is the Databases tab endpoint. Never localhost here.", "db");
    push(`set mysql_connection_string ${q(connectionString(s))}`, "db");
    blank();
  }

  const fw = FRAMEWORKS[s.framework];
  push(`# Resources · ${fw.label}`);
  if (s.framework !== "vanilla" && s.framework !== "custom") {
    push("# oxmysql first or the framework boots with no db and dies.");
  }
  for (const r of BASE_RESOURCES) push(`ensure ${r}`, "framework");
  if (s.framework !== "vanilla") push("ensure baseevents", "framework");
  if (s.dbEnabled && s.framework !== "vanilla")
    push("ensure oxmysql", "framework");
  for (const r of fw.resources) push(`ensure ${r}`, "framework");
  for (const r of splitLines(s.extraResources))
    push(`ensure ${r}`, "extraResources");
  for (const e of fw.extras ?? []) push(e, "framework");
  blank();

  push("# Admins");
  push("add_ace group.admin command allow", "admins");
  push("add_ace group.admin command.quit deny", "admins");
  const admins = splitLines(s.admins);
  if (admins.length === 0) {
    push("# Nobody yet. Add an identifier and it lands here.", "admins");
  }
  for (const id of admins)
    push(`add_principal identifier.${id} group.admin`, "admins");
  if (s.framework === "qbcore") {
    push("add_ace resource.qb-core command allow", "admins");
    push("add_principal qbcore.god group.admin", "admins");
    push("add_principal qbcore.god qbcore.admin", "admins");
    push("add_principal qbcore.admin qbcore.mod", "admins");
  }

  return out;
}

export function splitLines(v: string): string[] {
  return v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export type Warning = { level: "stop" | "warn"; field: string; text: string };

export function warnings(s: CfgState): Warning[] {
  const w: Warning[] = [];
  const stop = (field: string, text: string) =>
    w.push({ level: "stop", field, text });
  const warn = (field: string, text: string) =>
    w.push({ level: "warn", field, text });

  const key = s.licenseKey.trim();
  if (s.licenseInStartup) {
    // Nothing to check here, but the key still has to exist over there.
    if (key)
      warn(
        "licenseKey",
        "Key is set to come from the Startup tab, so what you typed here isn't in the file.",
      );
  } else if (!key || key === "changeme") {
    stop(
      "licenseKey",
      "No license key. The server won't start without one from portal.cfx.re.",
    );
  } else if (!/^cfxk_/.test(key)) {
    warn(
      "licenseKey",
      "Keys from portal.cfx.re start with cfxk_. Check you pasted the whole thing.",
    );
  }

  if (s.edition === "enhanced" && s.gameBuild && s.gameBuild !== "1") {
    stop(
      "gameBuild",
      "Enhanced rejects pinned Legacy builds and won't register. Cleared from the file.",
    );
  }

  if (s.maxClients > 48) {
    warn(
      "maxClients",
      "Free keys stop at 48 slots. Above that needs Element Club or an approved request from Cfx.",
    );
  }
  if (s.maxClients < 1 || s.maxClients > 2048) {
    stop("maxClients", "Slots must be between 1 and 2048.");
  }
  if (s.edition === "legacy" && s.onesync !== "on" && s.maxClients > 32) {
    stop(
      "onesync",
      "OneSync has to be on above 32 slots. The master list rejects the server otherwise.",
    );
  }

  if (s.port < 1024 || s.port > 65535) {
    stop("port", "Use a port between 1024 and 65535.");
  } else if (s.port === 30120) {
    warn(
      "port",
      "30120 is the template default. Check the game allocation in the Network tab; a different number here means nobody connects and the server never lists.",
    );
  }

  if (s.privateListing) {
    warn(
      "privateListing",
      "sv_master1 \"\" takes you off the public list. If that's not on purpose, untick it; it's the usual reason a server 'doesn't show up'.",
    );
  }

  if (!s.projectName.trim())
    warn("projectName", "No project name. The listing shows a placeholder.");
  if (s.locale === "root-AQ")
    warn("locale", "root-AQ is the docs' placeholder locale. Pick a real one.");

  if (s.rconPassword && s.rconPassword.length < 12) {
    warn(
      "rconPassword",
      "RCON is UDP with no lockout. Under 12 characters is asking for it.",
    );
  }

  if (s.dbEnabled) {
    if (!s.dbHost.trim()) {
      stop(
        "db",
        "No database host. Paste the Endpoint from the Databases tab.",
      );
    } else if (LOCALHOST.test(s.dbHost.trim())) {
      stop(
        "db",
        "The database doesn't run on your game server. Use the Endpoint from the Databases tab; localhost is ECONNREFUSED every time.",
      );
    }
    if (s.dbFormat === "uri" && URI_UNSAFE.test(s.dbPass)) {
      stop(
        "db",
        "The password has a character the URI form can't carry. Switch to key=value.",
      );
    }
    if (!s.dbPass)
      warn("db", "Empty database password. Copy it from the Databases tab.");
    if (s.framework === "vrp" && s.dbFormat === "uri") {
      warn("db", "vRP expects the key=value connection string.");
    }
  } else if (s.framework !== "vanilla" && s.framework !== "custom") {
    stop(
      "db",
      `${FRAMEWORKS[s.framework].label} needs a database. Turn it on.`,
    );
  }

  if (splitLines(s.admins).length === 0) {
    warn(
      "admins",
      "No admin identifiers. Nobody can run commands until you add one.",
    );
  }
  for (const id of splitLines(s.admins)) {
    if (
      !/^(license|license2|fivem|steam|discord|xbl|live|ip):[A-Za-z0-9]+$/.test(
        id,
      )
    ) {
      warn(
        "admins",
        `"${id}" doesn't look like an identifier. Expected license:… or fivem:… or discord:….`,
      );
    }
  }

  if (!s.steamKey.trim()) {
    warn(
      "steamKey",
      "No Steam Web API key. steam: identifiers won't resolve. Optional, but most admin tools want it.",
    );
  }

  return w;
}
