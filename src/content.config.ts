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
  // image() hands back ImageMetadata so <Image> can emit webp, a srcset, and
  // intrinsic width/height. Keeping key art in public/ meant shipping a 472KB
  // Palworld jpg to every visitor.
  schema: ({ image }) => z.object({
    slug: z.string(),
    label: z.string(),
    shortLabel: z.string(),
    status: z.enum(["live", "beta", "planned"]),
    tagline: z.string(),
    description: z.string(),
    image: image(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    mark: z.string().min(2).max(4),
    highlights: z.array(z.string()).optional(),
    // A live game needs something to sell. A planned one has nothing yet and
    // that's the point of listing it: the /games catalogue shows it dimmed so
    // people can ask for it. Enforced below rather than with min(1) so the
    // error names the game instead of "array too short".
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
