import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // display string not a date, nobody wants to think about timezones here
    lastUpdated: z.string(),
  }),
});

// yaml quotes these because some vcore counts are "2.5", hence coerce
const specs = z.object({
  vcores: z.string(),
  ramGb: z.coerce.number(),
  storageGb: z.coerce.number(),
  slots: z.string(),
  databases: z.coerce.number(),
  backups: z.coerce.number(),
});

const plan = z.object({
  key: z.string(),
  name: z.string(),
  // WHMCS pid. wrong one sells the wrong product, so fail the build not the cart
  pid: z.number().int().positive(),
  popular: z.boolean().default(false),
  specs,
  pricing: z.object({ monthly: z.number().positive() }).catchall(z.number()),
});

const games = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/games" }),
  // image() so <Image> can do webp + srcset. art in public/ meant shipping a
  // 472KB palworld jpg to everyone
  schema: ({ image }) => z.object({
    slug: z.string(),
    label: z.string(),
    shortLabel: z.string(),
    status: z.enum(["live", "beta", "planned"]),
    tagline: z.string(),
    description: z.string(),
    image: image(),
    // logo from the publisher or wikimedia, 112px tall (2x of 56). svg where
    // there was one. black-on-transparent ones recoloured to paper
    logo: image(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    mark: z.string().min(2).max(4),
    highlights: z.array(z.string()).optional(),
    // live needs plans. planned has none and that's the point, /games shows
    // it dimmed so people can ask. superRefine so the error names the game
    plans: z.array(plan).default([]),
  }).superRefine((g, ctx) => {
    if (g.status === "live" && g.plans.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${g.slug} is live with no plans. Add one or set status: planned.`,
        path: ["plans"],
      });
    }
  }),
});

export const collections = { legal, games };
