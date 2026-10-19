# Onboarding — Lumix Website (redesign)

Welcome. This is the **full rebuild** of the Lumix Solutions site on the `redesign` branch. It shares nothing with `main` — different components, styles, layout, and content model. Don't try to merge or reconcile the two; `main` is a content reference only.

Read this top to bottom, then read the in-repo docs in this order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's personal list (things only he can do). `DESIGN.md` is effectively law for anything visual — read section 5 before you add a color.

> **This branch does not deploy.** The deploy workflow is disabled on purpose. See [Build & deploy](#build--deploy). Pushing `redesign` does nothing to the live site.

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting to people who run game communities. The positioning here is sharper than main: *"A finite number of servers, run properly."* Intentionally capped stock, honest live data, plain language, three US regions.

Like main, the site does browsing and the order hand-off only. It never takes payment. The order links drop the customer into WHMCS (`billing.lumixsolutions.org`) with the product preselected; WHMCS owns checkout, billing, and provisioning.

## Tech stack

- **Astro 7.3** — static site generator, builds to plain HTML. **Needs Node 22.12+** (enforced via `engines` in `package.json`).
- **Tailwind 4.3** — via `@tailwindcss/vite`. Design tokens live in `src/styles/global.css` under `@theme`. No component classes there, tokens only (see `DESIGN.md`).
- **`animejs`** — the FAQ accordion animation.
- **`cobe`** — the WebGL globe on the homepage / regions. It's a dynamic import, so `astro.config.mjs` pre-bundles it in `optimizeDeps` (without that, the globe "vanishes" with a 504 Outdated-Optimize-Dep on first scroll).
- **Astro content collections** — games and legal pages are typed content (`src/content/`), validated by a Zod schema at build time.
- **PostHog** — analytics + cookie banner, gated on `PUBLIC_POSTHOG_*` env vars.
- No React. No server runtime in production.

Why it matters: the content model is the big shift from main. Games aren't a TypeScript array anymore, they're YAML files validated by a schema. A wrong `pid` or a `live` game with no plans **fails the build** instead of silently selling the wrong thing. Images are imported through `astro:assets` so they ship as resized webp with srcset, not raw JPGs out of `public/`.

## Run it locally

```bash
npm install
npm run dev
```

Astro prints a local URL (usually `http://localhost:4321`). Analytics and the cookie banner render nothing without `PUBLIC_POSTHOG_*` set, which is exactly what you want in dev.

```bash
npm run build     # -> dist/
npm run preview
```

## Project structure

```
src/
  config.ts        # EVERYTHING non-game: site info, promo code, trust/Trustpilot, bot hosting,
                   #   demo panel, links, nav/moreNav/footerNav, social. Replaces main's site.ts.
  content.config.ts  # Zod schemas for the `games` and `legal` collections (build-time validation)
  content/
    games/*.yaml   # one file per game: slug, status, plans, pids, prices, specs, art, logo, accent
                   #   (terraria is intentionally hidden — yaml deleted, art kept; recover from f40e53e)
    legal/*.md     # terms.md, privacy.md, ccpa.md — markdown with title/description/lastUpdated frontmatter
  lib/
    order.ts       # cart-URL builder: NO skipconfig, NO configoption (customer picks region in WHMCS)
    locations.ts   # HOSTING locations for the globe + /regions, with ping targets and VMs
    ping.ts        # one timed browser fetch; refused-connection time == ping (see the comment, it's clever)
    faq.ts         # pre-sale FAQ list -> <details> + FAQPage JSON-LD
    firstTen.ts    # per-game "what happens after checkout" steps (sourced from docs.lumixsolutions.org)
    fivem.ts       # data behind the /tools FiveM config generator
    partners.ts, staff.ts   # roster data
  layouts/Layout.astro   # HTML shell, SEO/meta, JSON-LD, header/footer, analytics, cookie banner
  components/      # Globe, PingTest, Faq, PromoBar, BotLine, Header, Footer, HeroArt, LightRays,
                   #   CursorTrail, StickyCta, Included, CookieBanner, Analytics, terminal/*
  pages/
    index.astro           # homepage
    games/index.astro     # catalog
    games/[slug].astro    # per-game page (getStaticPaths over live games; builds Product+Offer JSON-LD)
    [slug].astro          # legal pages (getStaticPaths over the legal collection, renders markdown)
    regions.astro         # globe + region list + live ping
    migrate.astro, partners.astro, staff.astro, contact.astro, status.astro, 404.astro
    tools/index.astro
    tools/fivem-server-cfg.astro   # free FiveM server.cfg generator
  assets/
    games/<slug>.jpg      # key art, imported (not public/)
    logos/<slug>.{webp,svg}   # publisher/wikimedia logos, 112px tall; see logos/SOURCES.md
    staff/, logo.png
  styles/global.css   # Tailwind import + @theme tokens (ink, red, paper, go, chamfer/shear, grid-cell)
scripts/make-icons.mjs   # generates favicons
.mcp.json          # lumix-docs MCP server -> docs.lumixsolutions.org/mcp
.env.example       # PostHog var names (no values)
HANDOFF.md, DESIGN.md, BUILD-PLAN.md, TODO.md   # read in that order; TODO is Evan's list
brag-output/       # a rendered launch video from the brag skill (not part of the site build)
```

### How pages are built

File-based routing under `src/pages/`. Two dynamic routes:

- `games/[slug].astro` — `getStaticPaths()` pulls the `games` collection, filters to `status === "live"`, and builds a page per game. It also emits `Product` + per-plan `Offer` JSON-LD off the same YAML, so the schema and the on-page price table can't disagree.
- `[slug].astro` (top level) — `getStaticPaths()` over the `legal` collection, renders each markdown doc. This is how `/terms`, `/privacy`, `/ccpa` exist without hand-written pages.

Everything wraps in `Layout.astro`.

### How ordering works

`order.ts` builds `cart.php?a=add&pid=…&billingcycle=…` and nothing else. **No `skipconfig=1`, no `configoption` on purpose** — WHMCS shows its own region picker, which costs one extra click but means the site never quotes a region that's out of stock. This is a deliberate reversal of main's approach, so **main's Dallas valueId-6 gotcha does not apply here.**

## Common tasks

**Add a new game.** Create `src/content/games/<slug>.yaml`. Add the key art at `src/assets/games/<slug>.jpg` and a logo at `src/assets/logos/<slug>.{webp,svg}` (both are imported, so the paths in the YAML are relative `../../assets/...`). Required fields and their types are in `src/content.config.ts` — `accent` must be a 6-digit hex, `mark` is 2–4 chars, `status` is `live | beta | planned`. A `live` game with zero plans fails the build with a message naming the game; use `planned` for teasers (shows dimmed on `/games`, no detail page).

**Change a plan's price.** Edit the plan's `pricing` block in its game YAML. `monthly` is required and must be positive; other cycles (`quarterly`, `annually`, etc) are optional via the schema's `catchall`. These are display copy — **WHMCS is the system of record, change it there too** or the cart quotes a different number. `pid` is validated as a positive int; a wrong one fails the build rather than selling the wrong product.

**Edit a legal page.** `src/content/legal/{terms,privacy,ccpa}.md`. Plain markdown with `title` / `description` / `lastUpdated` frontmatter. `##` headings get the bordered-section styling automatically. Bump `lastUpdated` when the text changes. (These are Louisiana-law, New Orleans venue. Terms §7/§9 and counsel review are tracked in the brain notes / TODO.)

**Change the promo / footer / nav.** All in `src/config.ts`:
- `promo` — the code (`LUMIX10`, 10%, `live: true`). It must exist in WHMCS with the same string or the cart rejects it.
- `nav` (header, 4 items), `moreNav` (the More drawer), `footerNav` (footer columns), `social`.
- `links` and `site` — URLs and company info.
- There's no rotating announcement banner like main; `PromoBar.astro` reads `promo`.

**Change regions / the globe.** `src/lib/locations.ts` is the one source for both the globe and `/regions`. Set `soldOut: true` to cap a node (stays listed, existing servers keep running). Dallas is live; Miami and Ashburn are sold out. **Salt Lake City was removed and must not be re-added until there's a real node.** Leave VM `ip` fields blank — a browser ping puts the IP in the page source and this repo is public; Evan does not want VM IPs public.

## Build & deploy

`.github/workflows/deploy.yml` is **`workflow_dispatch` only and has `if: false` on the job** — it cannot fire, even manually. The redesign is not going to production yet, and the deploy secrets point at the wrong box (per Evan, 2026-09-23). Don't restore a push trigger until the target is fixed and Evan says ship it.

When it does run, it's `npm ci` + build + rsync `dist/` to `/srv/www/lumixsolutions.org/`. Build-time PostHog keys come from GitHub **repo variables** (`PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`), not secrets — they're `PUBLIC_` keys that end up in page source anyway. SSH deploy uses the `SSH_KEY` / `SERVER_IP` / `SERVER_USER` secrets.

## Environment variables

Copy `.env.example` to `.env`. Names only, never commit values:

- `PUBLIC_POSTHOG_KEY` — PostHog project API key. Blank in dev is correct; analytics + cookie banner render nothing without it.
- `PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` or the EU equivalent.

`.env` is gitignored.

## Gotchas & things that bit people before

- **`cobe` must stay in `optimizeDeps.include`** in `astro.config.mjs`. It's a dynamic import; without pre-bundling, the globe 504s on first scroll and appears to vanish.
- **Images are `src/assets`, not `public/`.** Reference them so `astro:assets` can resize them. A raw 472KB Palworld JPG out of `public/` is what this replaced.
- **The content schema fails the build, deliberately** — bad pid, live-with-no-plans, bad hex accent. That's a feature; read the error, it names the game.
- **`order.ts` sends no `configoption`.** Don't "fix" it by adding region params; the customer picks the region in WHMCS by design.
- **Status / ping is a trick, not a real health endpoint.** The node IPs don't serve HTTP; `ping.ts` times the refused connection, which is one round trip, so the failure time *is* the ping. `/status` covers regions and VMs only and has no uptime history on purpose. Read the comment block in `ping.ts` before touching it.
- **VM IP fields stay blank** (public repo, browser pings leak the IP into page source). Node IPs are already in `locations.ts` for the region pings; that was Evan's call.
- **Terraria is hidden**, not deleted — its YAML was removed (recover from commit `f40e53e`) but the art stays. FiveM/home copy already reflects it being gone.
- **`DESIGN.md` governs anything visual.** Near-black warm `ink` + a single Lumix red + Space Grotesk/Inter, hairlines (`--edge`) instead of fills, the chamfer/shear "diagonal" as the one signature move. Two reds per viewport max. Don't add a color without reading section 5.
- **Local `redesign` has been ahead of `origin/redesign` before.** Check `git status` / `git log origin/redesign..redesign` so you're reading the real current state.

## Differences from main

| | `main` (live) | `redesign` (this branch) |
|---|---|---|
| Astro | 5 | 7.3 |
| Tailwind | 4.1 | 4.3 |
| Node | 20+ | **22.12+ required** |
| Extra deps | none | `animejs`, `cobe` |
| Game data | `src/data/catalog.ts` (TS array) | `src/content/games/*.yaml` (content collection + Zod schema) |
| Site config | `src/data/site.ts` | `src/config.ts` (restructured: promo, trust, botHosting, demoPanel) |
| Legal pages | hand-written `.astro` (`terms.astro`…) | markdown in `src/content/legal/`, rendered via `[slug].astro` |
| Cart builder | `orderUrl.ts` + `whmcs.ts`, **with** `skipconfig` + `configoption[3]` | `order.ts`, **no** skipconfig/configoption — region chosen in WHMCS |
| Dallas valueId-6 gotcha | applies | **does not apply** (no configoption sent) |
| Locations | in `catalog.ts`, display-only | `src/lib/locations.ts`, drives globe + `/regions` + live ping |
| Images | `public/images/` (raw) | `src/assets/` (imported, webp/srcset) |
| Analytics | none | PostHog + cookie banner (`PUBLIC_POSTHOG_*`) |
| Deploy | **push to `main` goes live** | disabled (`workflow_dispatch` + `if: false`), not shipping yet |
| Announcement | rotating `announcementBanner` | `PromoBar` reading `promo` |
| Pages added | — | `/regions`, `/migrate`, `/tools` (+ FiveM cfg generator), `/partners`, `404` |
| Extra tooling | — | `.mcp.json` (lumix-docs), `scripts/make-icons.mjs`, `brag-output/` |

Positioning also tightened: main leans on inflated stats ("12 PoPs", "10+ Tbps"); redesign drops those for honest live data and "three US regions, capped on purpose."
