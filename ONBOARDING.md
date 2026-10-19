# Onboarding — Lumix Website (main)

Welcome. This is the live Lumix Solutions marketing site. Read this top to bottom once, then keep it open for the "common tasks" section while you work. If you want the deep WHMCS contract, `HANDOFF.md` is the authoritative reference for billing integration.

> **This branch is production.** Pushing to `main` deploys to lumixsolutions.org automatically. There is no staging step. See [Build & deploy](#build--deploy).

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting — FiveM, Minecraft, Terraria, Palworld, BeamMP, with more marked "coming soon." The audience is people who run game communities and want a server online in about a minute.

The site does **product browsing and the server builder only**. It never touches payment. Everything the builder collects gets encoded into a WHMCS cart URL and the customer is handed off to `billing.lumixsolutions.org` already configured. WHMCS owns checkout, billing, and provisioning; this site owns the storefront experience.

## Tech stack

- **Astro 5** — static site generator. Every page renders to plain HTML at build time. No server runtime in production, just files behind rsync.
- **Tailwind 4** — via `@tailwindcss/vite`, not a PostCSS config. The design system lives in `src/styles/global.css` under an `@theme` block (custom color tokens like `lumix-red`, `terminal-border`). Classes like `text-lumix-red` come from those tokens.
- **TypeScript** — strict (`astro/tsconfigs/strict`). The data files are typed; lean on that.
- **`@astrojs/sitemap`** — generates `sitemap-index.xml`; a custom build hook in `astro.config.mjs` also copies it to `sitemap.xml` as an alias.

Why it matters: because it's fully static, there are no secrets at runtime, no API routes, no database. The one piece of client JavaScript is the server builder island (`ServerBuilder.astro`), which keeps prices and the cart URL in sync as you click. Everything else is HTML and CSS.

Node 20 LTS or newer, npm 10 or newer. (`README.md` says the same; the GitHub Actions runner uses Node 20.)

## Run it locally

```bash
npm install
npm run dev
```

Astro prints a local URL, usually `http://localhost:4321`. Edits under `src/` hot-reload. If 4321 is taken: `npm run dev -- --port 4322`.

Production build and local preview of the built output:

```bash
npm run build      # outputs to dist/
npm run preview
```

## Project structure

```
src/
  data/
    catalog.ts     # SOURCE OF TRUTH for the server builder: games, plans, pids, prices, specs, locations
    site.ts        # banner, nav, links, stats, staff, services, status services, spotlight toggle
  lib/
    orderUrl.ts    # dependency-free WHMCS cart-URL builder (shipped to the browser — imports NOTHING)
    whmcs.ts       # server-side wrapper around orderUrl + price formatting helpers
  layouts/
    Layout.astro   # the HTML shell: head, SEO/meta, JSON-LD, header, footer, announcement banner
  components/
    ServerBuilder.astro   # the client island: plan/location/cycle pickers, live price + cart URL
    AnnouncementBanner.astro, Header.astro, Footer.astro, GameTile.astro,
    ServiceCard.astro, Slideshow.astro, SpotlightContent.astro, StatusCard.astro, Terminal.astro
  pages/
    index.astro           # homepage
    games/index.astro     # catalog grid
    games/[slug].astro     # per-game builder page (getStaticPaths off liveCategories)
    terms.astro, privacy.astro, ccpa.astro   # legal (hand-written .astro, inline markup)
    status.astro          # live ping status cards
    staff.astro, partners.astro, contact.astro, changelog.astro, spotlight.astro
    career/index.astro, career/application.astro
  styles/
    global.css     # Tailwind import + @theme design tokens + base/component styles
public/
  images/games/<slug>.jpg    # game key art (filename matches catalog slug)
  images/staff/, images/spotlight/, logo.png, og-image.png, favicon.*
astro.config.mjs   # site URL, sitemap integration + alias hook, Tailwind vite plugin
.github/workflows/deploy.yml   # build + rsync to the server on push to main
HANDOFF.md         # deep WHMCS integration contract, pid tables, cart gotchas
README.md          # short setup reference
```

### How pages are built

Pages are files under `src/pages/`. The path is the route. `games/[slug].astro` is the only dynamic route: its `getStaticPaths()` maps over `liveCategories` from the catalog, so a game gets a builder page only when it's `status: "live"` **and** has at least one plan. Coming-soon games show as cards on `/games` but have no detail page.

Every page wraps its content in `Layout.astro`, passing a `title` and optional `description` / `noindex`. The layout handles all `<head>` tags, canonical URL, Organization + WebSite JSON-LD, and renders the header, footer, and announcement banner.

### How ordering works

1. `catalog.ts` defines each game, its plans (each with a WHMCS `pid`), prices per billing cycle, and the shared Location option group (id 3).
2. `ServerBuilder.astro` renders plan / location / billing-cycle pickers. It's progressively enhanced — the cart links work with JS off; the script only keeps the displayed price and the cart URL in sync as you click.
3. `orderUrl.ts` builds `cart.php?a=add&pid=…&billingcycle=…&skipconfig=1&configoption[3]=<locationValueId>`. It **imports nothing on purpose** — it ships to the browser inside the island, and any import (site config, catalog) would get bundled into client JS. `whmcs.ts` is the server-side wrapper that binds the billing origin from `site.ts`.
4. The customer lands in WHMCS with the item already in the cart, config screen skipped.

## Common tasks

**Add a new game page.** Edit `src/data/catalog.ts`. Add a `GameCategory` with `status: "live"` and a `plans` array (each plan needs a real WHMCS `pid` read off the live storefront). Drop key art at `public/images/games/<slug>.jpg` and set `image` to that path. The builder page and catalog card generate automatically. To add it as "coming soon" instead, add a `ComingSoonSeed` entry (no WHMCS product needed yet) — add the art file first or the tile falls back to the generated mark.

**Change a plan's price.** Edit the `pricing` object for that plan in `catalog.ts`. These numbers are **display copy only** — WHMCS is the system of record. Change the price in WHMCS admin too, or the site quotes a number the cart won't honour. A missing cycle key means that cycle isn't sold.

**Take a region off the market.** Set `soldOut: true` on its entry in `locationOptions` in `catalog.ts`. The card stays visible but unselectable; the builder defaults to the first still-sellable region. This is display-only — WHMCS will still accept the valueId from a hand-built URL, so also stop-sell it in WHMCS admin for a hard block.

**Edit a legal page.** `terms.astro`, `privacy.astro`, `ccpa.astro` under `src/pages/`. These are hand-written Astro files with the copy inline (not markdown). Update the `lastUpdated` const at the top when you change the text.

**Change the promo / announcement banner.** `announcementBanner` in `src/data/site.ts` — set `enabled: false` to hide it, or edit the `announcements` array (each has `id`, `text`, optional `link`). It rotates through them.

**Change the footer / nav / links.** `src/data/site.ts`: `navigation` for the nav, `siteConfig.links` for billing/panel/social URLs, `siteConfig.contact` for email addresses. The footer reads these.

**Edit homepage stats or staff.** `stats` and `leadership` arrays in `site.ts`.

**Toggle the spotlight.** `spotlight.enabled` in `site.ts`. When false it kills the homepage broadcast bar, drops `/spotlight` from the sitemap, and serves a noindex placeholder. Currently `false` (PBRP is gone).

## Build & deploy

`.github/workflows/deploy.yml` fires on every push to `main`: checks out, `npm install`, `npm run build`, then `rsync -avz --delete dist/` to the server at `/srv/www/lumixsolutions.org/` over SSH.

**Pushing to main = going live.** No staging, no manual approval. Do real work on a branch and open a PR.

Secrets used by the workflow (names only, set in GitHub repo settings — never commit values):

- `SSH_KEY` — private key for the deploy user
- `SERVER_IP` — target host
- `SERVER_USER` — deploy user

## Environment variables

There is no `.env` needed to build or run the site — it's fully static. A `.env` file exists locally and is gitignored (`.env`, `.env.production`), but nothing in the current build reads it. The README's "no env required" line is correct for the build; don't add env values to the repo.

## Gotchas & things that bit people before

- **Dallas location valueId is `6`, not 5 or 7.** WHMCS shows you three different numbers for Dallas: node id `5` (Pterodactyl, never in a cart URL), the option *name* `5|Dallas, TX` (the location_id for provisioning, also wrong for the cart), and the sub-option row id `6` (the only one `cart.php` accepts). Admin never shows that last one. Read it off the live order form's `data-val`. The comment block in `catalog.ts` spells this out — read it before touching locations.
- **`HANDOFF.md`'s location table is stale** (no Dallas, still lists Miami + Ashburn as live). Trust `catalog.ts`. Miami and Ashburn are both `soldOut: true` right now; Dallas is the only sellable region.
- **`orderUrl.ts` must never import anything.** It ships to the browser. Keep the dependency-free split with `whmcs.ts`.
- **BeamMP has no location option** (`hasLocations: false`). Its WHMCS products don't have the location group attached, so adding one to the cart URL would send a configoption the product rejects. Palworld and BeamMP also ship no databases.
- **`skipconfig=1` only works when every configurable option group has a value in the URL.** Leave one out and WHMCS shows its own config page for the missing group.
- **Palworld `pid` jumps from 34 to 36** (35 is skipped in WHMCS). Not a typo.
- **Homepage `stats` in `site.ts` are inflated** — "12 PoPs", "10+ Tbps mitigated", "99.99% SLA" against 3 locations (1 sellable). Flagged, left alone. Check with Evan before touching.
- **Tailwind 4 uses `@theme` tokens, not a tailwind.config.js.** If a color class doesn't exist, add the token in `global.css`. Watch for CSS specificity collisions between type-based and class-based selectors.

## TODOs noticed

- `marketing-log.md` (untracked, long) is output from a daily marketing routine. Long-escalated items: generic homepage title/meta, no QBCore/ESX/roleplay copy on FiveM, no Product/Offer JSON-LD on game pages, no evergreen promo code.
- The changelog still calls Dallas "our second location" — fine historically.
- Cart double-add issue is documented in `HANDOFF.md` (fix lives in the private billing-theme repo, not built).
