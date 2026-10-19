# Lumix Website

The marketing and storefront site for **Lumix Solutions LLC** (lumixsolutions.org), a game server hosting company. Static Astro site: it presents the games, runs the per-game order builder, and hands the customer off to WHMCS (`billing.lumixsolutions.org`) with the product and region preselected. It never takes payment itself.

New here? Read [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for the full tour, then [`HANDOFF.md`](HANDOFF.md) → [`DESIGN.md`](DESIGN.md) → [`BUILD-PLAN.md`](BUILD-PLAN.md). `DESIGN.md` is the law for anything visual. `TODO.md` is Evan's personal list.

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
- **Astro content collections** — games and legal pages are schema-validated content; a bad `pid` or a `live` game with no plans fails the build.
- **PostHog** analytics + cookie banner, consent-gated.
- Client JS lives in `src/scripts/` (plain TS, one module per surface). No React.

## Where things live

| Path | What |
|------|------|
| `src/content/games/*.yaml` | Game data: plans, WHMCS pids, prices, specs, art, logo. Validated by `src/content.config.ts`. |
| `src/content/legal/*.md` | Terms / privacy / ccpa, rendered via `src/pages/[slug].astro`. |
| `src/config.ts` | Everything non-game: site, promo, trust, bot hosting, demo panel, status URLs, links, nav, social. |
| `src/lib/order.ts` + `orderOptions.ts` | Cart-URL builder and the per-game option groups (region = WHMCS group 3, Dallas valueId 6). |
| `src/lib/locations.ts` | Regions for the globe, `/regions`, and ping (`availability: open \| sold-out \| soon`). |
| `src/lib/hardware.ts` | The machines listed on `/hardware`. |
| `src/scripts/` | Client-side TS: order-builder, status-page, ping, grid, fivem-cfg. |
| `src/assets/` | Images, imported through `astro:assets` (webp/srcset), not `public/`. |
| `src/styles/global.css` | Tailwind import + `@theme` tokens. |
| `status/incidents.json` | `/status` incident list, read live from GitHub. |

Common edits are walked through in [`docs/ONBOARDING.md`](docs/ONBOARDING.md#common-tasks).

## Deploy

- **Every push to `redesign` deploys to dev** — `deploy-dev.yml` builds with `PUBLIC_DEPLOY_ENV=dev` (fully noindex) and FTP-uploads to **dev.lumixsolutions.org**. Needs `CPANEL_FTP_*` secrets; without them the build runs and the upload is skipped.
- **Production is manual** — `deploy.yml` (`workflow_dispatch`), pending the cPanel deploy path.
- **`status.yml`** runs every ~5 min, probes the nodes via `scripts/status-check.mjs`, and writes `status.json` to an orphan `status-data` branch that `/status` reads live. Needs `STATUS_TARGETS`.

## Environment variables

Names only, never commit values:

- `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST` — analytics; blank in dev renders nothing (intended).
- `PUBLIC_DEPLOY_ENV` — set to `dev` only by the dev-deploy workflow; makes every page noindex and robots disallow-all. Leave unset locally and in prod.

`node scripts/make-icons.mjs` regenerates the favicon set from the logo.

## Troubleshooting

- **Globe vanished in dev** (`504 Outdated Optimize Dep` for cobe): hard reload; if it persists, `astro dev stop && npm run dev`, then delete `node_modules/.vite` as a last resort.
- **New file's Tailwind classes missing in dev only:** `astro dev stop && npm run dev`.
- **Content stale after a schema change:** stop dev, delete `.astro/data-store.json`, restart. Never delete `.astro/` while the dev server runs.
- More traps are catalogued in [`HANDOFF.md`](HANDOFF.md#traps-that-already-cost-time).
