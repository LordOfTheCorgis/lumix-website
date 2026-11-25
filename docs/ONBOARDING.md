# Onboarding — Lumix Website (redesign)

*The Lumix Solutions marketing site and storefront, in rebuild. Read this top to bottom, then the project docs in order: [`HANDOFF.md`](../HANDOFF.md) → [`DESIGN.md`](../DESIGN.md) → [`BUILD-PLAN.md`](../BUILD-PLAN.md). `TODO.md` is Evan's list.*

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
> **`main` deploys to production, `dev` deploys to dev.lumixsolutions.org.** Both are FTPS uploads to cPanel on push. See [Build & deploy](#build--deploy).

> [!NOTE]
> `DESIGN.md` is effectively law for anything visual — read section 5 before you add a color.

## What this is

Lumix Solutions LLC (lumixsolutions.org) sells game server hosting to people who run game communities. The positioning is *"a finite number of servers, run properly"* — capped stock on purpose, honest live data, plain language, three US regions.

The site does browsing and the order hand-off only. It never takes payment. Order links drop the customer into WHMCS (`billing.lumixsolutions.org`) with the product preselected; WHMCS owns the cart, pricing, checkout, and provisioning.

## Tech stack

| Piece | Why it's here |
| ----- | ------------- |
| **Astro 7.4** | Static site generator, builds to plain HTML. **Needs Node 22.22+** (enforced in `package.json`). |
| **Tailwind 4.3** | Via `@tailwindcss/vite`. Tokens live in `src/styles/global.css` under `@theme` (tokens only; see `DESIGN.md`). |
| **`cobe`** | The WebGL globe. It's a dynamic import, so `astro.config.mjs` pre-bundles it in `optimizeDeps` — or it 504s on first scroll. |
| **`animejs`** | The FAQ accordion's height tween. That's its only job. |
| **Content collections** | Games and legal pages are typed content, validated by a Zod schema at build time. |
| **PostHog** | Analytics + cookie banner, consent-gated. No React, no framework runtime. |

**The content model is the thing to internalize.** Games are schema-validated YAML, not a TypeScript array, so a wrong `pid` or a `live` game with no plans *fails the build* instead of silently selling the wrong thing. Images are imported through `astro:assets` (resized webp + srcset), so key art lives in `src/assets/`, not `public/`.

## Run it locally

Node 22.22+, npm 10+.

```bash
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # -> dist/
npm run preview
```

Copy `.env.example` to `.env` for analytics. Blank in dev is correct — PostHog and the cookie banner render nothing without a key.

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
HANDOFF.md · DESIGN.md · BUILD-PLAN.md · TODO.md (read in that order; TODO is Evan's)
docs/ONBOARDING.md (this file) · CLAUDE.md
brag-output/       # a rendered launch video from the brag skill (not part of the site build)
```

### How pages are built

File-based routing under `src/pages/`. Two dynamic routes:

- `games/[slug].astro` — `getStaticPaths()` pulls the `games` collection, filters to `status === "live"`, and builds a page per game. It also emits `Product` + per-plan `Offer` JSON-LD off the same YAML, so the schema and the on-page price table can't disagree.
- `[slug].astro` (top level) — `getStaticPaths()` over the `legal` collection, renders each markdown doc. That's how `/terms`, `/privacy`, `/ccpa` exist with no hand-written pages.

Everything wraps in `Layout.astro`.

### How ordering works

`order.ts` builds `cart.php?a=add&pid=…&billingcycle=…` plus `configoption[3]=<whmcsId>` when the customer picked a region, so WHMCS opens with it preselected. **No `skipconfig=1` on purpose**: the customer still lands on WHMCS's config page and sees what they're buying. `OrderBuilder.astro`'s script imports `orderUrl` itself, so the links after a radio click come from the same code as the first render.

### How /status works

`status.astro` pings each region (and its VMs, plus billing/panel) from the visitor's browser via `src/lib/ping.ts`. The node IPs don't serve HTTP — the ports refuse the connection — but a refused connect still completes in one round trip, so the time-to-failure *is* the ping. No uptime history, no backend; read the comment block in `ping.ts` before touching it.

## Common tasks

| Task | How |
| ---- | --- |
| **Add a game** | A new `src/content/games/<slug>.yaml`, art at `src/assets/games/<slug>.jpg`, logo at `src/assets/logos/<slug>.{webp,svg}` (paths relative `../../assets/...`). Fields/types in `content.config.ts`: `accent` 6-digit hex, `mark` 2–4 chars, `status` `live\|beta\|planned`. `live` with no plans fails the build. Terraria has no yaml by design — re-add one to bring it back. |
| **Change a plan's price** | The plan's `pricing` block in its game YAML. `monthly` required and positive, others optional. Display copy only — **change it in WHMCS too**. A wrong `pid` fails the build. |
| **Edit a legal page** | `src/content/legal/{terms,privacy,ccpa}.md`; `##` headings get the bordered-section styling. Bump `lastUpdated`. (Louisiana law; Terms §7/§9 tracked in `TODO.md`.) |
| **Change the promo / nav / footer** | `src/config.ts`: `promo` (`LUMIX10`, must match WHMCS), `nav`/`moreNav`/`footerNav`/`social`, `links`, `site`. `trust` is the hand-entered Trustpilot line; `botHosting` is one product (pid 6, runtime is a dropdown in the panel) rendered by `BotLine.astro`. |
| **Open or close a region** | `soldOut` in `src/lib/locations.ts` (stays listed, existing servers keep running). Ashburn is the only open region; Dallas and Miami are sold out. WHMCS hides the same options (`hidden` flag on the Server Location sub-options), so flip both. **Don't re-add Salt Lake City** until there's a node. Leave VM `ip` fields blank — public repo. |

## Build & deploy

Two branches deploy, both over FTPS to cPanel (see `.github/workflows/`):

| Push to | Goes to | Workflow |
| ------- | ------- | -------- |
| `main` | lumixsolutions.org (live) | `deploy.yml`, PROD FTP account (`CPANEL_FTP_PROD_*`). A guard step refuses to upload unless the account root holds a `dev.lumixsolutions.org` folder. |
| `dev` | dev.lumixsolutions.org (noindex build) | `deploy-dev.yml`, dev FTP account jailed to the dev folder. |

> [!WARNING]
> A push to `main` is a live release. Never put the prod FTP account into the dev secrets: the dev workflow uploads to its account root.

Pull requests run `ci.yml` (tests, type check, build) so a broken build shows up before the merge. Builds use `npm ci` and pass `PUBLIC_POSTHOG_*` through as GitHub repo variables (not secrets, they're `PUBLIC_` and land in page source anyway).

### Server-side config (not in this repo)

The site's `.htaccess` lives only on web-srv-02, and a deploy never touches a file it didn't upload. Two things worth adding there by hand, merged into whatever is already in it:

```apache
ErrorDocument 404 /404.html

<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|woff2|webp|avif|png|jpg|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

Without the first line the live 404 is Apache's grey default instead of `dist/404.html`. Only the hashed `/_astro/` files are safe to cache for a year, so if you'd rather not touch images, narrow the `FilesMatch` to `.js|.css|.woff2`. Cloudflare's cache rules can do the same job.

## Environment variables

Copy `.env.example` to `.env`. Names only, never commit values:

| Variable | Purpose |
| -------- | ------- |
| `PUBLIC_POSTHOG_KEY` | PostHog project API key. Blank in dev renders analytics + cookie banner as nothing (intended). |
| `PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` or the EU equivalent. |

`.env` is gitignored.

## Gotchas & things that bit people before

> [!CAUTION]
> **`cobe` must stay in `optimizeDeps.include`** (`astro.config.mjs`), or the globe 504s and appears to vanish on first scroll. **`astro dev` is a background daemon in Astro 7** — Ctrl+C doesn't stop it; restart with `astro dev stop && npm run dev`.

- **Images are `src/assets`, not `public/`.** Reference them so `astro:assets` resizes them; a raw 472KB Palworld JPG out of `public/` is what this replaced.
- **The content schema fails the build on purpose** — bad pid, live-with-no-plans, bad hex accent. Read the error, it names the game.
- **`order.ts` sends the region (`configoption[3]`) on purpose**, and the order builder's script reuses it. Don't copy the URL logic back into a component.
- **`/status` is a timing trick, not a health endpoint.** The region ping times a refused connection (`lib/ping.ts`); no uptime history. VM `ip` fields stay blank (public repo).
- **`DESIGN.md` governs anything visual** — near-black warm `ink`, a single Lumix red (two reds per viewport max), Space Grotesk / Inter, hairlines (`--edge`) over fills, the chamfer/shear "diagonal" as the one signature move.

The full catalogue of dev-server traps (stale content store, Tailwind not seeing a new file, cobe 504, unresolved images) lives in [`HANDOFF.md`](../HANDOFF.md#traps-that-already-cost-time).

---

<sub>**More docs:** [README](../README.md) · [HANDOFF](../HANDOFF.md) · [DESIGN](../DESIGN.md) · [BUILD-PLAN](../BUILD-PLAN.md)</sub>
