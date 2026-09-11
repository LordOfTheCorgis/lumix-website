# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

- [ ] **Create `LUMIX10` in WHMCS.** 10% off, evergreen. The site already
      advertises it (hero, every game page). Until the promotion exists the
      cart rejects the code. Config: `promo` in `src/config.ts`; flip `live`
      to false if you want it off the page in the meantime.
- [ ] **Bot / application hosting product in WHMCS.** $4.00/mo. Need the
      product ID. Drop it into `botHosting.pid` in `src/config.ts` and the
      "Order one" link on the homepage goes straight to a preloaded cart
      instead of the store front.
- [ ] **PostHog project API key.** Settings > Project > Project API Key in
      PostHog. Goes in `.env` as `PUBLIC_POSTHOG_KEY` (see `.env.example`).
      Confirm the host is US (`https://us.i.posthog.com`) or set EU. Until
      it's set, analytics and the cookie banner both render nothing.
- [ ] **Trustpilot TrustBox IDs.** Trustpilot Business > Integrations >
      TrustBox > pick a template > copy the snippet. Two values:
      `PUBLIC_TRUSTPILOT_BUSINESSUNIT_ID` and `PUBLIC_TRUSTPILOT_TEMPLATE_ID`
      in `.env`. Set `PUBLIC_TRUSTPILOT_HEIGHT` to whatever height that
      template documents. Reviews section is invisible until both are in.
- [ ] **cPanel Node version.** Astro 7 needs Node 22.12+. Nobody has checked
      whether the cPanel box offers it. If it doesn't, the admin panel plan
      in BUILD-PLAN.md is dead and static-only deploy is the fallback.
- [ ] **Deploy path.** `.github/workflows/deploy.yml` is the old, dead
      workflow. Decide: build in CI and rsync `dist/` to cPanel, or build on
      the box. Depends on the Node answer above.
- [ ] **Pages the nav links to that don't exist yet:** `/games`, `/partners`,
      `/status`, `/contact`, `/staff`, `/privacy`, `/terms`, `/ccpa`. Header
      and footer currently point at 404s. Legal three have content in
      `src/content/legal/` and just need routing checked. When `/games` gets
      built, its terminal readout must be generated from the games
      collection, not hand-typed (the old site's dropped Terraria).

## Pricing (WHMCS, not the site)

- [ ] **Fix the annual-cycle dips.** Discount is supposed to rise with
      commitment and it wobbles on most plans. Worst ones, from the yaml:
      - FiveM pid 22: annual saves 4% while semiannual saves 7%
      - Minecraft pid 26: same shape, annual 4% vs semiannual 7%
      - BeamMP pid 42: biennial saves 0% after annual saves 8%
      - Palworld pid 37: biennial 2% after annual 4%
      - Minecraft 27/28, BeamMP 44/45/46: semiannual saves less than quarterly
      Fix in WHMCS, then mirror the new numbers into `src/content/games/*.yaml`
      so the Offer schema stays honest. Run this to see the whole curve:
      `python3 -c` over the yaml (or ask for the script again).
- [ ] **Decide the discount ceiling.** Every tracked competitor gives ~20% at
      annual; Lumix gives 5%. Margin call. Nothing on the site depends on it
      since only monthly is shown.

## Content

- [ ] **Terraria key art.** `src/assets/games/terraria.jpg` is 460×215, a
      thumbnail. It's the one game that never gets the hero because anything
      under 1200 wide is skipped. Drop a real 1600+ image in and it joins the
      rotation on its own.
- [ ] **YouTube channel.** `youtube.com/@officiallumixsolutions` is a hard 404
      and was pulled from the footer. Either fix the handle or leave it out.
      Restore in `links` and `social` in `src/config.ts` when it resolves.
- [ ] **Louisiana counsel on Terms sections 7 and 9.** Louisiana is civil law;
      broad liability disclaimers behave differently there. Nobody's reviewed.
- [ ] **Confirm the FiveM Enhanced line.** Page now says "GTA V Legacy and
      Enhanced builds" on your word. If the panel needs a manual step for
      Enhanced, say so on the page or take the line out.

## Later, not blocking

- [ ] **Capacity Board.** DESIGN.md section 8's signature element, never built.
      Needs a live source for slot counts and per-region ping.
- [ ] **Admin panel** per BUILD-PLAN.md. Gated on the cPanel Node question.
- [ ] **Game detail pages should open in their own accent and art**, same
      treatment as the home hero. That's where the colour story pays off after
      the click.
- [ ] **Minecraft modpack/loader choice at checkout.** Apex and ZAP sell it at
      order time. Decision was: handled on the panel. Page says so now. Revisit
      if conversion on Minecraft lags the others.

## Decided, no action

- Changelog: dropped from the redesign. Not maintained, so not shipped.
- Free trial: none. Page says so.
- Refunds: case by case. Page says so, matches terms.md.
