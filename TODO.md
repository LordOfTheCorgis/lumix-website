# Evan's list

Things only Evan can do, or decided to do himself. Written 2026-09-11 after
the redesign branch got the hero, the globe, and the marketing-log fixes.
Cross one off by deleting it. If it needs a code change afterwards, say so in
the commit and point at this file.

## Blocks the launch

- [ ] **Turn on /status (2026-10-08).** Two steps. (1) GitHub repo >
      Settings > Secrets and variables > Actions > New secret, name
      `STATUS_TARGETS`, value in the format at the top of
      `scripts/status-check.mjs` (region=ip:22, semicolon-separated). Never
      put those IPs anywhere in the repo itself, it's public. (2) The
      workflow only runs on a schedule from `main`, so it starts when
      redesign merges (or copy `.github/workflows/status.yml` +
      `scripts/status-check.mjs` onto main sooner). Then point the billing
      footer's Status link at lumixsolutions.org/status.
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
- [ ] **cPanel Node version.** Astro 7 needs Node 22.12+. Nobody has checked
      whether the cPanel box offers it. If it doesn't, the admin panel plan
      in BUILD-PLAN.md is dead and static-only deploy is the fallback.
- [ ] **Deploy path.** `.github/workflows/deploy.yml` is the old workflow,
      switched to manual-only (`workflow_dispatch`) on 2026-10-08 so merging
      redesign can't rsync `--delete` over `/srv/www/lumixsolutions.org/`.
      Decide: build in CI and rsync `dist/` to cPanel, or build on the box.
      Depends on the Node answer above. Then fix the target and put the
      trigger back.
- [ ] **Miami and Ashburn are sold out.** When one reopens, add it back to
      WHMCS's Server Location option, put its value id in
      `REGION_VALUE_IDS` (`src/lib/orderOptions.ts`) and flip its
      `availability` to "open" in `src/lib/locations.ts`.

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
## Doing together (Evan, 2026-10-08)

- [ ] **Demo panel user.** Make a read-only user on Lumi-Panel with one
      server on it, put the URL and credentials in `demoPanel` in
      `src/config.ts`. The "Look around the panel first" button on every
      game page and on `/migrate` appears on its own.
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
- Plan changes: no proration, upgrades pay the difference. FAQ says so.
- Overselling: not mentioned anywhere, and the site no longer says
  "never oversold" or "dedicated vCores". Keep it that way.
- Prices: pulled from WHMCS 2026-10-08, no cycle dips, yearly saves 10-20%.
- Cart-side fixes (promo code from a link, duplicate adds): WHMCS's side,
  not ours. The site tells people to type the code and warns on repeats.
