# Lumix Solutions — Design System

Redesign direction, v1. This document is the source of truth for the `redesign` branch.
Nothing gets built that this file cannot justify.

---

## 1. The subject

Lumix Solutions sells game server hosting to community owners. Not to enterprise IT
buyers, not to sysadmins. The person on this site runs a 60-member FiveM roleplay
department, or a Minecraft SMP for their friends, or a Rust group that plays Thursdays.
They are semi-technical. They know what tick rate means. They have been burned before by
a host that oversold a node and dropped everyone mid-session.

The homepage has one job: move that person from "which game" into a configured server in
the cart. Everything else on the site supports that or gets cut.

## 2. The one true thing

From the site's own announcement copy:

> "Limited FiveM servers stock available, intentionally capped to maintain performance
> and reliability."

That is the most unusual sentence on the entire website. This industry is *defined* by
overselling. A host that publicly caps its own inventory, and says so in the banner, is
making a claim nobody else in the category is willing to make.

That is the design brief. Not "fast," not "enterprise-grade," not "10Tbps mitigation."
Every host says those. Lumix says: **we run a finite number of servers and we run them
well, and we will tell you exactly how much room is left.**

Everything below traces back to that sentence.

## 3. What the logo already told us

The existing mark is an oblique LS monogram: a **hollow** L and a **solid** red S, both
sheared right, corners chamfered rather than rounded.

Three things fall out of it, and all three become system rules:

**Hollow versus solid is already the capacity metaphor.** An empty outline and a filled
shape, sitting next to each other. That is open inventory and taken inventory, drawn in
the logo years before anyone wrote this document. The interface inherits it directly.

**The shear is the only diagonal.** The mark leans forward at roughly 16 degrees off
vertical. That angle is now the single permitted diagonal in the entire system. Slot
edges, badge ends, rule terminals, section transitions. One angle, used everywhere, taken
from the mark. Nothing else in the layout is allowed to tilt.

**Chamfer, never round.** The mark cuts its corners. So do we. Panels get a 10px chamfer
on the top-left and bottom-right only, matching the mark's cut. Border-radius stays at 0
for everything except instrument badges, which are full pills. This is deliberately *not*
the zero-radius broadsheet look: chamfered corners read as machined, square corners read
as unfinished.

The logo does not change. It gets a proper lockup and a lot more room around it.

## 4. Ground: light, not dark

Every competitor is dark. Nitrado, GPORTAL, Shockbyte, BisectHosting, and the current
Lumix site all run near-black backgrounds with a single hot accent. The current site is
`#0a0a0a` with `#ff4c4c` and JetBrains Mono, which is the category default executed
competently.

Going light is the cheapest way to look like a different kind of company, and there is a
concrete asset argument for it: the nine pieces of game key art in `public/images/games/`
are all dark, saturated, and dramatic. On a black page they mush into the background and
into each other. On a paper ground each one reads as a distinct object with its own
weight. The artwork is the best content on the site and the current design suppresses it.

The paper is a cool gray-green, not cream. Cream plus serif plus terracotta is its own
tired default and we are not going there either.

## 5. Palette

Six core values. Each has exactly one job. If a color is being used for a job not listed
here, that is a bug.

| Token | Hex | Job |
|---|---|---|
| `board` | `#E7E8E3` | The page. Uncoated gray-green stock. Every surface starts here. |
| `slot` | `#D8DAD3` | Inset panels, one step *down* from the page. Content is routed into the board, not floated on top of it. |
| `ink` | `#15171A` | Type, rules, outlines. Cool near-black. Never pure `#000`. |
| `deep` | `#1F2B33` | Petrol. Occupied slots, footer, configurator chrome, image scrims. The dark that is not black. |
| `lamp` | `#FFA92B` | Signal amber. **Interaction only.** |
| `signal` | `#F94040` | The mark's red. The mark, and the at-capacity state. Nothing else. |

Two derived neutrals, not brand colors, just utility:

| Token | Hex | Job |
|---|---|---|
| `graphite` | `#4E545C` | Secondary and caption text on light surfaces. |
| `signal-deep` | `#C42A2A` | The only red permitted for body-size text. |

### The amber rule

`lamp` never appears at rest. It is not a brand color and it is not decoration. It shows
up on hover, on focus, on the active step of the configurator, on the primary CTA, and
nowhere else. The user brings the light. The company is called Lumix. An open slot is a
dark lamp until you touch it, and then it lights.

This is the discipline that makes the page read expensive. One accent, appearing only
where the user's attention already is, is worth more than five accents distributed evenly.

### The red rule

Red is demoted from interface chrome to semantics. It is the logo, and it is the
at-capacity state, and that is the complete list. Red means stop, and the company's entire
story is that it stops selling when a node fills up. Giving red a real job is more
valuable than sprinkling it across every heading, which is what the current site does.

### Contrast, measured

Computed against WCAG 2.1, not eyeballed:

- `ink` on `board` = **14.58:1**. `ink` on `slot` = **12.73:1**. Body copy, anywhere.
- `graphite` on `board` = **6.21:1**, on `slot` = **5.42:1**. Passes AA for body.
- `deep` on `board` = **11.75:1**, and `board` on `deep` = the same. Reversible.
- `lamp` on `board` = **1.56:1**. **Fill and stroke only, never text on light.**
- `lamp` on `deep` = **7.55:1**. Text-safe on the petrol field.
- `signal` on `board` = **2.92:1**. Fails even large text. Use `signal-deep` (**4.59:1**)
  for any red type; reserve `signal` for fills, strokes, and the mark.

## 6. Typography

**Display and body are the same family at two widths.** Archivo is a variable font with a
width axis (62 to 125) and a weight axis (100 to 900). One file, two voices. Serif-versus-
sans pairings are the reflexive answer; width contrast within a superfamily is rarer, it
holds together better on a dense spec page, and it halves the font payload.

The tension is deliberate: the display type is **wide and planted**, the shear motif is
**forward-leaning**. The board sits still, the mark cuts across it. If the type also
leaned, the page would just look fast, and fast is the thing every competitor is already
shouting.

| Role | Face | Settings |
|---|---|---|
| Display | Archivo Expanded | `wdth 125`, `wght 700`, tracking `-0.02em`, sentence case |
| Body | Archivo | `wdth 100`, `wght 400/500`, tracking `0` |
| Instrument | Martian Mono | `wdth 87.5`, `wght 500`, tracking `0.08em`, uppercase |

Martian Mono is restricted to instrument readouts: slot IDs, region codes, ping values,
IP addresses, plan SKUs. Short strings at small sizes. It is a display mono and it must
never carry a sentence. This replaces JetBrains Mono, which is doing terminal cosplay
across the current site including in places that are just prose.

### Scale

```
display-xl   clamp(2.75rem, 6vw, 5rem)      /  0.98  Archivo Expanded 700
display-l    clamp(2rem, 4vw, 3.25rem)      /  1.05  Archivo Expanded 700
display-m    clamp(1.5rem, 2.5vw, 2rem)     /  1.15  Archivo Expanded 600
lead         1.25rem                        /  1.55  Archivo 400
body         1rem                           /  1.65  Archivo 400
small        0.875rem                       /  1.6   Archivo 400
instrument   0.6875rem                      /  1     Martian Mono 500
readout      1.5rem                         /  1     Martian Mono 500, tabular
```

Numbers inside prose and tables use Archivo's tabular figures
(`font-variant-numeric: tabular-nums`), not Martian Mono. Mono is for labels, not math.

### Rules of use

No all-caps display headlines. No letter-spaced hero type. No `// COMMENT_SLUG` headers,
which is the current site's habit and reads as a costume rather than a typographic idea.
Section labels are Martian Mono uppercase at `instrument` size, and that is the only place
uppercase is allowed.

## 7. Layout

**One continuous board per page, with content routed into it as inset slots on a
12-column measure.**

Container maxes at 1280px with 24px gutters, 20px page margin on mobile. 8px spacing base.
Section rhythm is 96px desktop, 56px mobile, and it lives on a single `.section` class so
type-based and class-based selectors cannot collide on it. This is a real trap in the
current stylesheet and it does not get repeated.

Panels are `slot` on `board`, inset, with a 1px `ink` outline at 12% and a 10px chamfer on
the top-left and bottom-right corners. Nothing casts a drop shadow. Depth comes from the
cut, not from a blur.

## 8. The signature element: the Capacity Board

The homepage hero is not a headline over a gradient. It is a live grid of every node
Lumix runs, one cell per slot, grouped by game and region.

- **Open** renders as a hollow cell, `ink` outline on `board`, exactly like the L in the
  logo. It is a button. On hover or keyboard focus the outline goes `lamp` and the cell
  fills with a 12% amber wash. Clicking it opens the ServerBuilder preloaded with that
  game and that region.
- **Running** renders as a solid `deep` cell, like the S in the logo. Not interactive.
  It carries the community name where the owner has opted in, which is what the existing
  monthly Spotlight is already for.
- **Capped** renders as `signal` with a 16-degree hatch. Not purchasable, and it says so.

The counter above it reads plainly: `14 OF 96 SLOTS OPEN`. Real numbers from
`src/data/catalog.ts` and the status pings, never a fake scarcity timer. If the number is
high it says so. The credibility only works if it can be unflattering.

This is the element the site gets remembered for. It is the capping policy made visible,
it is the logo's hollow-versus-solid rendered as UI, it is the primary navigation into the
configurator, and it justifies the company's name in one gesture. It cannot be reskinned
for another host, because no other host would be willing to show it.

## 9. Motion

**One orchestrated moment, on the board, once per session.**

On first paint the slot outlines draw left to right over 600ms with a 12ms stagger, then
the occupied cells fill over 200ms. That is the entire animation budget for the homepage.

Everything else is 150ms state transitions on `opacity`, `transform`, and `border-color`.
No parallax, no scroll-jacking, no counters ticking up, no marquees. The current site has
scattered fade-in-up observers on almost everything; restraint reads as more expensive
than density, and a single choreographed moment lands harder than twelve small ones.

Under `prefers-reduced-motion: reduce` the board renders in its final state immediately
and every transition drops to 0ms. Not a slower animation. None.

## 10. Quality floor

Non-negotiable, checked before anything merges:

- Responsive to 320px. The Capacity Board reflows to a horizontally scrollable strip per
  game below 640px, never to a squashed grid.
- Visible keyboard focus on every interactive element: 2px `lamp` outline at 2px offset.
  The board's cells are real buttons with real focus order.
- `prefers-reduced-motion` honored as specified above.
- Real copy everywhere. Active voice. Named after what the user controls ("Pick a region")
  not how the system works ("Region selection module").
- No placeholder content ships.
- Section spacing lives in one class. No type-selector spacing that a class can shadow.

## 11. What gets removed

The terminal costume, entirely: `Terminal.astro`, `.terminal-window`, `.terminal-header`,
the `--color-terminal-*` tokens, the `// SECTION_NAME` header pattern, and JetBrains Mono.
It is a competent execution of a look that says "we are hackers" to an audience that wants
to hear "your server will be up on Friday."

The stat block claiming `12 PoPs` and `10+ Tbps` also needs a hard look. Miami and Atlanta
are two real datacenters and saying so is more persuasive than a number nobody believes.
Honesty is the whole positioning; the stats bar is currently the one place the site
contradicts it.

---

## Self-critique, and the one thing cut

The risk in this direction is that a light ground plus heavy restraint reads as corporate
and cold to a gaming audience that expects energy. The game key art is the counterweight,
and it has to be given real size. If the build starts feeling like a B2B SaaS page, the
fix is bigger artwork, not more accent color.

**Cut:** an earlier version of this had a live region latency map alongside the Capacity
Board. Two live data objects on one screen compete, and the board is the stronger idea.
Latency lives as a number inside each region's board group instead.
