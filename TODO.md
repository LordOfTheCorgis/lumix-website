# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

## Pricing (WHMCS, not the site)

- [ ] **Type the new term prices into WHMCS.** These come straight from the
      yaml in `src/content/games/` (commit c7f4cfe): 95/92/90/85/80% of
      monthly for quarterly through triennial, and no price went up. Monthly
      didn't change. **Bold** = changed, old WHMCS price in parens. Plain =
      already right, leave it. Until WHMCS matches, checkout charges the old
      term prices. Bot hosting (pids 7/8/9) is monthly-only at $4, nothing
      to change there.

#### BeamMP

| Plan | pid | Monthly | Quarterly | Semi | Annual | Biennial | Triennial |
|---|---|---|---|---|---|---|---|
| BeamMP Starter Plan | 40 | 5.99 | 16.99 | **32.99** (34.99) | **64.99** (67.99) | **121.99** (131.99) | **172.99** (179.99) |
| BeamMP Budget Plan | 41 | 8.99 | 25.99 | **49.99** (52.99) | **96.99** (101.99) | **182.99** (203.99) | **258.99** (287.99) |
| BeamMP Standard Plan | 42 | 12.99 | 36.99 | **71.99** (75.99) | **139.99** (143.99) | **264.99** (311.99) | **373.99** (431.99) |
| BeamMP Advanced Plan | 43 | 17.99 | 50.99 | **98.99** (101.99) | **193.99** (203.99) | **366.99** (395.99) | **517.99** (575.99) |
| BeamMP Premium Plan | 44 | 23.99 | **67.99** (68.99) | **131.99** (137.99) | **258.99** (275.99) | **488.99** (551.99) | **690.99** (791.99) |
| BeamMP Elite Plan | 45 | 29.99 | **84.99** (85.99) | **165.99** (173.99) | **323.99** (347.99) | **611.99** (671.99) | **863.99** (971.99) |
| BeamMP Ultimate Plan | 46 | 37.99 | 107.99 | **209.99** (221.99) | **409.99** (443.99) | **774.99** (863.99) | **1093.99** (1295.99) |

#### FiveM

| Plan | pid | Monthly | Quarterly | Semi | Annual | Biennial | Triennial |
|---|---|---|---|---|---|---|---|
| Starter FiveM Server | 16 | 8.99 | 25.49 | 49.99 | 95.99 | 179.99 | 251.99 |
| Budget FiveM Server | 17 | 12.99 | 36.99 | **71.99** (73.99) | **139.99** (143.99) | **264.99** (275.99) | **373.99** (395.99) |
| Standard FiveM Server | 18 | 18.99 | 53.99 | **104.99** (107.99) | **204.99** (215.99) | **386.99** (407.99) | **546.99** (611.99) |
| Advanced FiveM Server | 22 | 26.99 | 76.99 | **148.99** (149.99) | **290.99** (311.99) | **550.99** (599.99) | **776.99** (863.99) |
| Premium FiveM Server | 21 | 31.99 | 90.99 | **176.99** (179.99) | **344.99** (347.99) | **652.99** (671.99) | **920.99** (971.99) |
| Elite FiveM Server | 20 | 42.99 | 122.99 | **236.99** (239.99) | **463.99** (467.99) | **876.99** (887.99) | **1237.99** (1295.99) |
| Ultimate FiveM Server | 19 | 52.99 | 150.99 | **292.99** (299.99) | **571.99** (575.99) | **1080.99** (1103.99) | **1525.99** (1583.99) |

#### Minecraft

| Plan | pid | Monthly | Quarterly | Semi | Annual | Biennial | Triennial |
|---|---|---|---|---|---|---|---|
| Starter Minecraft Server | 24 | 14.99 | 42.99 | **82.99** (83.99) | **161.99** (167.99) | **305.99** (323.99) | **431.99** (467.99) |
| Budget Minecraft Plan | 25 | 19.99 | 56.99 | **109.99** (113.99) | **215.99** (227.99) | **407.99** (431.99) | **575.99** (647.99) |
| Standard Minecraft Plan | 26 | 27.99 | 79.99 | **154.99** (155.99) | **301.99** (323.99) | **570.99** (623.99) | **805.99** (899.99) |
| Advanced Minecraft Plan | 27 | 34.99 | 99.99 | **192.99** (203.99) | **377.99** (407.99) | **713.99** (791.99) | **1007.99** (1151.99) |
| Premium Minecraft Plan | 28 | 42.99 | 122.99 | **236.99** (251.99) | **463.99** (503.99) | **876.99** (983.99) | **1237.99** (1439.99) |
| Elite Minecraft Plan | 29 | 58.99 | 167.99 | **325.99** (335.99) | **636.99** (671.99) | **1202.99** (1343.99) | **1698.99** (1943.99) |
| Ultimate Minecraft Plan | 30 | 67.99 | 191.99 | **374.99** (383.99) | **733.99** (767.99) | **1386.99** (1535.99) | **1957.99** (2303.99) |

#### Palworld

| Plan | pid | Monthly | Quarterly | Semi | Annual | Biennial | Triennial |
|---|---|---|---|---|---|---|---|
| Palworld Starter Plan | 31 | 9.99 | **27.99** (28.49) | **54.99** (55.99) | 107.99 | 203.99 | 287.99 |
| Palworld Budget Plan | 32 | 14.99 | 42.99 | **82.99** (83.99) | **161.99** (167.99) | **305.99** (323.99) | **431.99** (467.99) |
| Palworld Standard Plan | 33 | 21.99 | 62.99 | **120.99** (125.99) | **236.99** (251.99) | **448.99** (503.99) | **632.99** (755.99) |
| Palworld Advanced Plan | 34 | 29.99 | **84.99** (85.99) | **165.99** (167.99) | **323.99** (335.99) | **611.99** (647.99) | **863.99** (935.99) |
| Palworld Premium Plan | 36 | 38.99 | 110.99 | **214.99** (221.99) | **420.99** (443.99) | **794.99** (863.99) | **1122.99** (1295.99) |
| Palworld Elite Plan | 37 | 48.99 | **139.99** (140.99) | **269.99** (281.99) | **528.99** (563.99) | **998.99** (1151.99) | **1410.99** (1691.99) |
| Palworld Ultimate Plan | 38 | 59.99 | 170.99 | **330.99** (341.99) | **647.99** (683.99) | **1223.99** (1343.99) | **1727.99** (1979.99) |

#### Terraria

| Plan | pid | Monthly | Quarterly | Semi | Annual | Biennial | Triennial |
|---|---|---|---|---|---|---|---|
| Starter Terraria Server | 14 | 5.00 | **13.99** (14.00) | 27.00 | 48.00 | - | - |

- [ ] **Six new Terraria products in WHMCS.** Budget, Standard, Advanced,
      Premium, Elite, Ultimate. Specs and all six cycle prices are in the
      commented block in `src/content/games/terraria.yaml`, same curve as
      everything else. Put them in the Terraria group next to pid 14 (and
      rename pid 14 to "Starter Terraria Server" so the cart matches the
      site). Then send me the six pids, or fill `pid:` and uncomment.

| Plan | Monthly | Quarterly | Semi | Annual | Biennial | Triennial | Specs |
|---|---|---|---|---|---|---|---|
| Budget Terraria Server | 6.99 | 19.99 | 38.99 | 75.99 | 142.99 | 200.99 | 2c / 3 GB / 20 GB / 1 db / 3 backups |
| Standard Terraria Server | 8.99 | 25.99 | 49.99 | 96.99 | 182.99 | 258.99 | 2.5c / 4 GB / 25 GB / 2 db / 3 backups |
| Advanced Terraria Server | 11.99 | 33.99 | 65.99 | 129.99 | 244.99 | 344.99 | 3c / 6 GB / 35 GB / 2 db / 4 backups |
| Premium Terraria Server | 14.99 | 42.99 | 82.99 | 161.99 | 305.99 | 431.99 | 3.5c / 8 GB / 45 GB / 3 db / 4 backups |
| Elite Terraria Server | 18.99 | 53.99 | 104.99 | 204.99 | 386.99 | 546.99 | 4c / 10 GB / 60 GB / 4 db / 5 backups |
| Ultimate Terraria Server | 22.99 | 65.99 | 126.99 | 247.99 | 468.99 | 661.99 | 4c / 12 GB / 75 GB / 5 db / 5 backups |

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
