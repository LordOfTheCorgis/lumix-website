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

export const links = {
  billing: "https://billing.lumixsolutions.org",
  panel: "https://panel.lumixsolutions.org",
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
// Staff and Careers moved to the footer where nobody misses them.
export const nav = [
  { label: "Game Hosting", href: "/games" },
  { label: "Partners", href: "/partners" },
  { label: "Status", href: "/status" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [
  {
    heading: "Hosting",
    items: [
      { label: "Game Hosting", href: "/games" },
      { label: "Status", href: "/status" },
      { label: "Control Panel", href: links.panel },
      { label: "Client Area", href: links.billing },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "Partners", href: "/partners" },
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
