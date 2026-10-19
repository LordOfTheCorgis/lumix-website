# Onboarding — Lumix Website (redesign)

Welcome. This is the Lumix Solutions marketing and storefront site on the `redesign` branch. Read this top to bottom, then read the in-repo docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's personal list. `DESIGN.md` is effectively law for anything visual — read section 5 before you add a color.

> **Every push to `redesign` deploys to the dev site.** `deploy-dev.yml` builds and FTP-uploads to **dev.lumixsolutions.org** on each push (built noindex, so Google never ranks it). Production deploy is separate and manual. See [Build & deploy](#build--deploy).

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting to people who run game communities. The positioning is *"A finite number of servers, run properly."* Capped stock on purpose, honest live data, plain language.

Like main, the site does browsing and the order hand-off only. It never takes payment. Order links drop the customer into WHMCS (`billing.lumixsolutions.org`) with the product and its options preselected; WHMCS owns the cart, pricing, checkout, and provisioning.

## Tech stack

- **Astro 7.3** — static site generator, builds to plain HTML. **Needs Node 22.12+** (enforced via `engines` in `package.json`).
- **Tailwind 4.3** — via `@tailwindcss/vite`. Design tokens live in `src/styles/global.css` under `@theme` (tokens only, no component classes; see `DESIGN.md`).
- **`cobe`** — the WebGL globe on the homepage / regions. It's a dynamic import, so `astro.config.mjs` pre-bundles it in `optimizeDeps`; without that the globe "vanishes" with a 504 Outdated-Optimize-Dep on first scroll.
- **Astro content collections** — games and legal pages are typed content (`src/content/`), validated by a Zod schema at build time.
- **PostHog** — analytics + cookie banner, gated on `PUBLIC_POSTHOG_*`.
- Client-side behaviour lives in **`src/scripts/`** (plain TS modules), one per interactive surface, imported by the matching component/page. No framework, no React.

Three things to internalize early: the **content model** (games are schema-validated YAML, so a wrong `pid` or a `live` game with no plans *fails the build*), the **image pipeline** (`astro:assets` ships resized webp + srcset, so key art goes in `src/assets/`, not `public/`), and **two deploy environments** (dev on every push, prod by hand).

## Run it locally

```bash
npm install
npm run dev
```

Astro prints a local URL (usually `http://localhost:4321`). Analytics and the cookie banner render nothing without `PUBLIC_POSTHOG_*` set — which is what you want in dev.

```bash
npm run build     # -> dist/
npm run preview
```

## Project structure

```
src/
  config.ts        # EVERYTHING non-game: site info, promo code, trust, bot hosting, demo panel,
                   #   statusData/incidentsData URLs, links, nav/moreNav/footerNav, social.
  content.config.ts  # Zod schemas for the `games` and `legal` collections (build-time validation)
  content/
    games/*.yaml   # one file per game: slug, status, plans, pids, prices, specs, art, logo, accent, mark
    legal/*.md     # terms.md, privacy.md, ccpa.md — markdown with title/description/lastUpdated frontmatter
  lib/
    order.ts       # orderUrl(pid, {billingcycle, configOptions, skipConfig}) -> WHMCS cart link; CYCLES; price()
    orderOptions.ts  # per-game config groups (region = WHMCS group 3) sent as configoption[N]=valueId
    locations.ts   # HOSTING regions (availability: open|sold-out|soon) for the globe, /regions, ping
    hardware.ts    # the machines listed on /hardware
    partners.ts    # partner roster (9), rendered by Partners.astro
    staff.ts       # who runs it
    faq.ts, firstTen.ts, fivem.ts   # FAQ list, post-checkout steps, FiveM cfg-tool data
  scripts/         # CLIENT-side TS, one module per surface:
    order-builder.ts   # client half of OrderBuilder.astro (updates summary + order links)
    status-page.ts     # client half of /status (fetches status.json off the status-data branch)
    ping.ts            # browser latency probe, shared by PingTest and the order builder
    grid.ts            # keeps layout on the 40px module
    fivem-cfg.ts       # client half of the FiveM config generator
  layouts/Layout.astro   # HTML shell, SEO/meta, JSON-LD, header/footer, analytics, cookie banner, dev noindex
  components/      # OrderBuilder, Partners, Globe, PingTest, Faq, PromoBar, Header, Footer, HeroArt,
                   #   LightRays, CursorTrail, StickyCta, Included, CookieBanner, Analytics, terminal/*
  pages/
    index.astro           # homepage
    games/index.astro     # catalog
    games/[slug].astro    # per-game page (getStaticPaths over live games; Product+Offer JSON-LD; OrderBuilder)
    [slug].astro          # legal pages (getStaticPaths over the legal collection, renders markdown)
    regions.astro         # globe + region list + live ping
    hardware.astro        # the actual machines per region
    partners.astro, migrate.astro, staff.astro, contact.astro, status.astro, 404.astro
    robots.txt.ts         # dynamic robots: disallow-all on the dev build, real rules in prod
    tools/index.astro
    tools/fivem-server-cfg.astro   # free FiveM server.cfg generator
  assets/
    games/<slug>.jpg      # key art, imported (not public/)
    logos/<slug>.{webp,svg}   # game logos, 112px tall; see logos/SOURCES.md
    partners/<slug>.webp  # partner logos
    staff/, logo.png
  styles/global.css   # Tailwind import + @theme tokens (ink, red, paper, go, chamfer/shear, grid-cell)
scripts/
  status-check.mjs   # probes nodes + panel/billing, writes status.json to the status-data branch
  make-icons.mjs     # generates favicons
.github/workflows/
  deploy.yml         # PROD, manual only (workflow_dispatch)
  deploy-dev.yml     # DEV, on every push to redesign -> FTP to dev.lumixsolutions.org
  status.yml         # scheduled (~5 min) status checker -> status-data branch
.mcp.json          # lumix-docs MCP server -> docs.lumixsolutions.org/mcp
.env.example       # PostHog var names (no values)
status/
  incidents.json   # /status incident list, read live from GitHub
  README.md        # how to post an incident
HANDOFF.md, DESIGN.md, BUILD-PLAN.md, TODO.md   # read in that order; TODO is Evan's list
docs/ONBOARDING.md # this file
CLAUDE.md          # fast orientation for Claude Code (lives at root so it auto-loads)
```

### How pages are built

File-based routing under `src/pages/`. Two dynamic routes:

- `games/[slug].astro` — `getStaticPaths()` pulls the `games` collection, filters to `status === "live"`, builds a page per game, and emits `Product` + per-plan `Offer` JSON-LD off the same YAML so the schema and the on-page price table can't disagree. The order UI is `OrderBuilder.astro` (+ `src/scripts/order-builder.ts`).
- `[slug].astro` (top level) — `getStaticPaths()` over the `legal` collection, renders each markdown doc. This is how `/terms`, `/privacy`, `/ccpa` exist with no hand-written pages.

`robots.txt.ts` is a route too — it returns different rules for the dev build vs prod. Everything wraps in `Layout.astro`.

### How ordering works

`orderUrl(pid, { billingcycle, configOptions, skipConfig })` in `order.ts` builds `cart.php?a=add&pid=…&billingcycle=…&configoption[3]=<valueId>&skipconfig=1`. The game page collects the customer's region (and any future option group) via `OrderBuilder.astro`, driven by `orderOptions.ts`:

- `OPTION_GROUPS` defines the region group (WHMCS group 3). Region `valueId`s come from `orderOptions.ts` — **Dallas = 6**, others `null` (rendered greyed, not orderable).
- `skipConfig` is only sent when every option group the product has is already in the URL. Miss one and WHMCS shows its own config screen for it — degraded, not broken.
- BeamMP is in the group's `skip` list (its WHMCS product has no location group attached).

There's no `promocode` URL param — this WHMCS cart template ignores it; `LUMIX10` has to be typed into the cart box (or pre-applied via a WHMCS hook). See the comment in `order.ts`.

## Common tasks

**Add a new game.** Create `src/content/games/<slug>.yaml`, key art at `src/assets/games/<slug>.jpg`, and a logo at `src/assets/logos/<slug>.{webp,svg}` (both imported, so YAML paths are relative `../../assets/...`). Required fields and types are in `src/content.config.ts` — `accent` is a 6-digit hex, `mark` is 2–4 chars, `status` is `live | beta | planned`. A `live` game with zero plans fails the build with a message naming the game; use `planned` for teasers (dimmed on `/games`, no detail page).

**Change a plan's price.** Edit the plan's `pricing` block in its game YAML. `monthly` is required and positive; other cycles are optional. Display copy only — **change it in WHMCS too** or the cart quotes a different number. A wrong `pid` fails the build.

**Edit a legal page.** `src/content/legal/{terms,privacy,ccpa}.md`. Markdown with `title` / `description` / `lastUpdated` frontmatter; `##` headings get the bordered-section styling. Bump `lastUpdated`. (Louisiana law, New Orleans venue.)

**Change the promo / footer / nav.** All in `src/config.ts`: `promo` (`LUMIX10`, must exist in WHMCS with the same string), `nav` / `moreNav` / `footerNav` / `social`, `links`, `site`. `PromoBar.astro` reads `promo`. No rotating announcement banner like main.

**Change regions / the globe.** `src/lib/locations.ts` feeds the globe, `/regions`, and ping. `availability` is `open | sold-out | soon` (keep it honest against `/hardware` — a "sold-out" region with no machine on that page is a visible contradiction). To make a region orderable you also set its `valueId` in `orderOptions.ts` and turn the option on in WHMCS. Dallas is open; Ashburn and Miami are sold out; Salt Lake City is listed as "soon" (no node yet) — don't mark it orderable until there's a box.

**Add a machine to /hardware.** `src/lib/hardware.ts`.

**Post a status incident.** Edit `status/incidents.json` on github.com (pencil, commit to the default branch). `/status` reads it live from GitHub's raw endpoint via `config.ts`'s `incidentsData`, so it shows within ~5 min — no build, no deploy. Format in `status/README.md`.

## Build & deploy

Three workflows:

- **`deploy-dev.yml`** — on **every push to `redesign`** (and manual), builds with `PUBLIC_DEPLOY_ENV=dev` and FTP-uploads `dist/` to **dev.lumixsolutions.org** (cPanel, FTPS, user jailed to that folder). The dev build is fully noindex: `Layout.astro` sets `noindex` on every page and `robots.txt.ts` disallows everything. Needs `CPANEL_FTP_SERVER` / `CPANEL_FTP_USERNAME` / `CPANEL_FTP_PASSWORD`; until they're set the build runs and the upload is skipped (a push never fails just because nobody wired it up). **Note: pushing docs or anything else to `redesign` triggers this.**
- **`deploy.yml`** — production, `workflow_dispatch` only, run by hand from the Actions tab once the cPanel deploy path and secrets are confirmed (`SSH_KEY` / `SERVER_IP` / `SERVER_USER`). It rsyncs `--delete` to `/srv/www/lumixsolutions.org/`.
- **`status.yml`** — scheduled (~5 min) + manual; runs `scripts/status-check.mjs` and force-pushes `status.json` to an orphan **`status-data`** branch (one commit, replaced each run). Needs `STATUS_TARGETS`. `/status` reads that branch live via `config.ts`'s `statusData`.

## Environment variables

Copy `.env.example` to `.env`. Names only, never commit values:

- `PUBLIC_POSTHOG_KEY` — PostHog project API key. Blank in dev is correct (analytics + cookie banner render nothing without it).
- `PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` or the EU equivalent.
- `PUBLIC_DEPLOY_ENV` — set to `dev` only by `deploy-dev.yml`; makes every page noindex and robots disallow-all. Leave it unset locally and in prod.

## Gotchas & things that bit people before

- **Pushing `redesign` publishes to dev.** It's noindex staging, but it's public at dev.lumixsolutions.org. Know that before you push.
- **`cobe` must stay in `optimizeDeps.include`** in `astro.config.mjs`, or the globe 504s and appears to vanish on first scroll.
- **Images are `src/assets`, not `public/`.** Reference them so `astro:assets` resizes them; a raw 472KB Palworld JPG out of `public/` is what this replaced.
- **The content schema fails the build on purpose** — bad pid, live-with-no-plans, bad hex accent. Read the error, it names the game.
- **Dallas region valueId is `6`.** `orderOptions.ts` sends `configoption[3]=6`. Miami/Ashburn/SLC are `null` (greyed) until their WHMCS values are confirmed and filled in. Unlike one earlier iteration of this branch, the region *is* preselected on-site, so the valueId matters.
- **Status/ping is a timing trick, not a health endpoint.** The region ping times a no-cors fetch (`src/scripts/ping.ts`); `/status` paints `status.json` written by `scripts/status-check.mjs`. The two shapes must stay in sync.
- **`status-page.ts` and `status-check.mjs` share the `status.json` shape** — change one, change the other.
- **No `promocode` URL param works** on this cart; see `order.ts`. Don't add one.
- **`DESIGN.md` governs anything visual** — near-black warm `ink`, a single Lumix red (two reds per viewport max), Space Grotesk / Inter, hairlines (`--edge`) over fills, the chamfer/shear "diagonal" as the one signature move. Read section 5 before adding a color.
