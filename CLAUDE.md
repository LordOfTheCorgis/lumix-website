# CLAUDE.md — Lumix Website (main branch)

Static Astro marketing site for Lumix Solutions LLC (lumixsolutions.org), a game server hosting company. See `ONBOARDING.md` for the full walkthrough and `HANDOFF.md` for the WHMCS integration contract. This file is the fast orientation.

## What it is

Astro 5 + Tailwind 4, fully static, no server runtime. The site does product browsing and the "build your server" flow; WHMCS (`billing.lumixsolutions.org`) owns checkout, billing, and provisioning. The builder encodes everything into a `cart.php` URL and hands the customer off already configured.

## Deploy

**Pushing to `main` deploys to production** via `.github/workflows/deploy.yml` (build + rsync `dist/` to the server). No staging. Work on branches, open PRs.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Node 20+, npm 10+.

## Where things live

- `src/data/catalog.ts` — **source of truth** for the server builder: games, plans, WHMCS pids, prices, specs, locations. Prices are display copy; WHMCS is the system of record, keep them in sync by hand.
- `src/data/site.ts` — announcement banner, nav, `siteConfig.links`/`.contact`, homepage stats, staff, services, status services, spotlight toggle.
- `src/lib/orderUrl.ts` — dependency-free cart-URL builder; **imports nothing** because it ships to the browser inside the `ServerBuilder` island.
- `src/lib/whmcs.ts` — server-side wrapper + price formatting.
- `src/layouts/Layout.astro` — HTML shell, SEO/meta, JSON-LD, header/footer/banner.
- `src/pages/` — file-based routes. `games/[slug].astro` is the only dynamic route (`getStaticPaths` over live categories). Legal pages (`terms`, `privacy`, `ccpa`) are hand-written `.astro` with inline markup.
- `src/styles/global.css` — Tailwind import + `@theme` design tokens (`lumix-red`, `terminal-border`, etc). No `tailwind.config.js`.
- `public/images/games/<slug>.jpg` — game key art, filename matches the catalog slug.

## Gotchas

- **Dallas location valueId is `6`** — not the node id (5) or the option name (`5|Dallas, TX`). Read it off the live order form's `data-val`. See the comment block in `catalog.ts`.
- `HANDOFF.md`'s location table is stale; trust `catalog.ts`. Miami + Ashburn are `soldOut`, Dallas is the only sellable region.
- BeamMP has `hasLocations: false` (no location group in WHMCS). Palworld/BeamMP ship no databases. Palworld pid skips 35 → 36.
- `skipconfig=1` only bypasses the WHMCS config screen when every option group is in the URL.
- Homepage `stats` in `site.ts` are inflated vs reality — flagged, don't touch without asking.

## Conventions

- Don't change production content casually; this branch deploys on push.
- No secrets in the repo. The deploy workflow's `SSH_KEY` / `SERVER_IP` / `SERVER_USER` are GitHub secrets.
