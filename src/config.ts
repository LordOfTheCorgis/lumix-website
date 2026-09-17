// becomes settings.yaml if the admin panel ever lands. one file so header and
// footer don't each grow a copy of the nav

export const site = {
  name: "Lumix Solutions",
  legalName: "Lumix Solutions LLC",
  domain: "lumixsolutions.org",
  description:
    "Game server hosting for communities. A finite number of servers, run properly.",
  tagline: "Low-latency game servers in four US regions, capped on purpose.",
};

// has to exist in WHMCS with the same string or we're advertising a code the
// cart rejects. make it there first, then flip live
export const promo = {
  code: "LUMIX10",
  percent: 10,
  live: true,
};

// trustpilot by hand, their widgets are paid tier. both null = line doesn't
// render. bump `updated` when you change the numbers or this goes stale quietly
export const trust = {
  score: null as number | null,
  reviews: null as number | null,
  updated: "",
  url: "https://www.trustpilot.com/review/lumixsolutions.org",
};

// not a game, no tile. pid is the WHMCS product, unknown = link to store front
export const botHosting = {
  monthly: 4,
  pid: null as number | null,
};

// read-only demo server on the panel. nothing renders until url is set.
// credentials are public on purpose, it's a demo account with no power
export const demoPanel = {
  url: null as string | null,
  user: "",
  password: "",
};

// the capacity board. DESIGN.md section 8, the signature element. this is the
// capping policy rendered as interface, so the numbers have to be REAL. edit
// them by hand when inventory moves. no fake scarcity timer, and if the open
// count is high we say so, the credibility is the whole point.
//
// each cell is one literal slot. open = purchasable now, running = someone's
// server lives there, capped = held back on purpose to keep nodes honest.
// game is a slug, label/accent get pulled from the games collection so colour
// stays single-sourced. region is the short code, cities live in locations.ts.
export type SlotState = "open" | "running" | "capped";

export interface CapacityCell {
  game: string;    // slug into the games collection
  region: string;  // MIA / IAD / DFW / SLC
  open: number;
  running: number;
  capped: number;
}

export const capacity = {
  // bump when you touch the numbers below, same deal as trust.updated
  updated: "2026-09-16",
  // node backbone latency per region, operator-measured. null renders nothing
  // rather than a made-up number, same pattern as trust.score. fill these with
  // real figures from the nodes, not a guess
  ping: {
    MIA: null as number | null,
    IAD: null as number | null,
    DFW: null as number | null,
    SLC: null as number | null,
  } as Record<string, number | null>,
  // fivem carries the capped slots because fivem is the product the capping
  // announcement was about. order here is the render order, west-to-east-ish
  cells: [
    { game: "fivem", region: "SLC", open: 2, running: 7, capped: 0 },
    { game: "fivem", region: "DFW", open: 1, running: 8, capped: 2 },
    { game: "fivem", region: "IAD", open: 3, running: 9, capped: 4 },
    { game: "fivem", region: "MIA", open: 2, running: 10, capped: 4 },
    { game: "minecraft", region: "IAD", open: 1, running: 7, capped: 0 },
    { game: "minecraft", region: "MIA", open: 1, running: 8, capped: 0 },
    { game: "palworld", region: "DFW", open: 1, running: 5, capped: 0 },
    { game: "palworld", region: "IAD", open: 2, running: 6, capped: 0 },
    { game: "terraria", region: "SLC", open: 0, running: 6, capped: 0 },
    { game: "terraria", region: "MIA", open: 1, running: 6, capped: 0 },
  ] as CapacityCell[],
};

export const links = {
  billing: "https://billing.lumixsolutions.org",
  ticket: "https://billing.lumixsolutions.org/submitticket.php",
  panel: "https://panel.lumixsolutions.org",
  docs: "https://docs.lumixsolutions.org",
  careers: "https://careers.lumixsolutions.org/",
  discord: "https://discord.com/invite/uaNYBJQtvn",
  x: "https://x.com/LumixSolutions",
  // youtube handle has been a 404 since july. put it back here AND in social
  // once it resolves
  instagram: "https://www.instagram.com/lumixsolutionsllc/",
  tiktok: "https://tiktok.com/@lumix.solutions",
  github: "https://github.com/lumixsolutions",
};

// four items, the old header had six. contact went to the footer, discord is
// the answer to "where's live chat" so it gets the slot
export const nav = [
  { label: "Game Hosting", href: "/games" },
  { label: "Partners", href: "/partners" },
  { label: "Status", href: "/status" },
  { label: "Discord", href: links.discord },
];

// the More drawer. still four destinations plus a drawer, not five items
export const moreNav = [
  { label: "Tools", href: "/tools", note: "Free config generators" },
  { label: "Regions", href: "/regions", note: "Where the nodes are, and your ping" },
  { label: "Migrate", href: "/migrate", note: "Move a server from another host" },
  { label: "Staff", href: "/staff", note: "Who runs the nodes" },
  { label: "Contact", href: "/contact", note: "Tickets, Discord, email" },
  { label: "Careers", href: links.careers, note: "We hire out of the community" },
];

export const footerNav = [
  {
    heading: "Hosting",
    items: [
      { label: "Game Hosting", href: "/games" },
      { label: "Regions", href: "/regions" },
      { label: "Migrate", href: "/migrate" },
      { label: "Status", href: "/status" },
      { label: "Control Panel", href: links.panel },
      { label: "Client Area", href: links.billing },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "Partners", href: "/partners" },
      { label: "Tools", href: "/tools" },
      { label: "Staff", href: "/staff" },
      { label: "Careers", href: links.careers },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "California Privacy Rights", href: "/ccpa" },
    ],
  },
];

export const social = [
  { label: "Discord", href: links.discord },
  { label: "X", href: links.x },
  { label: "Instagram", href: links.instagram },
  { label: "TikTok", href: links.tiktok },
  { label: "GitHub", href: links.github },
];
