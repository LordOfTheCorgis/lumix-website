# Handoff — Lumix Website Redesign

Written 2026-09-10. Read this, then `DESIGN.md`, then `BUILD-PLAN.md`.

---

## Where things stand

Branch **`redesign`**, pushed to `origin/redesign`, 26 commits ahead of `main`.
`main` still holds the entire old site untouched, and `origin/main` has not moved.
Nothing here has shipped.

The old site was torn down to nothing and rebuilt on a fresh Astro scaffold. Do not
try to reconcile this branch with `main`; it shares no components, no stylesheet,
and no layout. `main` is a reference for content only, and it is a good one:
`git show main:src/data/catalog.ts` and `git show main:src/data/site.ts` still hold
staff bios, partner copy, changelog entries, and the service descriptions that have
not been migrated yet.

**Stack:** Astro 7.3.2, Tailwind 4.3.3, static output. Requires Node 22.12+.
Site-wide JavaScript is about 2.5KB per page, of which the grid is 900 bytes.
No React, no framework runtime.

## What exists

Ten routes build: `/`, `/404`, `/privacy`, `/terms`, `/ccpa`, and five game pages
under `/games/<slug>`.

**Landing page** is single-purpose: get someone into a cart. Headline, one red CTA,
then a five-tile game picker. No positioning copy, no stat bar. This was a
deliberate correction; an earlier version led with "We cap our own servers" and
that is exactly the kind of thing the page was told not to do.

**Game pages** list every plan with real specs and prices, each linking into WHMCS
at `billing.lumixsolutions.org/cart.php?a=add&pid=…`. The site never takes payment.

**Legal pages** were scraped off the live site, cleaned, expanded, and are now
content-collection Markdown. Governing law is Louisiana, venue New Orleans. All
three dated 2026-09-10.

**Components:** Header, Footer, GameTile, StickyCta, CookieBanner, Analytics,
LightRays, GridPattern, and a three-part Terminal.

**GridPattern** is in Layout, so it is behind every page. It spans the document
at `z-index: -1`, draws its lines with two repeating gradients, and keeps twelve
recycled divs for the cursor trail. It listens on `window` rather than on itself,
which is why cells light up under the header and the copy. The trail needs a fine
pointer and no reduced-motion preference; the lines and the alignment happen
either way, because a texture is not an animation.

**The grid and the layout are one system, not two.** `--grid-cell` is 40px, and
`.shell` snaps its content column down to a width the tile grid divides evenly.
DESIGN.md section 7 has the families. Consequences worth knowing before you touch
anything: the tile gutter is one cell and the tiles are seven cells tall, so
changing `gap-[var(--grid-cell)]` or that `min-h` on GameTile puts the staircase
back. Vertical registration is measured off `[data-grid-anchor]`, which is on the
tile grid; put it on whatever matters most on a new page, or leave it off and the
grid just sits at document top.

## What does not exist yet

`/games` index, `/status`, `/partners`, `/staff`, `/contact`. The header and footer
already link to these, so those links 404 today. That is expected, not a bug.

The Capacity Board described in DESIGN.md section 8 has not been built. It is the
signature element and the design leans on it heavily.

The admin panel in BUILD-PLAN.md has not been started.

## Decisions that are settled, do not relitigate

**Dark only. There is no light mode.** No toggle, no `prefers-color-scheme`
branch, legal pages included. This was the blocker in the last handoff and Evan
closed it. Two casualties: `mist` is deleted, and `slate` went from `#6B6B72` to
`#7D7D85`. The old value was measured on Paper and had drifted onto ink at 3.54:1
under 11px uppercase labels in the header, footer, tiles and plan specs. It is
4.58:1 now. Don't put it back.

**The brand is fixed and comes from the client, not from us.** Ink `#121214`,
Lumix Red `#FF4C4C`, Space Grotesk for display, Inter for body. An earlier
DESIGN.md proposed a completely different light-ground system with Archivo; it was
replaced wholesale when the real brand brief arrived. DESIGN.md now reflects the
brief.

**Red appears at most twice per viewport**, logo excluded. This is an added rule,
tighter than the brief's "roughly 10%", because a count is enforceable mid-build
and an area percentage is not. It is why the plan pages fill only the popular
plan's button and why the cookie banner's Accept is Paper rather than red.

**Ink text on red buttons, never white.** Paper on red is 3.02:1 and fails AA. Ink
on red is 5.69:1. It looks wrong for a minute. It is correct.

**A panel is its hairline, not its fill.** `ink-soft` against `ink` is 1.08:1,
effectively invisible. Every card uses `var(--edge)`. Never reach for a shadow.

**No React.** Two Magic UI components (Terminal, Light Rays) were ported to Astro
with vanilla JS and CSS instead of pulling in React and `motion`. Light Rays needs
no JavaScript at all; it randomises at build time from a fixed seed.

**Light Rays is a deliberate exception** to the one-orchestrated-moment motion rule,
justified only because the company is named Lumix. Keep it in the hero. Repeating it
elsewhere turns a signature into wallpaper.

**Analytics is genuinely gated.** PostHog loads zero bytes until consent. Global
Privacy Control is honoured automatically. The privacy policy names PostHog and
says exactly this, so the code and the document have to stay in agreement.

## Traps that already cost time

**Never delete `.astro/` while a dev server is running.** It is the content layer's
data store. Removing it mid-session produced both an "collection does not exist or
is empty" warning and a `LocalImageUsedWrongly` error, twice, neither of which was a
real bug. Both are gitignored; there is no reason to delete either.

**`popular: true` sits before `specs` in the old catalog**, not after `pricing`. A
parser that assumes otherwise silently drops one plan per game and all of Terraria.
Check counts against the source: there are 29 plans across 5 games.

**The deploy workflow is dead.** `.github/workflows/deploy.yml` rsyncs over SSH to
`/srv/www/` on a server the site no longer lives on. Lumix moved to cPanel. It will
fail on every push to `main` and needs rewriting or deleting once the cPanel deploy
path is settled.

**Don't set background-position off `--shell-content`.** It looks like the
obvious way to align the grid horizontally and it is quietly wrong: that value
carries a `100%`, and a percentage in `background-position` resolves against the
positioning area minus the tile, not the plane width. The alignment is structural
instead, on a centred `::before` padded by whole cells. Measured it both ways.

**The ink ground lives on `<html>`, not on `<body>`.** Body is deliberately
transparent so GridPattern can sit under it at `z-index: -1`. Put a background
back on body, or re-add `bg-ink` to its class list, and the grid disappears with
no error and no warning.

**Headless Chrome reports `hover: none` and `pointer: coarse`,** so the grid's
trail correctly refuses to bind and screenshots come back with a bare grid. That
is the gate working, not a bug. To exercise it, launch with
`--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`.

**Astro inlines small CSS and JS into the HTML** rather than emitting bundles.
Grepping `dist/_astro/*.css` for a component's styles will find nothing and mean
nothing.

## Environment

`.env` is required for analytics and is gitignored. Copy `.env.example`:

```
PUBLIC_POSTHOG_KEY=phc_…      # PostHog > Settings > Project > Project API Key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Without the key, both the analytics script and the cookie banner render nothing.
That is intended for dev.

`node scripts/make-icons.mjs` regenerates the favicon set from
`public/images/logo.png` if the mark ever changes.

`marketing-log.md` may be present in the working tree. It is gitignored, generated
by a routine in the `lumix-routines` repo, and is not part of this project.

## Open questions for Evan

1. **cPanel Node version.** Astro 7 needs Node 22.12+. Whether cPanel offers it
   gates the entire admin plan in BUILD-PLAN.md. Nobody has checked yet. **This is
   the blocker now.**
2. **Deploy path on cPanel**, and what replaces the dead workflow.
3. Whether Terms sections 7 and 9 get reviewed by Louisiana counsel. Louisiana is
   the only civil law state, and broad liability disclaimers behave differently
   there than in the other forty-nine.

## Suggested next steps

Light mode is settled, so go straight at the pages: `/games` index, `/status`,
`/contact`, `/partners`, `/staff`, pulling copy from `main`'s data files. Then the
Capacity Board, then the admin panel.
