# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

## Pricing (WHMCS, not the site)

- [ ] **Type the new term prices into WHMCS.** The yaml files in
      `src/content/games/` hold them now: 95/92/90/85/80% of monthly for
      quarterly through triennial, and no price went up (commit c7f4cfe).
      Monthly didn't change. Until WHMCS matches, checkout charges the old
      term prices.

## Content

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
- [ ] **Staff links.** Evan wants them (2026-09-23). Need the actual URLs
      (LinkedIn, GitHub, X) for Evan, Keaghan, and Caleb. They go in as
      `{ label, href }` in `src/lib/staff.ts`.

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
- [ ] **Minecraft modpack/loader choice at checkout.** Apex and ZAP sell it at
      order time. Decision was: handled on the panel. Page says so now. Revisit
      if conversion on Minecraft lags the others.

## Decided, no action

- Changelog: dropped from the redesign. Not maintained, so not shipped.
- Free trial: none. Page says so.
- Refunds: case by case. Page says so, matches terms.md.
- Deploy: not wired. The workflow on this branch is manual-only with `if: false`. The existing secrets point at the wrong server, and the redesign is not going live yet.
- YouTube: left out for good.
- Support: "within a few hours", plus support@lumixsolutions.org. On
  `/contact`, the FAQ and Included.
- FiveM: no Legacy/Enhanced claim on the game page.
- `/migrate`: support does migrations on a ticket, no time promise.
- Miami and Ashburn are sold out, via `soldOut` in `src/lib/locations.ts`.
  Flip it off there and regions, home and FAQ all follow.
- `/tools`: the three planned tools stay, dimmed.
- Bot hosting: Node.js pid 7, Python pid 8, Go pid 9, all $4/mo.
- Plan changes: you pay the difference. The FAQ says so.
- VM IPs: never on the site. VMs show host up/down off the node ping.
- Term discounts: 95/92/90/85/80% of monthly, prices only ever go down.
- Terraria: Steam's library_hero, 1920x620.
- Bios: the ones I wrote stay.
- Game detail pages already use the game's own accent and art.
