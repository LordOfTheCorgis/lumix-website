# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

- [ ] **Bot / application hosting product in WHMCS.** $4.00/mo. Need the
      product ID. Drop it into `botHosting.pid` in `src/config.ts` and the
      "Order one" link on the homepage goes straight to a preloaded cart
      instead of the store front.
- [ ] **Read the FAQ answers** in `src/lib/faq.ts`. Ten answers written from
      the yaml and what you've told me. The proration line came out
      2026-09-23 since nobody's confirmed it's on in WHMCS; put it back if it is.
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
- [ ] **Louisiana counsel on Terms sections 7 and 9.** Louisiana is civil law;
      broad liability disclaimers behave differently there. Nobody's reviewed.
## Pages added 2026-09-14

- [ ] **Demo panel user.** Make a read-only user on Lumi-Panel with one
      server on it, put the URL and credentials in `demoPanel` in
      `src/config.ts`. The "Look around the panel first" button on every
      game page and on `/migrate` appears on its own.
## Staff page

- [ ] **Caleb's last initial and photo.** `src/lib/staff.ts`, third entry.
      Card shows "Caleb" with a monogram until then. Headshot goes in
      `src/assets/staff/`, any aspect, the card crops to 4:5 from the top.
- [ ] **Bios.** All three are mine, written in the site's voice from the
      old site's titles. Rewrite yours; ask Keaghan and Caleb to rewrite theirs.
- [ ] **Links.** `links` is empty on all three on purpose. LinkedIn, GitHub,
      X: add `{ label, href }` pairs for whatever's meant to be public.

## Tools

- [ ] **Sanity-check the cfg maker output** against a server you actually
      run. The framework blocks come from QBCore's own recipe and ESX's
      repo, the Enhanced rules from cfx's Legacy-vs-Enhanced page, all read
      2026-09-14. If a preset is wrong for how you deploy, `src/lib/fivem.ts`.

## Later, not blocking

- [ ] **Capacity Board.** DESIGN.md section 8's signature element, never built.
      Needs a live source for slot counts and per-region ping.
- [ ] **Admin panel** per BUILD-PLAN.md. Gated on whether the cPanel box
      runs Node 22.12+, which nobody has checked.
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
- Deploy: CI. Push to main builds and rsyncs to /srv/www/lumixsolutions.org (secrets were already set, PostHog comes from repo variables).
- YouTube: left out for good.
- Support: "within a few hours", plus support@lumixsolutions.org. On
  `/contact`, the FAQ and Included.
- FiveM: no Legacy/Enhanced claim on the game page.
- `/migrate`: support does migrations on a ticket, no time promise.
- Miami and Ashburn are sold out, via `soldOut` in `src/lib/locations.ts`.
  Flip it off there and regions, home and FAQ all follow.
- `/tools`: the three planned tools stay, dimmed.
