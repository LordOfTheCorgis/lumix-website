# Lumix Website — Content & CMS Build Plan

Goal: edit games, plans, staff, legal copy and sold-out state without opening an
editor or touching source. Companion to DESIGN.md.

Verified against this repo: Astro 7.3.2, Tailwind 4.3.3, static output, deployed by
`.github/workflows/deploy.yml` which rsyncs `dist/` to `/srv/www/lumixsolutions.org/`.

---

## 1. The decision

**Keystatic, git-backed, on top of Astro content collections.**

Content lives as YAML and Markdoc files in the repo. Keystatic is an admin UI that
commits to GitHub. Push triggers Actions, Actions builds, rsync deploys. No database,
no vendor lock, no monthly cost, and the existing pipeline is unchanged.

Confirmed compatible: `@keystatic/astro@6` declares `astro: '5 || 6 || 7'`.

Why not the alternatives. Sanity and Contentful still require a full rebuild for a
static site, so you take on a vendor and gain nothing git doesn't give you. Directus or
Payload self-hosted means running Postgres plus a Node service on your box to manage
content that changes weekly, which is real ops for no benefit. Decap and Sveltia are
lighter and stay fully static, but their schemas are untyped YAML, and this content
carries WHMCS product IDs and prices where a typo bills a customer wrong. Keystatic's
TypeScript schemas plus zod validation mean that breaks the build instead of the cart.

## 2. Three tiers, not one system

The three things named in the ask are three different problems.

**Tier 1, structural content.** Games, plans, staff, teams, legal, changelog, partners,
spotlight, announcements, site settings. Changes weekly at most. Lives in the CMS. Edit,
commit, live in roughly ninety seconds. Correct and boring.

**Tier 2, capacity.** Sold-out flags and slot counts. **Does not belong in the CMS.**
Rebuilding and redeploying the entire site to flip a boolean is the wrong shape, and it
quietly breaks the premise in DESIGN.md section 8, where the Capacity Board shows live
occupancy rather than a number someone remembered to update. This is a runtime JSON fetch.

**Tier 3, status.** Endpoint pings. Already client-side. Unchanged.

## 3. Phase 1 — Content collections

Astro 7 uses the Content Layer. Config goes at `src/content.config.ts`.

```
src/content/
  games/            fivem.yaml, minecraft.yaml, rust.yaml, ...
  staff/            evan.yaml, keaghan.yaml
  teams/            engineering.yaml, support.yaml, security.yaml, operations.yaml
  changelog/        2026-05-01-miami-live.md
  legal/            privacy.md, terms.md, ccpa.md
  partners.yaml     singleton
  spotlight.yaml    singleton
  settings.yaml     singleton: links, contact emails, navigation, announcements
  locations.yaml    Miami and Ashburn: valueId, note, coordinates
```

Sketch:

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const pricing = z.object({
  monthly: z.number().positive(),
  quarterly: z.number().positive().optional(),
  annually: z.number().positive().optional(),
});

const plan = z.object({
  id: z.string(),
  name: z.string(),
  pid: z.number().int().positive(),      // WHMCS product ID
  ram: z.number().int().positive(),
  slots: z.number().int().positive().optional(),
  popular: z.boolean().default(false),
  pricing,
});

const games = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/games' }),
  schema: ({ image }) => z.object({
    label: z.string(),
    shortLabel: z.string(),
    status: z.enum(['live', 'beta', 'planned']),
    tagline: z.string().max(90),
    description: z.string(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    mark: z.string().min(2).max(4),
    keyArt: image().optional(),
    hasLocations: z.boolean().default(true),
    highlights: z.array(z.string()).max(5).optional(),
    plans: z.array(plan).min(1),
  }),
});

const locations = defineCollection({
  loader: file('src/content/locations.yaml'),
  schema: z.object({
    code: z.string().length(3),           // MIA, IAD
    label: z.string(),
    valueId: z.number().int().positive(), // WHMCS config option value
    note: z.string(),
  }),
});

export const collections = { games, locations, /* staff, teams, changelog, legal */ };
```

The zod schemas are the real guard. `pid` and `valueId` are WHMCS identifiers, and a
wrong one silently sells the wrong product, so they get validated at build time and the
build fails loudly rather than the cart failing quietly.

Migration is mechanical. `main` still has `src/data/catalog.ts` and `src/data/site.ts`
fully structured, so this is a transcription job into YAML, roughly two hours.
Retrieve with `git show main:src/data/catalog.ts`.

## 4. Phase 2 — Keystatic

```
npm i @keystatic/core @keystatic/astro @astrojs/react react react-dom
```

React is required; Keystatic's admin UI is React and the peer deps demand it. It only
ships on the admin route, not the public site.

`keystatic.config.ts` mirrors the collections above with editing fields: `fields.text`,
`fields.number`, `fields.select`, `fields.checkbox`, `fields.array` for plans,
`fields.image` for key art, `fields.markdoc` for legal and changelog bodies. Each
collection sets `path: 'src/content/games/*'` and `format: { data: 'yaml' }` so the
files Keystatic writes are exactly the files the loaders read.

**The schema gets written twice**, once in Keystatic for the editing UI and once in zod
for validation. That duplication is the price of this approach. It is real but small,
and zod stays the authority: if the two disagree, the build fails, which is the outcome
you want.

### Where the admin runs

Keystatic's GitHub mode needs server routes at `/api/keystatic/[...params]` to hold the
OAuth token exchange. This site is static output rsynced to your box, so those routes
have nowhere to run. Three ways out:

**A. Local mode only.** `npm run dev`, edit at `localhost:4321/keystatic`, files change
on disk, you commit. Zero extra infrastructure. Fine if you are the only editor, and it
still means having the repo checked out, which is most of what you asked to avoid.

**B. Admin deployed separately (recommended).** Same repo, second deploy target on a
free Netlify or Vercel tier, pointed at `admin.lumixsolutions.org`. The admin talks only
to GitHub. The public site stays static on your own box, untouched. Costs nothing, works
from any browser including your phone, and is the version that actually satisfies
"without editing source code."

**C. SSR the whole site.** Add a Node adapter and run Astro as a service. Changes the
deploy model substantially and buys nothing else you need. Not recommended.

Go with B unless you're the only editor forever.

## 5. Phase 3 — Capacity at runtime

Capacity is a small JSON document fetched client-side on page load:

```json
{
  "updated": "2026-09-10T16:20:00Z",
  "regions": {
    "MIA": { "open": 9, "total": 48, "soldOut": false },
    "IAD": { "open": 5, "total": 48, "soldOut": false }
  },
  "games": { "fivem": { "open": 0, "soldOut": true } }
}
```

The Capacity Board server-renders a last-known state so the page is correct with JS off
and correct before the fetch lands, then reconciles. If the fetch fails it keeps the
rendered state and drops the "updated" timestamp rather than showing zeros.

> **Do not put this file in `dist/`.** The deploy runs
> `rsync -avz --delete dist/ …`, and `--delete` removes anything at the destination that
> is not in the build. A capacity file inside the deploy target gets destroyed on the
> next push, silently, and the board reverts to whatever was committed. It must live
> outside the rsync target, for example `/srv/www/lumix-runtime/capacity.json`, exposed
> same-origin through an nginx `location /api/capacity.json` alias. Same origin avoids
> CORS entirely.

## 6. Phase 4 — WHMCS as the source of truth

WHMCS already tracks stock per product. The old `soldOut` flag in `catalog.ts` was a
hand-maintained mirror of a number WHMCS already knew, which is exactly how a capacity
claim goes stale and starts lying.

A small endpoint on the billing host exposing `{ pid: qtyAvailable }` as JSON, written
into `capacity.json` on a cron or read directly, means sold-out state is never typed by
a human and cannot be wrong. You mark stock in the WHMCS admin you already use, and no
new UI exists to learn.

This is the version where the Capacity Board's honesty claim is actually true rather
than aspirational. It needs access to the WHMCS install, so it is separate work and not
a blocker for anything above.

## 7. Known traps

**Every CMS save is a production deploy.** The workflow fires on push to `main`, so a
typo fix in the staff bio rebuilds and redeploys the site and burns Actions minutes.
Either point Keystatic at a `content` branch and merge deliberately, or accept it and
watch the minutes. Decide before configuring the GitHub App, because it changes the setup.

**`rsync --delete` eats runtime state.** Covered in Phase 3. It will also eat anything
else you place on the server by hand inside that directory.

**Node version.** Astro 7 needs Node 22.12+. The workflow is already bumped to 22.

**Image handling.** `image()` in a collection schema gives real optimization for game key
art, but the files must live under `src/` rather than `public/` for Astro to process them.
Keystatic's `fields.image` needs `directory` and `publicPath` set to agree with that.

## 8. Sequence and effort

1. Content collections and zod schemas — half a day
2. Migrate content off `main` into YAML — two hours
3. Rebuild pages against the collections — depends on design build, not counted here
4. Keystatic config and admin deploy — half a day
5. Capacity JSON, nginx alias, client fetch — three hours
6. WHMCS stock endpoint — separate, depends on access

Phases 1, 2 and 3 are about a day and a half. Phase 4 whenever.

## 9. Open decisions

1. **Does anyone besides you edit this?** If yes, Phase 2 option B is required. If it is
   only ever you, option A is defensible and saves a deploy target.
2. **CMS commits straight to `main`, or to a `content` branch?** Affects the GitHub App
   config and whether a bad save can reach production unreviewed.
3. **Light mode.** DESIGN.md defines the full Paper palette but not when it applies:
   theme toggle, `prefers-color-scheme`, or specific pages like legal running light.
   This changes how every component is written, so it wants settling before the build.
