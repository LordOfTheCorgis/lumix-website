# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

- [ ] **PostHog project API key.** Settings > Project > Project API Key in
      PostHog. Goes in `.env` as `PUBLIC_POSTHOG_KEY` (see `.env.example`).
      Confirm the host is US (`https://us.i.posthog.com`) or set EU. Until
      it's set, analytics and the cookie banner both render nothing.
- [ ] **Trustpilot score and review count, by hand.** The embeddable widgets
      turned out to be paid-tier only, so the hero line is typed. Read the
      TrustScore and review count off trustpilot.com/review/lumixsolutions.org
      and put them in `trust` in `src/config.ts` with today's date. Line
      doesn't render until both are set.
- [ ] **One HTTP URL per region for the ping test.** Anything in that
      datacenter that answers fast: a node's panel host, a status endpoint,
      even a 404 page. Goes in `pingUrl` on each `HOSTING` entry in
      `src/lib/locations.ts`. The "Your ping from here" block is hidden until
      at least one is set.
- [ ] **Support hours and a real response time.** The "Every server comes
      with" section and the FAQ say ticket + Discord and promise no hours,
      because nobody's given a number. If you have one (average first reply,
      hours staffed), it goes in `src/components/Included.astro` and
      `src/lib/faq.ts`. Every competitor quantifies this.
- [ ] **Read the FAQ answers** in `src/lib/faq.ts`. Ten answers written from
      the yaml and what you've told me. The proration claim on plan changes
      is WHMCS's default; confirm it's on.
- [ ] **cPanel Node version.** Astro 7 needs Node 22.12+. Nobody has checked
      whether the cPanel box offers it. If it doesn't, the admin panel plan
      in BUILD-PLAN.md is dead and static-only deploy is the fallback.
- [ ] **Deploy path.** `.github/workflows/deploy.yml` is the old workflow,
      switched to manual-only (`workflow_dispatch`) on 2026-10-08 so merging
      redesign can't rsync `--delete` over `/srv/www/lumixsolutions.org/`.
      Decide: build in CI and rsync `dist/` to cPanel, or build on the box.
      Depends on the Node answer above. Then fix the target and put the
      trigger back.
- [ ] **`/status`, the last 404 in the nav.** Header and footer both link
      it. Pick one: link out to a real status provider if you run one
      (UptimeRobot, BetterStack, Instatus), a page that only pings the four
      regions live off the same `pingUrl`s as `/regions`, or pull it from
      the nav until one exists. Not a fake uptime history like main had.
- [ ] **Only Dallas is orderable in WHMCS, the site says four regions.**
      Checked 2026-10-08: the "Server Location" option (group 3) on every
      FiveM, Minecraft, Palworld and Terraria product offers exactly one
      value, Dallas (6). BeamMP has no location option at all. Meanwhile
      the home page, /regions, the FAQ and the footer tagline all say
      Salt Lake City, Dallas, Ashburn and Miami, and the billing footer says
      "Miami and Dallas". The game page picker shows the other three greyed
      as "Not taking orders yet". Either turn them on in WHMCS (then put each
      value id in `REGION_VALUE_IDS`, `src/lib/orderOptions.ts`) or say
      which regions are real and the copy gets cut back to match.
- [ ] **LUMIX10 can't be pre-applied from a link.** The code works when typed
      into the cart (10% off, tested). `promocode=` on the URL is ignored by
      this install's cart template in every form tried. If you want it
      automatic, it needs a small WHMCS hook; until then the site tells
      people to type it in.
- [ ] **WHMCS cart adds a duplicate on every Order click.** Same as main's
      notes: `a=add` appends. Game pages now warn after the first click
      in a visit. Real fix is the `lxfresh` hook from main's HANDOFF.md
      section 3 (`git show main:HANDOFF.md`).
- [ ] **`status.lumixsolutions.org` exists** (linked from the billing
      footer). If that's a real status page, `/status` can just point there.
- [ ] **Read `/staff` and `/contact`** (2026-10-08). Both bios in
      `src/lib/staff.ts` are rewritten from main's and said in your and
      Keaghan's names. `/contact` leaves `support@` off on purpose (tickets
      are the record); say if that inbox should be on the page.

- [ ] **"Dedicated vCores, never oversold" vs the hardware page.** Dallas
      has 16 threads, Ashburn and Miami 12. The top plans promise 6
      dedicated vCores each. Now the CPUs are public, anyone can do that
      division. If nodes carry more vCores than threads, the line in
      `Included.astro`, `faq.ts` and the game yaml needs rewording.
- [ ] **Confirm RAID 1.** Provider panel says "2 TB, 2 disks" on every
      node. The site says NVMe on RAID 1. If the second disk isn't a mirror,
      fix `src/lib/hardware.ts` and the other three places together.
- [ ] **Salt Lake City has no node.** Your screenshots are Miami (MFL014),
      Ashburn (ASH510) and Dallas (DTX56). /hardware lists those three; the
      home page, /regions, FAQ and tagline still say SLC.
- [ ] **Miami and Ashburn nodes exist but WHMCS only sells Dallas.** Add
      them to the Server Location option, send me the value ids.

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

## Pages added 2026-09-14

- [ ] **Demo panel user.** Make a read-only user on Lumi-Panel with one
      server on it, put the URL and credentials in `demoPanel` in
      `src/config.ts`. The "Look around the panel first" button on every
      game page and on `/migrate` appears on its own.
- [ ] **Ping endpoints, again.** `/regions` now shows all four greyed with
      "soon" until `pingUrl` is set per region in `src/lib/locations.ts`.
      Anything HTTP in the datacentre that answers fast.
- [ ] **Confirm the `/regions` FAQ.** It says moving between regions is
      "ask on a ticket" and every game goes in every region at the same
      price. Both are what the site already implied; say if either is wrong.
- [ ] **Confirm the `/migrate` promises.** "Under an hour for 10 GB" and
      "we stop the old one, pull it, start it here" describe the importer
      path done by support. If support doesn't do migrations on a ticket,
      the second column comes out.

## Tools

- [ ] **Confirm or cut the three planned tools** on `/tools`: Minecraft
      server.properties, Rust startup command, FiveM permissions.cfg. They're
      dimmed and link to Discord, so nothing's promised, but they're on the
      page in your name. Edit `tools` in `src/pages/tools/index.astro`.
- [ ] **Sanity-check the cfg maker output** against a server you actually
      run. The framework blocks come from QBCore's own recipe and ESX's
      repo, the Enhanced rules from cfx's Legacy-vs-Enhanced page, all read
      2026-09-14. If a preset is wrong for how you deploy, `src/lib/fivem.ts`.

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
