# Onboarding — Lumix Website (main)

*The live Lumix Solutions marketing site and storefront. Read this once top to bottom, then keep the [common tasks](#common-tasks) section open while you work.*

<p>
  <a href="#what-this-is">What it is</a> ·
  <a href="#tech-stack">Stack</a> ·
  <a href="#run-it-locally">Run it</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#common-tasks">Common tasks</a> ·
  <a href="#build--deploy">Deploy</a> ·
  <a href="#gotchas--things-that-bit-people-before">Gotchas</a>
</p>

> [!IMPORTANT]
> **This branch is production, but deploy is now manual.** `main` used to rsync to lumixsolutions.org on every push; it no longer does. The deploy workflow is `workflow_dispatch` only until the deploy target is confirmed. See [Build & deploy](#build--deploy).

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting — FiveM, Minecraft, Terraria, Palworld, BeamMP, with more marked "coming soon." The audience is people who run game communities and want a server online in about a minute.

The site does **product browsing and the server builder only**. It never touches payment. Everything the builder collects gets encoded into a WHMCS cart URL and the customer is handed off to `billing.lumixsolutions.org` already configured. WHMCS owns checkout, billing, and provisioning; this site owns the storefront experience.

For the deep WHMCS contract — cart URL format, product IDs, the cart double-add issue — [`HANDOFF.md`](../HANDOFF.md) is the authoritative reference.

## Tech stack

| Piece | Why it's here |
| ----- | ------------- |
| **Astro 5** | Static site generator. Every page renders to plain HTML at build time — no server runtime, no API routes, no database. |
| **Tailwind 4** | Via `@tailwindcss/vite`. The design system is `@theme` tokens in `src/styles/global.css` (`lumix-red`, `terminal-border`, …), not a `tailwind.config.js`. |
| **TypeScript** | Strict (`astro/tsconfigs/strict`). The data files are typed; lean on that. |
| **`@astrojs/sitemap`** | Generates `sitemap-index.xml`; a build hook in `astro.config.mjs` also writes a `sitemap.xml` alias. |

The one piece of client JavaScript is the server-builder island (`ServerBuilder.astro`), which keeps the price and cart URL in sync as you click. Everything else is HTML and CSS.

## Run it locally

Node 20 LTS+, npm 10+. No `.env` needed — the site is fully static.

```bash
npm install
npm run dev        # http://localhost:4321  (port busy? --port 4322)
```

```bash
npm run build      # -> dist/
npm run preview
```

## Project structure

```
src/
  data/
    catalog.ts     # SOURCE OF TRUTH for the builder: games, plans, pids, prices, specs, locations
    site.ts        # banner, nav, links, stats, staff, services, status services, spotlight toggle
  lib/
    orderUrl.ts    # dependency-free WHMCS cart-URL builder (ships to the browser — imports NOTHING)
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
  styles/global.css   # Tailwind import + @theme design tokens + base/component styles
public/
  images/games/<slug>.jpg    # game key art (filename matches catalog slug)
  images/staff/, images/spotlight/, logo.png, og-image.png, favicon.*
scripts/status-check.mjs     # probes nodes + panel/billing every 5 min (run by the status workflow)
status/
  incidents.json   # the "Incident reports" list; /status reads it LIVE from GitHub (no deploy)
  README.md        # how to add/edit an incident on github.com
.github/workflows/
  deploy.yml       # build + rsync to the server — MANUAL (workflow_dispatch) now
  status.yml       # scheduled (every 5 min) status checker -> status-data branch
HANDOFF.md         # deep WHMCS integration contract, pid tables, cart gotchas
README.md · docs/ONBOARDING.md (this file) · CLAUDE.md
```

### How pages are built

Pages are files under `src/pages/`; the path is the route. `games/[slug].astro` is the only dynamic route — its `getStaticPaths()` maps over `liveCategories`, so a game gets a builder page only when it's `status: "live"` **and** has at least one plan. Coming-soon games show as cards on `/games` but have no detail page.

Every page wraps its content in `Layout.astro` (a `title`, optional `description` / `noindex`), which handles the `<head>`, canonical URL, Organization + WebSite JSON-LD, header, footer, and banner.

### How ordering works

1. `catalog.ts` defines each game, its plans (each with a WHMCS `pid`), prices per cycle, and the shared Location option group (id 3).
2. `ServerBuilder.astro` renders the plan / location / cycle pickers. It's progressively enhanced — the cart links work with JS off; the script only keeps the shown price and URL in sync.
3. `orderUrl.ts` builds `cart.php?a=add&pid=…&billingcycle=…&skipconfig=1&configoption[3]=<valueId>`. It **imports nothing on purpose** — it ships inside the browser island, and any import would bundle into client JS. `whmcs.ts` is the server-side wrapper that binds the billing origin from `site.ts`.
4. The customer lands in WHMCS with the item already in the cart, config screen skipped.

## Common tasks

| Task | How |
| ---- | --- |
| **Add a game** | A `GameCategory` with `status: "live"` + a `plans` array (real WHMCS `pid`s) in `catalog.ts`; art at `public/images/games/<slug>.jpg`. For a teaser, add a `ComingSoonSeed` (no WHMCS product needed) — art file first, or the tile falls back to the generated mark. |
| **Change a plan's price** | The plan's `pricing` object in `catalog.ts`. **Display copy only** — change it in WHMCS too, or the site quotes a number the cart won't honour. A missing cycle key = that cycle isn't sold. |
| **Sold-out a region** | `soldOut: true` on its `locationOptions` entry in `catalog.ts`. Card stays visible but unselectable; the builder defaults to the first still-sellable region. Display-only — stop-sell in WHMCS admin for a hard block. |
| **Edit a legal page** | `terms.astro` / `privacy.astro` / `ccpa.astro` — hand-written Astro with inline copy. Bump the `lastUpdated` const. |
| **Change the promo banner** | `announcementBanner` in `site.ts` — `enabled: false` to hide, or edit the `announcements` array (each `id`, `text`, optional `link`). |
| **Change nav / footer / links** | `site.ts`: `navigation`, `siteConfig.links`, `siteConfig.contact`. |
| **Edit homepage stats or staff** | `stats` and `leadership` arrays in `site.ts`. |
| **Toggle the spotlight** | `spotlight.enabled` in `site.ts`. Off = no homepage bar, `/spotlight` dropped from the sitemap, noindex placeholder served. Currently `false`. |
| **Post a status incident** | Edit `status/incidents.json` on github.com (commit to `main`). `/status` reads it live within ~5 min — no deploy. Format in [`status/README.md`](../status/README.md). Broken JSON makes the page skip the list and say so. |

## Build & deploy

> [!WARNING]
> Pushing to `main` does **not** deploy. The workflow is `workflow_dispatch`-only — run it by hand from the Actions tab once the deploy target and secrets are confirmed.

`.github/workflows/deploy.yml` builds and `rsync --delete`s `dist/` to `/srv/www/lumixsolutions.org/`. It used to fire on every push to `main`, which would have wiped the server the day `redesign` merged; that trigger was removed on purpose (the cPanel path decision is tracked in the repo).

`.github/workflows/status.yml` runs on a schedule (~5 min) and on demand: it runs `scripts/status-check.mjs` against the nodes and panel/billing and force-pushes `status.json` to an orphan **`status-data`** branch (one commit, replaced each run). Scheduled workflows only run from the default branch, which is why it lives on `main`.

Workflow secrets (names only, set in GitHub, never committed):

| Secret | Purpose |
| ------ | ------- |
| `SSH_KEY` | Private key for the deploy user |
| `SERVER_IP` | Deploy target host |
| `SERVER_USER` | Deploy user |
| `STATUS_TARGETS` | What the status checker probes (format in `scripts/status-check.mjs`) |

## Environment variables

There is no `.env` to build or run the site. A gitignored `.env` exists locally, but nothing in the current build reads it. Don't add env values to the repo.

## Gotchas & things that bit people before

> [!CAUTION]
> **Dallas location valueId is `6`, not 5 or 7.** WHMCS shows three different numbers for Dallas: node id `5` (Pterodactyl, never in a cart URL), the option *name* `5|Dallas, TX` (the provisioning `location_id`, also wrong for the cart), and the sub-option row id `6` — the only one `cart.php` accepts. Admin never shows that last one; read it off the live order form's `data-val`. The comment block in `catalog.ts` spells this out.

- **`HANDOFF.md`'s location table is stale** — trust `catalog.ts`. Miami and Ashburn are `soldOut`; Dallas is the only sellable region.
- **`orderUrl.ts` must never import anything.** It ships to the browser. Keep the dependency-free split with `whmcs.ts`.
- **BeamMP has no location option** (`hasLocations: false`) — adding a `configoption` to its cart URL sends a group the product rejects. Palworld and BeamMP also ship no databases.
- **`skipconfig=1` only works when every option group is in the URL.** Leave one out and WHMCS shows its own config page for the missing group.
- **Palworld `pid` jumps from 34 to 36** (35 is skipped in WHMCS). Not a typo.
- **Homepage `stats` in `site.ts` are inflated** — "12 PoPs", "10+ Tbps", "99.99% SLA" against 3 locations (1 sellable). Flagged, left alone; check with Evan before touching.
- **Tailwind 4 uses `@theme` tokens, not a `tailwind.config.js`.** Missing a color class? Add the token in `global.css`. Watch for specificity collisions between type-based and class-based selectors.

## Loose ends noticed

- `marketing-log.md` (untracked, long) is output from a daily marketing routine. Long-escalated items: generic homepage title/meta, no QBCore/ESX/roleplay copy on FiveM, no Product/Offer JSON-LD on game pages, no evergreen promo code.
- The changelog still calls Dallas "our second location" — fine historically.
- The cart double-add issue is documented in [`HANDOFF.md`](../HANDOFF.md) (fix lives in the private billing-theme repo, not built).

---

<sub>**More docs:** [README](../README.md) · [HANDOFF](../HANDOFF.md) · [status incidents](../status/README.md)</sub>
