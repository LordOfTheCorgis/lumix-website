// Everything here becomes settings.yaml when the admin panel lands. Keeping it in
// one file now so Header and Footer don't grow their own copies of the nav.

export const site = {
  name: "Lumix Solutions",
  legalName: "Lumix Solutions LLC",
  domain: "lumixsolutions.org",
  description:
    "Game server hosting for communities. A finite number of servers, run properly.",
  tagline: "Low-latency game servers in four US regions, capped on purpose.",
};

// The one public code. Has to exist in WHMCS as a promotion with the same
// string or the site is advertising a discount the cart rejects; create it
// there first, then flip `live`. Evan's call 2026-09-11: LUMIX10, evergreen.
export const promo = {
  code: "LUMIX10",
  percent: 10,
  live: true,
};

// Trustpilot, by hand. The embeddable TrustBoxes are behind Trustpilot's paid
// tier, so the score and count are copied off the public profile page and the
// hero line links there. Both null = the line doesn't render. Update `updated`
// when you update the numbers; it's what stops this quietly going stale.
export const trust = {
  score: null as number | null,
  reviews: null as number | null,
  updated: "",
  url: "https://www.trustpilot.com/review/lumixsolutions.org",
};

// Not a game, so it doesn't get a tile. Priced per Evan 2026-09-11. `pid` is
// the WHMCS product; until it's known the link lands on the store front.
export const botHosting = {
  monthly: 4,
  pid: null as number | null,
};

// A read-only demo server on Lumi-Panel so people can click around before
// they pay. Pterodactyl supports a demo user; Evan makes it, the values go
// here. Nothing renders until `url` is set. Credentials are shown in the open
// on purpose, it's a demo account with no power.
export const demoPanel = {
  url: null as string | null,
  user: "",
  password: "",
};

export const links = {
  billing: "https://billing.lumixsolutions.org",
  ticket: "https://billing.lumixsolutions.org/submitticket.php",
  panel: "https://panel.lumixsolutions.org",
  docs: "https://docs.lumixsolutions.org",
  careers: "https://careers.lumixsolutions.org/",
  discord: "https://discord.com/invite/uaNYBJQtvn",
  x: "https://x.com/LumixSolutions",
  // youtube.com/@officiallumixsolutions has been a hard 404 since at least
  // 07-31 per the marketing log. Put it back here AND in `social` below once
  // there's a channel that resolves.
  instagram: "https://www.instagram.com/lumixsolutionsllc/",
  tiktok: "https://tiktok.com/@lumix.solutions",
  github: "https://github.com/lumixsolutions",
};

// Four items. The old header carried six and a premium header carries four.
// Staff and Careers moved to the footer where nobody misses them, and on
// 2026-09-11 Contact went there too: Evan's answer to "where's live chat" is
// Discord, so Discord gets the header slot.
export const nav = [
  { label: "Game Hosting", href: "/games" },
  { label: "Partners", href: "/partners" },
  { label: "Status", href: "/status" },
  { label: "Discord", href: links.discord },
];

// The "More" drawer. Five header slots where one is a disclosure is still four
// destinations plus a drawer, which is why this doesn't break the four-item rule
// in the handoff. Everything in here already existed in the footer except Tools.
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
