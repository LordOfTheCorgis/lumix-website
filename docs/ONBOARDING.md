# Onboarding — Lumix Website (redesign)

Welcome. This is the Lumix Solutions marketing and storefront site on the `redesign` branch. Read this top to bottom, then read the project docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's personal list. `DESIGN.md` is effectively law for anything visual — read section 5 before you add a color.

> **Nothing here deploys.** The deploy workflow is disabled on purpose (`workflow_dispatch` + `if: false`). Pushing `redesign` does nothing to the live site. See [Build & deploy](#build--deploy).

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting to people who run game communities. The positioning is *"A finite number of servers, run properly."* Capped stock on purpose, honest live data, plain language, three US regions.

The site does browsing and the order hand-off only. It never takes payment. Order links drop the customer into WHMCS (`billing.lumixsolutions.org`) with the product preselected; WHMCS owns the cart, pricing, checkout, and provisioning.

## Tech stack

- **Astro 7.3** — static site generator, builds to plain HTML. **Needs Node 22.12+** (enforced via `engines` in `package.json`).
- **Tailwind 4.3** — via `@tailwindcss/vite`. Design tokens live in `src/styles/global.css` under `@theme` (tokens only, no component classes; see `DESIGN.md`).
- **`cobe`** — the WebGL globe on the homepage / regions. It's a dynamic import, so `astro.config.mjs` pre-bundles it in `optimizeDeps`; without that the globe "vanishes" with a 504 Outdated-Optimize-Dep on first scroll.
- **`animejs`** — the FAQ accordion's open/close height tween. That's its only job.
- **Astro content collections** — games and legal pages are typed content (`src/content/`), validated by a Zod schema at build time.
- **PostHog** — analytics + cookie banner, consent-gated.
- No React. No framework runtime. Site-wide JS is tiny and mostly inline per component.

Why it matters: the **content model** is the thing to internalize. Games are schema-validated YAML, not a TypeScript array, so a wrong `pid` or a `live` game with no plans *fails the build* instead of silently selling the wrong thing. Images are imported through `astro:assets` (resized webp + srcset), so key art lives in `src/assets/`, not `public/`.

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
  config.ts        # EVERYTHING non-game: site info, promo code, trust (Trustpilot), bot hosting,
                   #   demo panel, links, nav/moreNav/footerNav, social.
  content.config.ts  # Zod schemas for the `games` and `legal` collections (build-time validation)
  content/
    games/*.yaml   # one file per game: slug, status, plans, pids, prices, specs, art, logo, accent, mark
                   #   (Terraria is intentionally hidden — its yaml was removed, art kept)
    legal/*.md     # terms.md, privacy.md, ccpa.md — markdown with title/description/lastUpdated frontmatter
  lib/
    order.ts       # orderUrl(pid, billingcycle) -> WHMCS cart link. NO skipconfig, NO configoption.
    locations.ts   # HOSTING regions (with `soldOut`) for the globe, /regions, and the ping test
    ping.ts        # one timed browser fetch; a refused connection still times right (see the comment)
    faq.ts         # pre-sale FAQ list -> <details> + FAQPage JSON-LD
    firstTen.ts    # per-game "your first ten minutes" post-checkout steps (sourced from the docs)
    fivem.ts       # data behind the /tools FiveM server.cfg generator
    partners.ts, staff.ts   # roster data
  layouts/Layout.astro   # HTML shell, SEO/meta, JSON-LD, header/footer, analytics, cookie banner, CursorTrail
  components/      # Header, Footer, GameTile, PromoBar, BotLine, Globe, PingTest, HeroArt, LightRays,
                   #   CursorTrail, Faq, StickyCta, Included, CookieBanner, Analytics, terminal/*
  pages/
    index.astro           # homepage (one job: into a cart)
    games/index.astro     # catalog
    games/[slug].astro    # per-game page (getStaticPaths over live games; Product+Offer JSON-LD)
    [slug].astro          # legal pages (getStaticPaths over the legal collection, renders markdown)
    regions.astro         # globe + region list + live ping
    status.astro          # browser-ping status of regions and VMs (no fake uptime history)
    migrate.astro, partners.astro, staff.astro, contact.astro, 404.astro
    tools/index.astro
    tools/fivem-server-cfg.astro   # free FiveM server.cfg generator
  assets/
    games/<slug>.jpg      # key art, imported (not public/)
    logos/<slug>.{webp,svg}   # game logos; staff/, logo.png
  styles/global.css   # Tailwind import + @theme tokens (ink, red, paper, go, chamfer/shear, grid-cell)
scripts/make-icons.mjs   # regenerates favicons from the logo
.mcp.json          # lumix-docs MCP server -> docs.lumixsolutions.org/mcp
.env.example       # PostHog var names (no values)
HANDOFF.md, DESIGN.md, BUILD-PLAN.md, TODO.md   # read in that order; TODO is Evan's list
docs/ONBOARDING.md # this file
CLAUDE.md          # fast orientation for Claude Code (lives at root so it auto-loads)
brag-output/       # a rendered launch video from the brag skill (not part of the site build)
```

### How pages are built

File-based routing under `src/pages/`. Two dynamic routes:

- `games/[slug].astro` — `getStaticPaths()` pulls the `games` collection, filters to `status === "live"`, and builds a page per game. It also emits `Product` + per-plan `Offer` JSON-LD off the same YAML, so the schema and the on-page price table can't disagree.
- `[slug].astro` (top level) — `getStaticPaths()` over the `legal` collection, renders each markdown doc. This is how `/terms`, `/privacy`, `/ccpa` exist with no hand-written pages.

Everything wraps in `Layout.astro`.

### How ordering works

`order.ts` builds `cart.php?a=add&pid=…&billingcycle=…` and nothing else. **No `skipconfig=1`, no `configoption` on purpose** — WHMCS shows its own region picker, which costs one extra click but means the site never quotes a region that's out of stock.

### How /status works

`status.astro` pings each region (and its VMs, plus billing/panel) from the visitor's browser via `src/lib/ping.ts`. The node IPs don't serve HTTP — the ports refuse the connection — but a refused connect still completes in one round trip, so the time-to-failure *is* the ping. There's no uptime history and no backend; read the comment block in `ping.ts` before touching it.

## Common tasks

**Add a new game.** Create `src/content/games/<slug>.yaml`, key art at `src/assets/games/<slug>.jpg`, and a logo at `src/assets/logos/<slug>.{webp,svg}` (both imported, so YAML paths are relative `../../assets/...`). Required fields and types are in `src/content.config.ts` — `accent` is a 6-digit hex, `mark` is 2–4 chars, `status` is `live | beta | planned`. A `live` game with zero plans fails the build with a message naming the game; use `planned` for teasers (dimmed on `/games`, no detail page). Terraria currently has no yaml (hidden by design); re-add one to bring it back.

**Change a plan's price.** Edit the plan's `pricing` block in its game YAML. `monthly` is required and positive; other cycles are optional. Display copy only — **change it in WHMCS too** or the cart quotes a different number. A wrong `pid` fails the build.

**Edit a legal page.** `src/content/legal/{terms,privacy,ccpa}.md`. Markdown with `title` / `description` / `lastUpdated` frontmatter; `##` headings get the bordered-section styling. Bump `lastUpdated`. (Louisiana law, New Orleans venue — Terms §7/§9 and counsel review are tracked in `TODO.md`.)

**Change the promo / footer / nav.** All in `src/config.ts`: `promo` (`LUMIX10`, must exist in WHMCS with the same string), `nav` / `moreNav` / `footerNav` / `social`, `links`, `site`. `PromoBar.astro` reads `promo`. `trust` holds the hand-entered Trustpilot score/count (both set = the line renders). `botHosting` holds the three bot-hosting WHMCS pids (Node 7 / Python 8 / Go 9), rendered by `BotLine.astro`.

**Change regions / the globe.** `src/lib/locations.ts` feeds the globe, `/regions`, and the ping. Set `soldOut: true` to cap a region (stays listed, existing servers keep running). Dallas is live; Ashburn and Miami are sold out. **Salt Lake City was removed and must not be re-added until there's a real node.** Leave VM `ip` fields blank — a browser ping puts the IP in the page source and this repo is public; Evan does not want VM IPs public.

## Build & deploy

**Nothing deploys automatically.** `.github/workflows/deploy.yml` is `workflow_dispatch`-only *and* its job is guarded with `if: false`, so it does nothing even when run by hand. The rsync target it carries points at the wrong box, and the redesign isn't going to production yet. Don't restore a push trigger until the deploy target is confirmed and Evan says ship it (`BUILD-PLAN.md` and `TODO.md` track the cPanel decision). When it does build, it uses `npm ci` and passes `PUBLIC_POSTHOG_*` through as GitHub repo variables (not secrets — they're `PUBLIC_` and end up in page source anyway).

## Environment variables

Copy `.env.example` to `.env`. Names only, never commit values:

- `PUBLIC_POSTHOG_KEY` — PostHog project API key. Blank in dev is correct (analytics + cookie banner render nothing without it).
- `PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` or the EU equivalent.

`.env` is gitignored.

## Gotchas & things that bit people before

- **`cobe` must stay in `optimizeDeps.include`** in `astro.config.mjs`, or the globe 504s and appears to vanish on first scroll.
- **Images are `src/assets`, not `public/`.** Reference them so `astro:assets` resizes them; a raw 472KB Palworld JPG out of `public/` is what this replaced.
- **The content schema fails the build on purpose** — bad pid, live-with-no-plans, bad hex accent. Read the error, it names the game.
- **`order.ts` sends no region param by design** — the customer picks the region in WHMCS. Don't "fix" it by adding `configoption`.
- **`/status` is a timing trick, not a health endpoint.** The region ping times a refused connection (`lib/ping.ts`); there's no uptime history. VM `ip` fields stay blank (public repo).
- **`astro dev` is a background daemon in Astro 7** — Ctrl+C doesn't stop it. Restart with `astro dev stop && npm run dev`. Several dev-only traps (stale content store, Tailwind not seeing a new file, cobe 504) are catalogued in `HANDOFF.md` → "Traps that already cost time".
- **`DESIGN.md` governs anything visual** — near-black warm `ink`, a single Lumix red (two reds per viewport max), Space Grotesk / Inter, hairlines (`--edge`) over fills, the chamfer/shear "diagonal" as the one signature move. Read section 5 before adding a color.
