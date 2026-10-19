# CLAUDE.md — Lumix Website (redesign branch)

Lumix Solutions marketing and storefront site. See `docs/ONBOARDING.md` for the walkthrough, and read the project docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's list. `DESIGN.md` governs anything visual.

## What it is

Astro 7.3 + Tailwind 4.3, static, **Node 22.12+**. `cobe` drives the globe, `animejs` the FAQ accordion. Game server hosting, "finite servers run properly," three US regions. Browsing + order hand-off only; WHMCS (`billing.lumixsolutions.org`) owns the cart, pricing, and checkout.

## Deploy

**Nothing deploys.** `.github/workflows/deploy.yml` is `workflow_dispatch` + `if: false` — it can't fire. The target is wrong and the redesign isn't going live yet; don't restore a push trigger until Evan says so. A push here does nothing to any live site.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Copy `.env.example` → `.env`: `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` (blank in dev is fine — analytics + cookie banner render nothing). Never commit values.

## Where things live

- `src/content/games/*.yaml` — **game data**: plans, WHMCS pids, prices, specs, art/logo. Validated by `src/content.config.ts` — a bad pid or a `live` game with no plans **fails the build**. Prices are display copy; keep WHMCS in sync by hand. Terraria is hidden (no yaml), art kept.
- `src/content/legal/*.md` — terms/privacy/ccpa markdown, rendered via `src/pages/[slug].astro`.
- `src/config.ts` — everything non-game: `site`, `promo` (LUMIX10, live), `trust` (Trustpilot 4.1/5, hand-entered), `botHosting` (3 pids: Node 7 / Python 8 / Go 9), `demoPanel`, `links`, `nav`/`moreNav`/`footerNav`, `social`.
- `src/lib/order.ts` — cart-URL builder: `orderUrl(pid, billingcycle)`, **no `skipconfig`, no `configoption`** (customer picks region in WHMCS).
- `src/lib/locations.ts` — globe + `/regions` + ping. `soldOut` flag per region. Dallas live, Ashburn/Miami sold out. Don't re-add Salt Lake City. Keep VM `ip` fields blank (public repo, browser ping leaks IPs).
- `src/lib/ping.ts` — one timed browser fetch; a refused connection still times right. `/status` and `PingTest` share it.
- `src/assets/` — images imported through `astro:assets` (webp/srcset), not `public/`.
- `src/styles/global.css` — `@theme` tokens only (`ink`, `red`, `paper`, `go`, `--chamfer`, `--shear`, `--grid-cell`). No `tailwind.config.js`.
- `.mcp.json` — lumix-docs MCP at `docs.lumixsolutions.org/mcp`.

## Gotchas

- `cobe` must stay in `astro.config.mjs` `optimizeDeps.include` or the globe 504s and vanishes on first scroll.
- The content schema failing the build is intentional; read the error, it names the game.
- `order.ts` sends no region param by design — don't "fix" it.
- `/status` is a refused-connection timing trick via `lib/ping.ts`, not a health endpoint; no fake uptime number.
- `astro dev` is a background daemon in Astro 7 (Ctrl+C won't stop it): `astro dev stop && npm run dev`. More dev traps in `HANDOFF.md`.
- Two reds per viewport max; read `DESIGN.md` §5 before adding a color.

## Conventions

- No secrets in the repo. The disabled deploy workflow would use `SSH_KEY`/`SERVER_IP`/`SERVER_USER`; PostHog keys are GitHub repo variables (PUBLIC_).
