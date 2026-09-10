import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Display string, not an ISO date, so nobody has to think about timezones
    // on a "last updated" line.
    lastUpdated: z.string(),
  }),
});

// Specs come out of YAML quoted because some vCore counts are fractional
// ("2.5"), hence coerce on the numeric ones.
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
  // WHMCS product ID. A wrong one here sells the wrong product at the wrong
  // price, so it fails the build rather than the cart.
  pid: z.number().int().positive(),
  popular: z.boolean().default(false),
  specs,
  pricing: z.object({ monthly: z.number().positive() }).catchall(z.number()),
});

const games = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/games" }),
  schema: z.object({
    slug: z.string(),
    label: z.string(),
    shortLabel: z.string(),
    status: z.enum(["live", "beta", "planned"]),
    tagline: z.string(),
    description: z.string(),
    image: z.string(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    mark: z.string().min(2).max(4),
    highlights: z.array(z.string()).optional(),
    plans: z.array(plan).min(1),
  }),
});

export const collections = { legal, games };
