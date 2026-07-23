# Lumix Solutions — Build-Your-Server Handoff

Context for the combined repo that will hold three things side by side:

1. **This Astro marketing site** (`lumixsolutions.org`) — product presentation, the
   server builder, and cart-link generation.
2. **The WHMCS billing theme** (`lumix-billing-theme-main`) — the storefront/client-area skin.
3. **The WHMCS order form / cart** (the modified "cart" template) — currently a
   customized order form with an in-WHMCS builder baked in.

The goal of pulling all three together: fix the cart double-add, strip the cart/store
features that the Astro site now makes redundant, and reduce WHMCS to what it should
actually do from here — **the billing lifecycle only** (checkout, invoices, payment,
provisioning, client area). Product browsing and configuration now live on the Astro site.

---

## 0. Repositories — assemble the working directory

Clone (or copy) both into one parent folder:

| Repo | Source | Local copy |
|------|--------|------------|
| Astro marketing site (this repo) | `github.com/LordOfTheCorgis/lumix-website` | `…/Github Desktop/lumix-website` |
| WHMCS billing theme + cart (**private**) | `github.com/LordOfTheCorgis/lumix-billing-theme` | `…/Github Desktop/lumix-billing-theme` |

The billing repo is private — clone with an authenticated `git`/`gh`, or just copy the
local folder above. It contains both the billing theme and the modified cart/order form.

**The modified cart is the `nexus_cart` order form**, not a stock template — this answers
the earlier "regular nexus_cart vs modified" question: your customization *lives inside*
`nexus_cart`. Key paths in the billing repo:

```
billing/templates/orderform/nexus_cart/
  ├─ products.tpl          # store product listing (has the lx-order builder markup)
  ├─ configureproduct.tpl  # product config screen (sessionStorage lxLoc/lxAuto workaround)
  ├─ viewcart.tpl          # cart → checkout
  ├─ domainregister.tpl
  ├─ theme.yaml
  ├─ css/lumix-order.css
  └─ js/
billing/templates/new-theme/   # client-area / storefront skin
```

---

## 1. Architecture (target state)

```
lumixsolutions.org (Astro, static)          billing.lumixsolutions.org (WHMCS)
────────────────────────────────            ──────────────────────────────────
/games            catalog grid              cart.php?a=view   checkout
/games/[slug]     builder + Deploy   ──►     clientarea.php    account
                  (generates cart URL)       invoices / payment / provisioning
```

- The Astro site is the **only** place a customer picks a game, tier, location, and cycle.
- Clicking **Deploy** builds a `cart.php?a=add&…&skipconfig=1` URL and sends the browser
  straight to the WHMCS cart, config screen skipped.
- WHMCS is the **system of record** for what a customer is actually charged. The prices in
  the Astro catalog are display copy that must be kept in sync manually (or via the
  optional Phase 2 GetProducts API sync, not built yet).

**Implication for simplifying WHMCS:** the storefront product pages and the in-WHMCS
builder (the `lx-order` / `order-standard_cart` template) are no longer the customer's
entry point. They can be stripped down or removed. Keep only cart → checkout → billing.

---

## 2. WHMCS integration contract (verified against live install)

### Cart URL format

```
https://billing.lumixsolutions.org/cart.php
  ?a=add
  &pid=<PRODUCT_ID>
  &billingcycle=<CYCLE>
  &skipconfig=1
  &configoption[3]=<LOCATION_VALUE_ID>      // omit for products with no location option
```

- `skipconfig=1` lands the browser on `cart.php?a=view` with the config screen skipped —
  **verified in a real browser**, item shows correct product, location, and cycle.
- `skipconfig=1` only works if **every** configurable option group attached to the product
  has a value in the URL. Miss one and WHMCS shows its config screen for that group.
- `billingcycle` values: `monthly`, `quarterly`, `semiannually`, `annually`, `biennially`,
  `triennially`. Not every product sells every cycle — the catalog encodes which.

### Location configurable option (shared across all game products)

| Field | Value |
|-------|-------|
| Group ID | `3` (the `N` in `configoption[N]`) |
| Miami, FL | value id `3` |
| Ashburn, VA | value id `5` |

Application Hosting has **no** location option attached, so its links omit `configoption[]`.

### Live product IDs (read from storefront `lxTiersData` JSON)

**FiveM** (`/store/fivem-hosting`)

| Tier | pid | Monthly |
|------|-----|---------|
| Starter | 16 | $8.99 |
| Budget | 17 | $12.99 |
| Standard | 18 | $18.99 |
| Advanced | 22 | $26.99 |
| Premium | 21 | $31.99 |
| Elite | 20 | $42.99 |
| Ultimate | 19 | $52.99 |

**Minecraft** (`/store/minecraft-hosting`)

| Tier | pid | Monthly |
|------|-----|---------|
| Starter | 24 | $14.99 |
| Budget | 25 | $19.99 |
| Standard | 26 | $27.99 |
| Advanced | 27 | $34.99 |
| Premium | 28 | $42.99 |
| Elite | 29 | $58.99 |
| Ultimate | 30 | $67.99 |

**Palworld** (`/store/palworld-hosting`)

| Tier | pid | Monthly |
|------|-----|---------|
| Starter | 31 | $9.99 |
| Budget | 32 | $14.99 |
| Standard | 33 | $21.99 |
| Advanced | 34 | $29.99 |
| Premium | 36 | $38.99 |
| Elite | 37 | $48.99 |
| Ultimate | 38 | $59.99 |

pid `35` is skipped upstream in WHMCS. Palworld ships no MySQL database, so
`databases` is `0` on every tier and the builder hides the DB spec chip.

**BeamMP** (`/store/beammp`, group `gid=9`)

| Tier | pid | Monthly |
|------|-----|---------|
| Starter | 40 | $5.99 |
| Budget | 41 | $8.99 |
| Standard | 42 | $12.99 |
| Advanced | 43 | $17.99 |
| Premium | 44 | $23.99 |
| Elite | 45 | $29.99 |
| Ultimate | 46 | $37.99 |

BeamMP is the **only** game category with no location configurable option
attached, so `hasLocations: false` and its cart URLs carry no `configoption[]`.
Attach group `3` to pids 40-46 in WHMCS admin to enable region selection, then
flip the flag. Like Palworld it ships no MySQL database, so `databases` is `0`.

**Terraria** (`/store/game-hosting`) — pid `14`, $5.00/mo
**Application Hosting** (`/store/application-hosting`) — Node.js `6`, Python `7`, Golang `8`, all $4.00/mo (not surfaced on the Astro site; still a live WHMCS product)

Palworld is now live on the site (pids above, read from the storefront). More games planned.

---

## 3. Open issue: cart double-add (the "link doesn't work properly" report)

### What happens

WHMCS `cart.php?a=add` **appends** to the session cart instead of replacing. Verified:
clicked Deploy, went back, clicked again → **2 servers in cart, $486.98 total**. A customer
who configures, reconsiders, reconfigures, and clicks Deploy again buys twice.

### What does NOT fix it

- **Switching from the modified order form to the stock/nexus cart template.** The additive
  cart is **WHMCS core `cart.php` controller behavior**, not a template behavior. The order
  form template only controls the product-browsing/config UI *before* `cart.php?a=view`.
  Reverting the template changes appearance, not `a=add` accumulation — and would lose the
  custom in-WHMCS builder for nothing.
- `&empty=1` on the add URL — ignored (cart went from 2 to 3).
- `cart.php?a=empty` via GET — non-functional on this install (cart stayed at 3). Likely
  needs a POST + CSRF token, or is disabled. Either way, **the cart cannot be cleared from
  another origin** (`lumixsolutions.org` → `billing.lumixsolutions.org`).

### Mitigation already shipped (Astro side)

`ServerBuilder.astro` records a `sessionStorage` handoff flag on Deploy click and, on a
return visit, shows a warning above the button: *"You already sent a configuration to the
cart. Deploying again adds a second server."* Bandage, not a cure.

### Real fix (do this in the combined repo)

**Recommended — clear-on-arrival flag for the `nexus_cart` order form:**

1. Add a query param to every Deploy URL, e.g. `&lxfresh=1` (add it in
   `src/lib/orderUrl.ts` on the Astro side).
2. When `lxfresh` is present on an `a=add` request, empty `$_SESSION['cart']` **before** the
   product is added. `.tpl` files are Smarty (view only), so the reset belongs in PHP: a
   small `hooks.php` on `ShoppingCartValidateProduct` / `ClientAreaPage` (cleanest, no core
   edits), or the `nexus_cart` order form controller if one is customized.
3. Result: exactly one server per Deploy, regardless of clicks or back-and-retry.

Alternative: a `ShoppingCart`/cart hook that does the same reset server-side (no template
edit, but fiddlier). Weakest option: rely on the shipped warning + WHMCS cart Remove buttons.

> Framing note: an additive cart is normal e-commerce behavior. It only bites here because
> the Deploy links are one-click direct-adds. The `lxfresh` flag makes the link's intent
> explicit ("fresh single deploy"), which is what we actually want.

---

## 4. Other WHMCS housekeeping

| Item | Status | Where |
|------|--------|-------|
| Ultimate Minecraft biennial was $15,335.99 (typo) | **FIXED** in WHMCS → $1,535.99; Astro catalog updated | product id 30 |
| Terraria description reads "our Minecraft Budget Plan" | Owner fixing | product id 14 |
| Billing footer says "Miami and Dallas" | Open | billing theme footer; should read "Miami and Ashburn" |

---

## 5. WHMCS simplification plan (billing-only target)

Since the Astro site owns product presentation and configuration, WHMCS no longer needs its
storefront/browsing layer. Suggested passes for the combined repo:

- **Remove / hide the in-WHMCS builder** (the `lx-order` markup in
  `nexus_cart/products.tpl` and the `sessionStorage` `lxLoc`/`lxAuto` workaround in
  `nexus_cart/configureproduct.tpl`). Deploy links land at `cart.php?a=view`, so the builder
  UI is dead weight.
- **Trim storefront browsing** that duplicates `/games` (store category pages, product
  listing/config screens) once nothing links to them.
- **Add the `lxfresh` clear-on-arrival behavior** to the cart (Section 3).
- **Keep:** cart → checkout, client area, invoices, payment gateways, provisioning, email.
- Retest every Deploy link after trimming — `skipconfig=1` depends on the config screen and
  option groups still resolving.

---

## 6. Astro site — key files

| File | Purpose |
|------|---------|
| `src/data/catalog.ts` | **Single source of truth** — pids, per-cycle prices, specs, location IDs, live vs coming-soon. All product changes happen here. |
| `src/lib/orderUrl.ts` | Dependency-free cart-URL builder; shipped to the browser. **Add `lxfresh` here.** |
| `src/lib/whmcs.ts` | Server-side wrapper + pricing/savings helpers. |
| `src/components/ServerBuilder.astro` | The builder island (plan/location/addons/cycle, live summary, Deploy). Holds the double-add warning. |
| `src/components/GameTile.astro` | Catalog card; real cover art or generated fallback tile; dims coming-soon titles. |
| `src/pages/games/index.astro` | Catalog grid (one shelf, coming-soon dimmed in place). |
| `src/pages/games/[slug].astro` | Per-game builder page; statically generated from `liveCategories`. |
| `src/data/site.ts` | Nav, site config, billing/panel links. |
| `public/images/games/` | Cover art (`<slug>.jpg`/`.png`). Owner is replacing these. |

### Catalog invariants

- A category is orderable only when `status: "live"` **and** it has ≥1 plan with a `pid`.
- To promote a coming-soon game: create the WHMCS product, read its pid from the storefront
  source (`lxTiersData`), move the entry into the live block with a populated `plans` array.
- Adding a game = a data change in `catalog.ts`, not a new page/template.

---

## 7. Image licensing note

Cover art is publisher-owned (GTA V, Minecraft, Palworld, etc.) served from Steam/Wikimedia.
Standard practice for hosts; competitors (RocketNode/Sparked) use the same GTA V art for
FiveM. Not formally licensed — swap any a publisher objects to. FiveM has no art of its own
(it's a GTA V mod), so GTA V roleplay art is the industry norm for it.

---

## 8. Not yet built (optional Phase 2)

- Astro API route calling WHMCS `GetProducts` to live-sync displayed pricing instead of
  maintaining it by hand in `catalog.ts`. Requires an Astro server adapter.
