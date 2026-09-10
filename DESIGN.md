# Lumix Solutions — Design System

Working spec for the `redesign` branch. Built from the Lumix brand brief.
Nothing ships that this file cannot justify.

---

## 1. Subject, audience, job

Lumix Solutions sells low-latency game server hosting out of Miami, FL and Ashburn, VA.
The customer is a community owner, not an enterprise IT buyer. They run a 60-member FiveM
roleplay department, a Minecraft SMP for friends, a Rust group that plays Thursdays. They
are semi-technical, they know what tick rate means, and they have been burned by a host
that oversold a node and dropped everyone mid-session.

The homepage has one job: move that person from "which game" into a configured server in
the cart. Everything else supports that or gets cut.

## 2. The risk, stated up front

The brand is a near-black ground, a single hot red accent, and a geometric sans. That is
the default look for premium gaming and infrastructure, and the previous Lumix site was
already sitting in it (`#0a0a0a`, `#ff4c4c`, Inter). Re-skinning the same register with
better tokens produces the same site with tidier spacing.

So the palette is not going to differentiate this build, and it is not being asked to.
The brand principles say what will:

- **Reliable** carries through *honest live data on the page*, not adjectives.
- **Fast** carries through *the diagonal*, one angle used structurally and everywhere.
- **Straightforward** carries through *whitespace and plain language*, at a density well
  below what competitors ship.

Structure does the work. Color stays on its leash.

## 3. The one true thing

From Lumix's own announcement copy:

> "Limited FiveM servers stock available, intentionally capped to maintain performance
> and reliability."

That is the most unusual sentence the company has ever published. This industry is defined
by overselling. A host that publicly caps its own inventory and says so is making a claim
nobody else in the category will make, and it is the literal expression of the Reliable
principle: uptime and honesty first.

This is the brief. Not "fast," not "enterprise-grade," not "10Tbps mitigation." Every host
says those. Lumix says: **we run a finite number of servers, we run them well, and we will
show you exactly how much room is left.**

## 4. Logo

The primary mark is the angled L + S monogram, both letterforms cut from the same
diagonal. The S is always Lumix Red. The L is Paper on dark grounds and Ink on light.

The horizontal lockup, the LUMIX SOLUTIONS wordmark beside the stacked-server icon, is for
wide formats: site header, footer, OG images. Clear space on all sides equals the cap
height of the wordmark. The monogram alone is for the favicon, avatars, and anywhere under
64px where the wordmark would be unreadable.

Never recolor the S. Never set the monogram on a mid-tone where neither L variant has
contrast. Never outline, gradient, or add a glow.

### The diagonal is the system

The monogram's shared cut is the only diagonal permitted anywhere in the interface. One
angle, **16 degrees off vertical**, applied to panel corners, badge terminals, rule ends,
section transitions, and the capacity slots. Nothing else in a layout tilts.

Corners are **chamfered, not rounded.** The mark cuts its corners; so do panels, at 10px
on the top-left and bottom-right only. Border-radius stays 0 except for pill badges.
Chamfer reads machined, which is what "sharp angles signal speed" actually means when you
build it rather than say it.

## 5. Color

Ratio is roughly 60% Ink, 30% neutrals, 10% red.

**The site is dark only.** No light mode, no theme toggle, no `prefers-color-scheme`
branch. Ink is the ground on every page including legal. This was open for a while and
it is now closed; a second palette doubles the review surface of every component for a
mode nobody asked for, and the brand's whole read is a lit thing against a dark room.

Paper is not a background any more. It is the primary text colour and the one light fill
on the site (the cookie banner's Accept). Light-ground contrast still matters in exactly
one place, the logo on someone else's surface, so the Paper numbers below stay on the
record.

| Token | Hex | Job |
|---|---|---|
| `red` | `#FF4C4C` | Primary accent. Logo S, CTAs, links, active states. |
| `red-pressed` | `#C43535` | Hover and active. **Also the only red allowed for text on Paper.** |
| `red-tint` | `#FF8A8A` | Highlights on dark surfaces only. |
| `ink` | `#121214` | Default background. |
| `ink-soft` | `#1A1A1D` | Cards and panels on Ink. |
| `paper` | `#F7F5F1` | Primary text on Ink. The one light fill. |
| `slate` | `#7D7D85` | Tertiary text on Ink. Labels beside the value they name. |
| `fog` | `#9A9AA2` | Secondary text on Ink. |

`mist` was retired with light mode. Hairlines are `--edge`.

### Measured contrast, and the three rules that fall out

Computed against WCAG 2.1, not eyeballed.

**On Ink `#121214`:** paper 17.18, tint 8.25, fog 6.70, red 5.69, slate 4.58. Everything
passes AA for body text, which is the point of a single-ground system: there is no second
table to check against.

Slate was `#6B6B72` until light mode was cut. That value was measured on Paper, and on Ink
it lands at **3.54:1**, under 11px uppercase labels no less. It shipped that way in the
header, footer, tiles and plan specs. Lifted to `#7D7D85` for 4.58:1.

**On Paper `#F7F5F1`,** which now only describes the logo on foreign surfaces: ink 17.18,
red-pressed 4.94, **red 3.02**.

> **Rule 1.** `red` fails AA on Paper at 3.02:1. Wherever the mark lands on a light ground
> off-site, red type becomes `red-pressed` and `red` is restricted to fills, strokes, and
> the logo S.

> **Rule 2.** A red CTA takes **Ink** text, not white. Paper on red is 3.02:1 and fails;
> ink on red is 5.69:1 and passes. This is counterintuitive and it will feel wrong until
> you see it. Do it anyway.

> **Rule 3.** `ink-soft` against `ink` is **1.08:1**, which is invisible. A panel is not a
> panel because of its fill; it is a panel because of its hairline. Every card on Ink gets
> a 1px `#FFFFFF` at 8% border. Depth comes from the edge, never from a shadow.

`fog` is Ink-only and `slate` is Paper-only. Swapping them fails in both directions
(fog on Paper is 2.57:1). They are not interchangeable neutrals.

### The 10% rule, enforced

Red appears at most **twice per viewport**: once as the primary action, once as state.
The logo S does not count. If a third red thing appears, one of them is decoration and it
gets cut. This is the difference between "single deliberate accent" and "red-accented
template," and it is the easiest rule in this document to break by accident.

## 6. Typography

Space Grotesk for headlines and titles, Inter for body and UI. Both variable, both from
one Google Fonts request.

| Role | Face | Settings |
|---|---|---|
| Display | Space Grotesk | `700`, tracking `-0.03em`, sentence case |
| Title | Space Grotesk | `600`, tracking `-0.02em` |
| Body | Inter | `400/500`, tracking `0` |
| UI label | Inter | `500`, tracking `0.01em` |
| Instrument | Space Grotesk | `500`, tracking `0.10em`, uppercase, small |

Space Grotesk's quirks, the flat-sided S, the angular G, the tall x-height, only read at
size. Below about 24px it flattens into a generic geometric sans and stops earning its
place, so it is display and instrument only. Inter carries everything a reader actually
reads.

Instrument style is Space Grotesk rather than a mono: region codes, slot IDs, ping values,
plan SKUs. No monospace anywhere in this system. Mono is the terminal-cosplay tell the old
site leaned on, and this brand is "steady and technical," not "hacker."

### Scale

```
display-xl   clamp(2.75rem, 6vw, 4.5rem)   / 1.00   Space Grotesk 700  -0.03em
display-l    clamp(2rem, 4vw, 3rem)        / 1.06   Space Grotesk 700  -0.03em
title        clamp(1.375rem, 2.5vw, 1.75rem) / 1.2  Space Grotesk 600  -0.02em
lead         1.25rem                       / 1.55   Inter 400
body         1rem                          / 1.65   Inter 400
small        0.875rem                      / 1.6    Inter 400
instrument   0.6875rem                     / 1      Space Grotesk 500  +0.10em  UPPER
```

Uppercase is permitted in instrument style and nowhere else. No all-caps headlines, no
letter-spaced hero type.

## 7. Layout

**One continuous dark field per page, with content cut into it as chamfered panels on a
12-column measure.**

### The 40px module

There is a grid drawn behind every page, and the layout is built on it rather than beside
it. `--grid-cell` is 40px and it is the only number that matters here: the background
draws at that size, and the content column is snapped down to a width the tile grid
divides evenly, so panel edges and gutters land on lines instead of near them.

For n columns with a one-cell gutter the column has to be `(n·a + n−1)` cells wide, which
gives three families: **120k+80** at three columns, **80k+40** at two, any **40k** at one.
`.shell` rounds down into the family for its breakpoint and whatever is left becomes
gutter, which is why some viewport widths carry more air than others. That is the trade,
and it is worth it: before this, tile left edges cycled 24 / 0 / 16 px off the grid across
a single row.

Horizontal registration is structural rather than calculated. The lines are painted on a
centred box that is the content column plus sixty whole cells on each side, so a line
falls on the column's left edge by construction, with no offset arithmetic and no
JavaScript. Vertical registration cannot be derived, only measured, so the plane spans the
document and one small script snaps it to whatever the page marks `[data-grid-anchor]`.

Panels that sit on the grid take their height in cells too. Game tiles are seven.

Container maxes at 1328px so the capped content column is exactly 1280, which is 32 cells.
Gutters are 24px, 20px on mobile, 8px spacing base.
Section rhythm is 96px desktop and 56px mobile, living on a single `.section` class.
Never also put block padding on the `section` element selector; when both exist they take
turns winning depending on import order, and that collision is the most common way a
Tailwind build goes subtly wrong.

Generous whitespace is a brand principle, so treat it as a spec and not a preference: no
section runs denser than a 60ch measure for prose, and no panel grid exceeds three columns
at any breakpoint.

## 8. Signature element: the Capacity Board

The homepage hero is not a headline over a gradient. It is a live grid of every node Lumix
runs, one cell per slot, grouped by game and by region.

- **Open** is a hollow cell: transparent fill, 1px white-at-16% border, chamfered. It is a
  real `<button>`. On hover or keyboard focus the border goes `red` and the fill takes red
  at 10%. Clicking opens the configurator preloaded with that game and region.
- **Running** is a filled `ink-soft` cell with its hairline. Not interactive. It carries
  the community name where the owner has opted in.
- **Capped** is `red` with a 16-degree hatch, and it is not purchasable.

Above it, one line in instrument style: `14 OF 96 SLOTS OPEN · MIA 4MS · IAD 11MS`.
Real numbers, never a fake scarcity timer. If the number is high it says so, because the
credibility only works if it is allowed to be unflattering.

This is what the site is remembered for. It is the capping policy made visible, it is the
monogram's hollow-and-solid logic rendered as interface, it is the primary route into the
configurator, and it is the Reliable principle expressed as data instead of adjectives.
No competitor could reuse it, because none of them would show the number.

## 9. Motion

**One orchestrated moment, on the board, once per session.**

On first paint the slot outlines draw left to right over 600ms with a 12ms stagger, then
occupied cells fill over 200ms. That is the entire animation budget for the homepage.

Everything else is 150ms transitions on `opacity`, `transform`, and `border-color`. No
parallax, no scroll-jacking, no counting-up numbers, no marquees. Restraint reads as more
expensive than density, and one choreographed moment lands harder than twelve small ones.

Under `prefers-reduced-motion: reduce` the board renders in its final state immediately
and transitions drop to zero. Not a slower animation. None.

## 10. Quality floor

Non-negotiable, checked before anything merges.

Responsive to 320px, with the Capacity Board reflowing to a per-game horizontal scroll
strip below 640px rather than a squashed grid. Visible keyboard focus on every interactive
element, a 2px `red` ring at 2px offset, with the ring on a wrapper wherever `.chamfer` is
applied because `clip-path` silently eats outlines. `prefers-reduced-motion` honored as
specified. Real copy throughout, active voice, named after what the user controls
("Pick a region") rather than how the system works ("Region selection module"). No
placeholder content ships. Section spacing lives in exactly one class.

---

## Self-critique

The honest weakness is section 2: this palette will not make the site memorable, and the
whole plan rests on the Capacity Board carrying that load by itself. If the board gets cut
or watered down into a static graphic, what remains is a competent dark hosting site
indistinguishable from four competitors. The board is not a feature, it is the design.

**Cut:** an earlier draft paired the board with a live region latency map. Two live data
objects on one screen compete for the same attention and the board is the stronger idea.
Latency survives as a number in the instrument line above it.
