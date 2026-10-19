# CLAUDE.md — Lumix Website (redesign branch)

Full rebuild of the Lumix Solutions site. Shares nothing with `main` (different components, styles, content model) — don't try to reconcile them. See `ONBOARDING.md` for the walkthrough, and read the in-repo docs in order: **`HANDOFF.md` → `DESIGN.md` → `BUILD-PLAN.md`**. `TODO.md` is Evan's list. `DESIGN.md` governs anything visual.

## What it is

Astro 7.3 + Tailwind 4.3, static, **Node 22.12+**. Adds `animejs` (FAQ) and `cobe` (globe). Game server hosting, "finite servers run properly," three US regions. Browsing + order hand-off only; WHMCS (`billing.lumixsolutions.org`) owns checkout and billing.

## Deploy

**This branch does not deploy.** `.github/workflows/deploy.yml` is `workflow_dispatch` + `if: false` — it can't fire. Deploy secrets point at the wrong box. Not shipping until Evan says so.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Copy `.env.example` → `.env`. `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST`; blank in dev is fine (analytics + cookie banner render nothing without them). Never commit values.

## Where things live

- `src/content/games/*.yaml` — **game data**: plans, WHMCS pids, prices, specs, art/logo. Validated by the Zod schema in `src/content.config.ts` — a bad pid or a `live` game with no plans **fails the build**. Prices are display copy; keep WHMCS in sync by hand. (Terraria is hidden: yaml deleted, art kept, recover from `f40e53e`.)
- `src/content/legal/*.md` — terms/privacy/ccpa as markdown, rendered via `src/pages/[slug].astro`.
- `src/config.ts` — everything non-game: `site`, `promo` (LUMIX10, live), `trust`, `botHosting`, `demoPanel`, `links`, `nav`/`moreNav`/`footerNav`, `social`.
- `src/lib/order.ts` — cart-URL builder. **No `skipconfig`, no `configoption`** on purpose (customer picks region in WHMCS). Main's Dallas valueId-6 gotcha does NOT apply here.
- `src/lib/locations.ts` — globe + `/regions` + ping source. Dallas live, Miami/Ashburn `soldOut`. Don't re-add Salt Lake City. Keep VM `ip` fields blank (public repo, browser ping leaks IPs).
- `src/lib/ping.ts` — one timed browser fetch; refused-connection time == ping. Read the comment before touching.
- `src/assets/` — images imported through `astro:assets` (webp/srcset), not `public/`.
- `src/styles/global.css` — `@theme` tokens only (`ink`, `red`, `paper`, `go`, `--chamfer`, `--shear`, `--grid-cell`). No `tailwind.config.js`.
- `.mcp.json` — lumix-docs MCP at `docs.lumixsolutions.org/mcp`.

## Gotchas

- `cobe` must stay in `astro.config.mjs` `optimizeDeps.include` or the globe 504s and vanishes on first scroll.
- The content schema failing the build is intentional; read the error, it names the game.
- `order.ts` sends no region param by design — don't "fix" it.
- `/status` has no uptime history and the ping is a refused-connection timing trick, not a health endpoint.
- Two reds per viewport max; read `DESIGN.md` §5 before adding a color.
- Local `redesign` has run ahead of `origin/redesign`; check `git log origin/redesign..redesign`.

## Conventions

- No secrets in the repo. PostHog keys are GitHub repo *variables* (PUBLIC_); SSH deploy uses `SSH_KEY`/`SERVER_IP`/`SERVER_USER` secrets.
