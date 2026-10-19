# Lumix Website

The marketing and storefront site for **Lumix Solutions LLC** (lumixsolutions.org), a game server hosting company. Static Astro site: it presents the games, runs the "build your server" flow, and hands the customer off to WHMCS (`billing.lumixsolutions.org`) with the cart preconfigured. It never takes payment itself.

New here? Read [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — it's the full tour. This README is the quick start. For the WHMCS integration contract (cart URL format, product IDs, the cart double-add issue), see [`HANDOFF.md`](HANDOFF.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # -> dist/
npm run preview    # serve the built output
```

Node 20 LTS or newer, npm 10+. No `.env` is needed — the site is fully static and reads no runtime config.

## Stack

- **Astro 5** — static site generator, builds to plain HTML.
- **Tailwind 4** — via `@tailwindcss/vite`. Design tokens live in `src/styles/global.css` under `@theme` (no `tailwind.config.js`).
- **TypeScript**, strict. One client-side island (`ServerBuilder.astro`) keeps the price and cart URL in sync; everything else is static.
- **`@astrojs/sitemap`** for the sitemap.

## Where things live

| Path | What |
|------|------|
| `src/data/catalog.ts` | **Source of truth** for the builder: games, plans, WHMCS pids, prices, specs, locations. |
| `src/data/site.ts` | Banner, nav, links, stats, staff, services, status services, spotlight toggle. |
| `src/lib/orderUrl.ts` | Dependency-free WHMCS cart-URL builder (ships to the browser — imports nothing). |
| `src/lib/whmcs.ts` | Server-side wrapper + price helpers. |
| `src/pages/` | File-based routes. `games/[slug].astro` is the only dynamic one. Legal pages are hand-written `.astro`. |
| `src/layouts/Layout.astro` | HTML shell, SEO/meta, JSON-LD, header/footer/banner. |
| `src/components/` | UI, including `ServerBuilder.astro`. |
| `src/styles/global.css` | Tailwind import + `@theme` design tokens. |
| `public/images/games/<slug>.jpg` | Game key art (filename matches the catalog slug). |
| `status/incidents.json` | Incident list shown on `/status`, read live from GitHub. |

Common edits (add a game, change a price, sold-out a region, edit a legal page, post an incident) are walked through in [`docs/ONBOARDING.md`](docs/ONBOARDING.md#common-tasks).

## Deploy

**Deploy is manual.** `.github/workflows/deploy.yml` is `workflow_dispatch` only — run it from the Actions tab once the deploy target is confirmed. It builds and `rsync --delete`s `dist/` to `/srv/www/lumixsolutions.org/`. Pushing to `main` does **not** ship the site.

Separately, `.github/workflows/status.yml` runs every ~5 minutes, probes the nodes and panel/billing via `scripts/status-check.mjs`, and writes results to an orphan `status-data` branch that `/status` reads live. `/status` also reads hand-written incidents from `status/incidents.json` (editable on github.com, no deploy). See [`status/README.md`](status/README.md).

Workflow secrets (set in GitHub, never committed): `SSH_KEY`, `SERVER_IP`, `SERVER_USER` (deploy), `STATUS_TARGETS` (status checker).

## Troubleshooting

- **Port 4321 in use:** `npm run dev -- --port 4322`.
- **Dependencies acting up:** `rm -rf node_modules package-lock.json && npm install`.
- **A color class doesn't exist:** add the token in `src/styles/global.css` under `@theme`. Tailwind 4 has no `tailwind.config.js` here.
