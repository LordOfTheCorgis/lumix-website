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

**CursorTrail** is in Layout, so it is behind every page. It fills a positioned
wrapper around the header and main, which is what makes it stop at the top of the
footer, and recycles twelve divs at `z-index: -1` that light up under the cursor and fade out
behind it. Nothing draws a grid: an earlier version painted the lines too and Evan
cut them, so the module is now invisible and only the lit cells reveal it. It
listens on `window` rather than on itself, which is why cells light up under the
header and the copy. Needs a fine pointer and no reduced-motion preference; does
nothing at all otherwise.

**The module and the layout are one system, not two.** `--grid-cell` is 40px, and
`.shell` snaps its content column down to a width the tile grid divides evenly.
DESIGN.md section 7 has the families. Consequences worth knowing before you touch
anything: the tile gutter is one cell and the tiles are seven cells tall, so
changing `gap-[var(--grid-cell)]` or that `min-h` on GameTile puts the staircase
back. Vertical registration is measured off `[data-grid-anchor]`, which is on the
tile grid; put it on whatever matters most on a new page, or leave it off and the
cells just register to the document top.

**A tile's text block is bottom-justified,** so anything with a variable line count
above the price shoves the title up or down. The tagline reserves two lines with
`min-h-[2lh]` for exactly this reason: Terraria's is one line where every other
game's is two, and without it Terraria's title sat 22px below Palworld's beside
it. `line-clamp-2` caps the height, it does not reserve it.

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

**The globe is the second motion exception, and the last one.** It autorotates
because that is the component Evan asked for, and it is cobe on a canvas rather
than anything React. Under `prefers-reduced-motion` it holds still facing the
markers and stays draggable, which is the compromise; it is not a slower spin.
Verified by capturing composited frames a second apart: three distinct frames
normally, one under reduce.

**Light Rays is a deliberate exception** to the one-orchestrated-moment motion rule,
justified only because the company is named Lumix. Keep it in the hero. Repeating it
elsewhere turns a signature into wallpaper. Second version now: parallel beams at
`--shear` instead of the Magic UI blobs, which read as a grey smudge. One beam runs
red at the source and the thin slits carry a red/blue fringe; DESIGN.md section 5
was amended to allow both (the red budget counts UI, not light).

**The hero ground is game art, one game per visit.** `HeroArt.astro` picks
client-side from the live games with art at least 1200 wide (Terraria's is a
460px thumbnail and gets skipped until someone replaces it). `?art=fivem` pins
one for checking crops. The beams have no `isolation` on purpose so they screen
onto the art; put it back and they go flat grey. Colour on this site comes from
the games, not the palette, and DESIGN.md now says so.

**Analytics is genuinely gated.** PostHog loads zero bytes until consent. Global
Privacy Control is honoured automatically. The privacy policy names PostHog and
says exactly this, so the code and the document have to stay in agreement.

## Traps that already cost time

**The globe "vanishes" in dev after a dependency change.** Symptom: the canvas
stays at opacity 0, console shows `504 (Outdated Optimize Dep)` for `cobe.js`.
Vite only discovered cobe on first scroll (it's a dynamic import), re-optimised
mid-session, and the open tab kept the stale module URL. `optimizeDeps.include`
in astro.config.mjs pre-bundles it now. If it ever comes back: hard reload, and
if that fails, stop dev and delete `node_modules/.vite`. The build was never
affected.

**Content store goes stale after a schema change.** Adding `logo` to the games
schema left the dev store without the field on every entry even after a clean
restart ("Synced content" but no re-parse). Stop dev, delete
`.astro/data-store.json`, start again.

**Never delete `.astro/` while a dev server is running.** It is the content layer's
data store. Removing it mid-session produced both an "collection does not exist or
is empty" warning and a `LocalImageUsedWrongly` error, twice, neither of which was a
real bug. Both are gitignored; there is no reason to delete either.

**`astro dev` is a background daemon in Astro 7, and Ctrl+C does not stop it.**
`astro dev status` will say "background" and the process is reparented away from
your shell, so closing the terminal leaves it running. This is how a dev server
ends up five hours old without anyone meaning to keep it. To actually restart it:

```
astro dev stop && npm run dev
```

**A long-lived dev server eventually serves unresolved content images:**

```
LocalImageUsedWrongly: `Image`'s and `getImage`'s `src` parameter must be an
imported image or a URL, it cannot be a string filepath.
Received `../../assets/games/beamng.jpg`.
```

It reads like a schema or YAML bug and is neither; `image()` in
`src/content.config.ts` and the YAML paths are both correct. **Restarting the dev
server fixes it, and nothing needs deleting** — a fresh server against the same
on-disk `.astro/data-store.json` serves the images resolved. That much is tested.

What causes it is still unknown, but these were tried against a healthy running
dev server and none of them reproduced it, so don't spend the time again:
`astro build` (twice), `npm install`, touching a game YAML, touching
`content.config.ts`. An earlier version of this note blamed builds sharing the
data store. That was wrong and is now disproven. If you do need a hard reset,
`astro dev --force` clears the content layer cache.

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
