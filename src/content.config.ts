import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// First collection of several. When the admin panel lands (see BUILD-PLAN.md) the
// base path moves to a content directory outside the deploy target, and the zod
// schemas below stay exactly as they are.
const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Pulled from the live site as a display string, not an ISO date. Keeping it
    // a string means nobody has to think about timezones on a "last updated" line.
    lastUpdated: z.string(),
  }),
});

export const collections = { legal };
