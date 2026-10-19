# CLAUDE.md — Lumix Website (redesign branch)

Full rebuild of the Lumix Solutions site. Shares almost nothing with `main` (different components, styles, content model) — don't diff them file-by-file. See `docs/ONBOARDING.md` for the walkthrough, and read the in-repo docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's list. `DESIGN.md` governs anything visual.

## What it is

Astro 7.3 + Tailwind 4.3, static, **Node 22.12+**. `cobe` drives the globe. Game server hosting, "finite servers run properly." Browsing + order hand-off only; WHMCS (`billing.lumixsolutions.org`) owns the cart, pricing, and checkout.

## Deploy

**Every push to `redesign` deploys to dev** — `deploy-dev.yml` FTP-uploads to dev.lumixsolutions.org, built with `PUBLIC_DEPLOY_ENV=dev` (noindex + robots disallow-all). Production (`deploy.yml`) is `workflow_dispatch` only. `status.yml` runs `scripts/status-check.mjs` every ~5 min and force-pushes to the orphan `status-data` branch that feeds `/status`. **A push here publishes to the dev site — know that before pushing.**

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Copy `.env.example` → `.env`: `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` (blank in dev is fine). `PUBLIC_DEPLOY_ENV=dev` is set only by the dev-deploy workflow. Never commit values.

## Where things live

- `src/content/games/*.yaml` — **game data**: plans, WHMCS pids, prices, specs, art/logo. Validated by `src/content.config.ts` — a bad pid or a `live` game with no plans **fails the build**. Prices are display copy; keep WHMCS in sync by hand.
- `src/content/legal/*.md` — terms/privacy/ccpa markdown, rendered via `src/pages/[slug].astro`.
- `src/config.ts` — everything non-game: `site`, `promo` (LUMIX10, live), `trust`, `botHosting` (single pid 6), `demoPanel`, `statusData`/`incidentsData` URLs, `links`, `nav`/`moreNav`/`footerNav`, `social`.
- `src/lib/order.ts` + `src/lib/orderOptions.ts` — cart-URL builder; `OrderBuilder.astro` is the game-page UI. Region is WHMCS group 3, **Dallas valueId = 6**, others null (greyed). `skipconfig` only sent when all groups are in the URL. No `promocode` param works on this cart.
- `src/lib/locations.ts` — globe + `/regions` + ping. `availability`: `open | sold-out | soon`. Dallas open, Ashburn/Miami sold-out, SLC soon. Keep honest against `/hardware`.
- `src/scripts/*.ts` — client-side JS, one module per surface (order-builder, status-page, ping, grid, fivem-cfg).
- `src/assets/` — images imported through `astro:assets` (webp/srcset), not `public/`.
- `src/styles/global.css` — `@theme` tokens only (`ink`, `red`, `paper`, `go`, `--chamfer`, `--shear`, `--grid-cell`). No `tailwind.config.js`.
- `status/incidents.json` — `/status` incident list, read live from GitHub (edit on github.com, no deploy). Format in `status/README.md`.
- `.mcp.json` — lumix-docs MCP at `docs.lumixsolutions.org/mcp`.

## Gotchas

- Pushing `redesign` publishes to the (noindex, public) dev site.
- `cobe` must stay in `astro.config.mjs` `optimizeDeps.include` or the globe 504s and vanishes on first scroll.
- The content schema failing the build is intentional; read the error, it names the game.
- `status-page.ts` and `scripts/status-check.mjs` share the `status.json` shape — change one, change the other.
- The region ping is a no-cors fetch timing trick, not a health endpoint; `/status` has no fake uptime number.
- Two reds per viewport max; read `DESIGN.md` §5 before adding a color.

## Conventions

- No secrets in the repo. Workflow secrets: `CPANEL_FTP_*` (dev deploy), `SSH_KEY`/`SERVER_IP`/`SERVER_USER` (prod), `STATUS_TARGETS` (status). PostHog keys are GitHub repo variables (PUBLIC_).
