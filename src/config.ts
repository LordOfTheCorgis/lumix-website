// one file so header and footer don't each grow a copy of the nav. everything in it
// except the comments now comes from src/data/*.json (settings, site, navigation),
// which the admin at /admin edits. a bad value fails the build
import { settingsSchema, siteSchema, navigationSchema } from "./lib/schemas.mjs";
import settingsJson from "./data/settings.json";
import siteJson from "./data/site.json";
import navJson from "./data/navigation.json";

const siteData = siteSchema.parse(siteJson);
const navData = navigationSchema.parse(navJson);

export const site = siteData.site;

// has to exist in WHMCS with the same string or we're advertising a code the
// cart rejects. make it there first, then flip live. checked against WHMCS
// 2026-11-25: 10% percentage, new signups only, once per client, first payment
// only, all 28 site pids. the copy says "first order" because of that
const settings = settingsSchema.parse(settingsJson);
export const promo = settings.promo;

// trustpilot by hand, their widgets are paid tier. score null = no rating shown.
// reviews is deliberately null: the count is tiny right now and a small number
// above the fold reads as "nobody's bought this" louder than the 4.6 reassures,
// so we show the rating and not the count. put a number back when it's one worth
// showing. bump `updated` when you change the score or this goes stale quietly.
export const trust = settings.trust;

// not a game, no tile. ONE WHMCS product (pid 6, "Application Hosting"), the
// runtime is a dropdown on the panel's Startup tab. this used to be three
// products with the pids written down as 7/8/9, which were wrong anyway: in
// WHMCS Node is 6, Python 7, Go 8 and 9 doesn't exist, so two of the three
// links ordered the wrong thing and one ordered nothing. `runtimes` is only
// the names the copy shows, the panel's picker has the full list.
export const botHosting = siteData.botHosting;

// read-only demo server on the panel. nothing renders until url is set.
// credentials are public on purpose, it's a demo account with no power
export const demoPanel = siteData.demoPanel;

// youtube handle has been a 404 since july. put it back in links (site.json) AND
// in social (navigation.json) once it resolves
export const links = siteData.links;

// hrefs in navigation.json can be "@discord" etc: the link of that name above,
// so a link changed once changes everywhere. unknown names fail the build
const href = (h: string): string => {
  if (!h.startsWith("@")) return h;
  const v = (links as Record<string, string>)[h.slice(1)];
  if (!v) throw new Error(`navigation.json: "${h}" is not a link in site.json`);
  return v;
};
const resolve = <T extends { href: string }>(rows: T[]): T[] => rows.map((r) => ({ ...r, href: href(r.href) }));

// four items, the old header had six. contact went to the footer, discord is
// the answer to "where's live chat" so it gets the slot
export const nav = resolve(navData.nav);

// the More drawer. still four destinations plus a drawer, not five items
export const moreNav = resolve(navData.moreNav);

export const footerNav = navData.footerNav.map((g) => ({ ...g, items: resolve(g.items) }));

export const social = resolve(navData.social);
