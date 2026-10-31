# CLAUDE.md — Lumix Website (main branch)

Static Astro marketing site for Lumix Solutions LLC (lumixsolutions.org), a game server hosting company. See `docs/ONBOARDING.md` for the full walkthrough and `HANDOFF.md` for the WHMCS integration contract. This file is the fast orientation.

## What it is

Astro 5 + Tailwind 4, fully static, no server runtime. The site does product browsing and the "build your server" flow; WHMCS (`billing.lumixsolutions.org`) owns checkout, billing, and provisioning. The builder encodes everything into a `cart.php` URL and hands the customer off already configured.

## Deploy

**Push to `main` deploys.** `.github/workflows/deploy.yml` builds and uploads `dist/` to `lumixsolutions.org` on cPanel over FTPS, same box and same `SamKirkland/FTP-Deploy-Action` as the dev workflow — it only manages files it uploaded, so nothing else in `public_html` gets wiped (no more `rsync --delete`). Uses the same `CPANEL_FTP_SERVER` / `CPANEL_FTP_USERNAME` / `CPANEL_FTP_PASSWORD` secrets as the dev workflow — the one difference is `server-dir: ../`, which lands in `public_html` (the live docroot) instead of the `dev.lumixsolutions.org` subfolder the account logs into. Until the secrets are set the build runs and the upload is skipped, so a push never fails. A separate scheduled workflow, `.github/workflows/status.yml`, runs `scripts/status-check.mjs` every ~5 min and force-pushes results to an orphan `status-data` branch that feeds `/status`.

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
- `status/incidents.json` — the `/status` incident list, read live from GitHub (edit on github.com, no deploy). Format in `status/README.md`.

## Gotchas

- **Dallas location valueId is `6`** — not the node id (5) or the option name (`5|Dallas, TX`). Read it off the live order form's `data-val`. See the comment block in `catalog.ts`.
- `HANDOFF.md`'s location table is stale; trust `catalog.ts`. Miami + Ashburn are `soldOut`, Dallas is the only sellable region.
- BeamMP has `hasLocations: false` (no location group in WHMCS). Palworld/BeamMP ship no databases. Palworld pid skips 35 → 36.
- `skipconfig=1` only bypasses the WHMCS config screen when every option group is in the URL.
- Homepage `stats` in `site.ts` are inflated vs reality — flagged, don't touch without asking.

## Conventions

- This is the production branch and a push to `main` ships to the live site. Treat `main` as live.
- No secrets in the repo. Workflow secrets: `CPANEL_FTP_SERVER` / `CPANEL_FTP_USERNAME` / `CPANEL_FTP_PASSWORD` (deploy — shared by prod and dev, prod just lands a level up in `public_html`), `STATUS_TARGETS` (status checker). The old `SSH_KEY` / `SERVER_IP` / `SERVER_USER` are no longer used.
