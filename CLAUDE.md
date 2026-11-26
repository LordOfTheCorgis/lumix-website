# CLAUDE.md — Lumix Website

Lumix Solutions marketing and storefront site. See `docs/ONBOARDING.md` for the walkthrough, and read the project docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's list. `DESIGN.md` governs anything visual.

## What it is

Astro 7.4 + Tailwind 4.3, static, **Node 22.22+**. `cobe` drives the globe, the FAQ accordion is native `details` plus the Web Animations API. Game server hosting, "finite servers run properly," three US regions. Browsing + order hand-off only; WHMCS (`billing.lumixsolutions.org`) owns the cart, pricing, and checkout.

## Deploy

**Two branches deploy.** `main` -> lumixsolutions.org (`deploy.yml`, FTPS, PROD account secrets), `dev` -> dev.lumixsolutions.org (`deploy-dev.yml`, noindex build). A push to `main` is a live release. Never put the prod FTP account into the dev secrets (the dev workflow uploads to its account root).

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Copy `.env.example` → `.env`: `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` (blank in dev is fine — analytics + cookie banner render nothing). Never commit values.

`npm test` runs the cfg generator tests, `npm run check` type-checks. Pull requests run both plus a build (`.github/workflows/ci.yml`).

## Where things live

- `src/content/games/*.json` — **game data** (JSON, was YAML; the admin edits these): plans, WHMCS pids, prices, specs, art/logo. Validated by `src/content.config.ts` — a bad pid or a `live` game with no plans **fails the build**. Prices are display copy; keep WHMCS in sync by hand. Terraria is hidden (no json), art kept.
- `src/content/legal/*.md` — terms/privacy/ccpa markdown, rendered via `src/pages/[slug].astro`.
- `src/config.ts` — everything non-game: `site`, `promo` (LUMIX10, live), `trust` (Trustpilot score, hand-entered, check it against the real page), `botHosting` (one product, pid 6, runtime is a panel dropdown), `demoPanel`, `links`, `nav`/`moreNav`/`footerNav`, `social`.
- `src/lib/order.ts` — cart-URL builder: `orderUrl(pid, billingcycle, locationId?)`. Adds `configoption[3]` (the WHMCS Server Location id, `whmcsId` in `locations.ts`) so the region picked on the game page is preselected. No `skipconfig`, so the customer still sees WHMCS's config page.
- `src/data/*.json` (`locations`, `partners`, `staff`, `settings`) — the data the **admin** (PHP, `public/admin/`, see `admin/README.md`; live at lumixsolutions.org/admin) edits; `lib/locations.ts`, `partners.ts`, `staff.ts` and `config.ts` parse it with `lib/schemas.mjs` (a bad row fails the build). Hand-editing the JSON is fine, the admin just commits to it. The admin also edits the games, `src/content/legal/*.md`, and uploads images into `src/assets/{partners,staff,games,logos}`; its validation rules (`public/admin/datasets.php`) are a copy of `lib/schemas.mjs` and `content.config.ts`, keep them in step. Partner logos and staff photos are filenames in `src/assets/*`.
- `src/lib/locations.ts` — globe + `/regions` + ping. `soldOut` flag per region, in `src/data/locations.json`. Ashburn is the only open region; Dallas and Miami are sold out. WHMCS hides the same options (`hidden` flag), so flip both when a region opens or closes. Don't re-add Salt Lake City. Keep VM `ip` fields blank (public repo, browser ping leaks IPs).
- `src/lib/ping.ts` — one timed browser fetch; a refused connection still times right. `/status` and `PingTest` share it.
- `src/assets/` — images imported through `astro:assets` (webp/srcset), not `public/`.
- `src/styles/global.css` — `@theme` tokens only (`ink`, `red`, `paper`, `go`, `--chamfer`, `--shear`, `--grid-cell`). No `tailwind.config.js`.
- `.mcp.json` — lumix-docs MCP at `docs.lumixsolutions.org/mcp`.

## Gotchas

- `cobe` must stay in `astro.config.mjs` `optimizeDeps.include` or the globe 504s and vanishes on first scroll.
- The content schema failing the build is intentional; read the error, it names the game.
- `order.ts` sends the region as `configoption[3]` on purpose. The browser script in `OrderBuilder.astro` imports `orderUrl` so the two can't drift; keep it that way.
- `/status` is a refused-connection timing trick via `lib/ping.ts`, not a health endpoint; no fake uptime number.
- `astro dev` is a background daemon in Astro 7 (Ctrl+C won't stop it): `astro dev stop && npm run dev`. More dev traps in `HANDOFF.md`.
- Two reds per viewport max; read `DESIGN.md` §5 before adding a color.

## Conventions

- No secrets in the repo. The disabled deploy workflow would use `SSH_KEY`/`SERVER_IP`/`SERVER_USER`; PostHog keys are GitHub repo variables (PUBLIC_).
