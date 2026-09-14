// What happens after checkout, per game. Rendered on the game pages under the
// plans. The point is to kill the "what will I be looking at once I've paid"
// question, which is the one that actually stops people.
//
// Everything here is from docs.lumixsolutions.org, read 2026-09-14: the FiveM
// full setup guide for fivem, the Lumi-Panel pages (console, files, startup,
// backups, schedules, databases) for the rest. Don't invent a step that isn't
// in the docs; if the panel changes, the docs change first and this follows.

export interface Step {
  title: string;
  body: string;
  /** Deep link into the docs for that step. */
  href?: string;
}

const docs = "https://docs.lumixsolutions.org";

const panelSteps: Step[] = [
  {
    title: "Your login lands in your inbox",
    body: "Same email you ordered with. The panel is Lumi-Panel, our build of Pterodactyl: a console, a file manager, backups and schedules, no Docker knowledge needed.",
    href: `${docs}/lumi-panel/overview`,
  },
  {
    title: "Press Start in the Console",
    body: "The server installs itself on first boot and streams the log live. Power controls and real-time CPU and memory sit on the same screen.",
    href: `${docs}/lumi-panel/general/console`,
  },
  {
    title: "Pick your version in Startup",
    body: "Version, build and the other knobs are variables in the Startup tab. Change one, restart, done. No editing launch scripts.",
    href: `${docs}/lumi-panel/configuration/startup`,
  },
  {
    title: "Upload from the Files tab or SFTP",
    body: "Mods, worlds, configs: drag them in from the browser or connect over SFTP with the details in Settings. Both hit the same disk.",
    href: `${docs}/lumi-panel/management/files`,
  },
  {
    title: "Set a backup schedule before you forget",
    body: "Backups are snapshots you restore on demand. Schedules run them on a cron, along with restarts and any command you want repeated.",
    href: `${docs}/lumi-panel/configuration/schedules`,
  },
];

const fivemSteps: Step[] = [
  {
    title: "Two ports, from the Network tab",
    body: "Every FiveM server gets a game port and a txAdmin port. Write both down; the next two steps have to match them.",
    href: `${docs}/lumi-panel/management/network`,
  },
  {
    title: "License key and txAdmin port in Startup",
    body: "Paste your Cfx key into FIVEM_LICENSE, generated against this server's IP. Set TXADMIN_PORT to the txAdmin allocation. A mismatch here is the most common reason txAdmin won't load.",
    href: `${docs}/games/fivem/setup`,
  },
  {
    title: "Start, then grab the PIN from the console",
    body: "First boot prints a one-time txAdmin PIN. Open http://YOUR_IP:TXADMIN_PORT, enter it, make your admin account. Lost it? Run txaPin in the console.",
    href: `${docs}/games/fivem/txadmin`,
  },
  {
    title: "server.cfg: endpoints, name, slots",
    body: "The endpoint lines must use your game port. Set the hostname, tags, slots and OneSync. Or build the whole file with the generator and paste it in.",
    href: "/tools/fivem-server-cfg",
  },
  {
    title: "Database from the Databases tab, never localhost",
    body: "Request one, copy the endpoint into mysql_connection_string, import your framework's .sql at db.lumixsolutions.org. Restart and it's live.",
    href: `${docs}/games/fivem/database-setup`,
  },
];

export function firstTen(slug: string): Step[] {
  return slug === "fivem" ? fivemSteps : panelSteps;
}
