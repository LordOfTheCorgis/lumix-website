// shapes for everything the admin edits (src/data/*.json). NO imports except
// zod, and plain .mjs on purpose: the admin server loads this file straight in
// node to refuse a bad save before it hits git (node here has no ts stripping),
// and the site build parses the same json with it, so the two can't disagree.
// astro/zod because that's the zod the content config uses
import { z } from "astro/zod";

const url = z.url();

export const locationSchema = z.object({
  city: z.string().min(1),
  region: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** for /regions#dallas. hosting only */
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  /** one line on who it serves. hosting only */
  serves: z.string().optional(),
  /** something in that dc. the node ips work even with nothing listening,
      see lib/ping.ts for why a refused connection still times right.
      missing = region skipped */
  pingUrl: url.optional(),
  /** vms on that node, /status lists them under the region. the ip stays ""
      on purpose: a browser ping puts it in the page source and the repo is
      public (evan, 2026-09-23). the schema enforces that so nobody pastes one */
  vms: z
    .array(z.object({ name: z.string().min(1), ip: z.literal("", { error: "VM ips stay blank, the repo is public" }) }))
    .optional(),
  /** node's at its cap, not taking new servers. existing ones keep running */
  soldOut: z.boolean().optional(),
  /** WHMCS "Server Location" option value id (config option 3). NOT the
      pterodactyl node id and not the "5|Dallas" sort prefix in the admin
      name. read it off GetProducts configoptions. hosting only */
  whmcsId: z.number().int().positive().optional(),
});

// two regions sharing a whmcsId would preselect the wrong one at checkout
export const locationsSchema = z.array(locationSchema).superRefine((rows, ctx) => {
  const seen = new Set();
  rows.forEach((r, i) => {
    if (r.whmcsId === undefined) return;
    if (seen.has(r.whmcsId)) {
      ctx.addIssue({ code: "custom", path: [i, "whmcsId"], message: `whmcsId ${r.whmcsId} is on two regions` });
    }
    seen.add(r.whmcsId);
  });
});

export const partnerSchema = z.object({
  name: z.string().min(1),
  /** stands in for a logo */
  mark: z.string().min(1).max(4),
  /** filename in src/assets/partners, on transparent. replaces the monogram */
  logo: z.string().optional(),
  founder: z.string().min(1),
  description: z.string().min(1),
  services: z.array(z.string().min(1)),
  /** hiring, commissions open, whatever they want said */
  note: z.string().optional(),
  /** redeemed at their checkout, not ours */
  offer: z.object({ code: z.string().min(1), text: z.string().min(1) }).optional(),
  url: url.optional(),
  /** when the shop and the portfolio are different pages */
  gallery: url.optional(),
  discord: url,
});
export const partnersSchema = z.array(partnerSchema);

export const personSchema = z.object({
  name: z.string().min(1),
  /** for when there's no photo */
  mark: z.string().min(1).max(4),
  title: z.string().min(1),
  /** what the title actually means here */
  bio: z.string().min(1),
  /** filename in src/assets/staff */
  image: z.string().optional(),
  /** public stuff only */
  links: z.array(z.object({ label: z.string().min(1), href: url })),
});
export const staffSchema = z.array(personSchema);

// the two bits of config.ts that change without anyone touching code
export const settingsSchema = z.object({
  promo: z.object({
    code: z.string().min(1),
    percent: z.number().int().min(1).max(100),
    live: z.boolean(),
  }),
  trust: z.object({
    score: z.number().min(0).max(5).nullable(),
    reviews: z.number().int().min(0).nullable(),
    /** bump when the score changes or it goes stale quietly. the admin does it */
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    url: url,
  }),
});

// name in the url / file on disk / schema, the admin's whole table of contents.
// assets = the folder its filename fields point into
export const DATASETS = {
  locations: { file: "src/data/locations.json", schema: locationsSchema },
  partners: { file: "src/data/partners.json", schema: partnersSchema, assets: "src/assets/partners" },
  staff: { file: "src/data/staff.json", schema: staffSchema, assets: "src/assets/staff" },
  settings: { file: "src/data/settings.json", schema: settingsSchema },
};
