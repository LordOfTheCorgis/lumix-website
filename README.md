# Lumix Website

The marketing and storefront site for **Lumix Solutions LLC** (lumixsolutions.org), a game server hosting company. Static Astro site: it presents the games, lists plans, and links into WHMCS (`billing.lumixsolutions.org`) with the product preselected. It never takes payment itself.

New here? Read [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for the full tour, then the project docs in order: [`HANDOFF.md`](HANDOFF.md) → [`DESIGN.md`](DESIGN.md) → [`BUILD-PLAN.md`](BUILD-PLAN.md). `DESIGN.md` is the law for anything visual. `TODO.md` is Evan's personal list.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # -> dist/
npm run preview
```

**Node 22.12+ required** (Astro 7), npm 10+. Copy `.env.example` to `.env` for analytics; blank in dev is fine (PostHog and the cookie banner render nothing without a key).

## Stack

- **Astro 7.3**, static output. **Node 22.12+.**
- **Tailwind 4.3** via `@tailwindcss/vite`. Design tokens in `src/styles/global.css` under `@theme` (no `tailwind.config.js`).
- **`cobe`** for the homepage/regions globe (pre-bundled in `astro.config.mjs` `optimizeDeps`, or it 504s on first scroll).
- **`animejs`** for the FAQ accordion height tween.
- **Astro content collections** — games and legal pages are schema-validated content; a bad `pid` or a `live` game with no plans fails the build.
- **PostHog** analytics + cookie banner, consent-gated. No React.

## Where things live

| Path | What |
|------|------|
| `src/content/games/*.yaml` | Game data: plans, WHMCS pids, prices, specs, art, logo. Validated by `src/content.config.ts`. |
| `src/content/legal/*.md` | Terms / privacy / ccpa, rendered via `src/pages/[slug].astro`. |
| `src/config.ts` | Everything non-game: site, promo, trust, bot hosting, demo panel, links, nav, social. |
| `src/lib/order.ts` | Builds the WHMCS cart link (`cart.php?a=add&pid=…`); the customer picks their region in WHMCS. |
| `src/lib/locations.ts` | Regions for the globe, `/regions`, and the ping test (`soldOut` flag per region). |
| `src/lib/ping.ts` | Browser-side latency probe used by `PingTest` and `/status`. |
| `src/assets/` | Images, imported through `astro:assets` (webp/srcset), not `public/`. |
| `src/styles/global.css` | Tailwind import + `@theme` tokens. |

Common edits are walked through in [`docs/ONBOARDING.md`](docs/ONBOARDING.md#common-tasks).

## Deploy

**Nothing deploys automatically.** `.github/workflows/deploy.yml` is `workflow_dispatch`-only and guarded with `if: false`, so it cannot fire even manually — the old rsync target is wrong and the redesign isn't going live yet. Don't put a push trigger back until the cPanel target is settled and Evan says ship it (see `BUILD-PLAN.md` and `TODO.md`). Pushing this branch does nothing to any live site.

## Environment variables

Names only, never commit values. Copy `.env.example` to `.env`:

- `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST` — analytics; blank in dev renders nothing (intended).

`node scripts/make-icons.mjs` regenerates the favicon set from `public/images/logo.png`.

## Troubleshooting

- **Globe vanished in dev** (`504 Outdated Optimize Dep` for cobe): hard reload; if it persists, `astro dev stop && npm run dev`, then delete `node_modules/.vite` as a last resort.
- **New file's Tailwind classes missing in dev only:** `astro dev stop && npm run dev`.
- **Content stale after a schema change:** stop dev, delete `.astro/data-store.json`, restart. Never delete `.astro/` while the dev server runs.
- More traps are catalogued in [`HANDOFF.md`](HANDOFF.md#traps-that-already-cost-time).
