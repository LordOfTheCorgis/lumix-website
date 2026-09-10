# Lumix Website — Admin & Content Build Plan

Goal: `lumixsolutions.org/admin`, password protected, where games, plans, locations,
staff, legal copy and sold-out flags get edited without touching source or waiting on a
build. Companion to DESIGN.md.

Scope note: this is the marketing site only. WHMCS is a separate product on a separate
host. The site never calls it, never reads stock from it, and never processes payment.
The only contact is that the configurator assembles a `cart.php` URL and hands the
customer over. Nothing in this plan changes that.

Verified against this repo: Astro 7.3.2, Tailwind 4.3.3, `@astrojs/node@11.1.5`
(peer `astro: ^7.2.1`, compatible). Astro 7 requires **Node 22.12+**.

---

## 1. The decision

**Run the site as an Astro SSR app under cPanel's Node.js application manager, with
`/admin` as real authenticated routes in the same codebase.**

This replaces the git-CMS plan wholesale. That plan existed to work around a static
build; on a server that can run Node, the workaround is unnecessary and strictly worse.

What it buys:

- `/admin` is a route on the real domain, not a subdomain, not a second deploy target,
  not a vendor.
- Edits are live the moment they save. No commit, no build, no deploy, no ninety-second
  wait. Sold-out toggles in particular become instant, which is what they always needed.
- One codebase, one deploy, one place to look when something breaks.
- The three-tier split from the previous plan collapses into one system. Structural
  content and volatile state stop needing different homes because nothing is baked at
  build time any more.

## 2. Verify this first, it gates everything

**cPanel → Software → Setup Node.js App.** Check that it exists and what Node versions
it offers.

Astro 7 needs **Node 22.12 or newer**. Plenty of cPanel installs cap out at Node 20,
especially older CloudLinux. If yours does, there are three ways forward, in order of
preference: ask the host to add a Node 22 alternative (usually a ticket, often same day);
run Node yourself under a process manager if you have root, with Passenger or a reverse
proxy in front; or downgrade the project to Astro 5, which runs on Node 20 and is what
this repo was on last week.

If Node is genuinely unavailable, jump to section 8 for the PHP fallback. It works, it is
just meaningfully worse, so exhaust the options above first.

## 3. Content storage

Files on disk. YAML for structured records, Markdown for long prose.

```
/home/<cpanel-user>/lumix-content/      ← OUTSIDE the app directory. this matters.
  games/          fivem.yaml, minecraft.yaml, rust.yaml, ...
  staff/          evan.yaml, keaghan.yaml
  teams/          engineering.yaml, ...
  legal/          privacy.md, terms.md, ccpa.md
  changelog/      2026-05-01-miami-live.md
  locations.yaml  Miami and Ashburn: code, label, valueId, note, soldOut
  spotlight.yaml
  announcements.yaml
  settings.yaml   nav, contact emails, social links
  users.json      admin accounts, hashed passwords
```

> **The content directory must live outside whatever the deploy writes to.** Every deploy
> mechanism worth using replaces the app directory, and a deploy that overwrites content
> silently reverts every edit made since the last commit. Put content in a sibling
> directory, point at it with an env var, and back it up separately.

No database. Content volume here is a dozen games, a handful of staff, three legal pages.
YAML on disk is faster than a query, diffs readably, backs up with `tar`, and needs no
native modules, which matters because native compilation on shared hosting is a bad time.

Git stays useful as a backup and history mechanism. It stops being the source of truth.

### Schemas still get validated

Astro content collections read this directory through `glob()` and `file()` loaders with
zod schemas, exactly as planned before. `pid` and `valueId` are WHMCS identifiers, and a
wrong one silently sends a customer to the wrong product, so they get validated on read.
In SSR the failure surfaces as a 500 on that page rather than a failed build, so the
admin validates on save too and refuses to write a record that would not load.

## 4. The admin

### Auth

Single-purpose, no framework, no vendor.

- `POST /admin/login` checks the password against a scrypt hash from `users.json`.
  `node:crypto` has `scrypt` built in, so this needs zero dependencies.
- Session is a signed, httpOnly, secure, SameSite=Lax cookie holding a random 32-byte id.
  Sessions live in a JSON file with an expiry. A dozen sessions is not a scaling problem.
- Middleware guards everything under `/admin` except the login route itself.
- Failed logins are rate-limited per IP, with a short lockout after five misses.
- `/admin` is `noindex, nofollow` and excluded from the sitemap.

Two or three accounts, added by hand to `users.json` with a small CLI script that hashes
a password. No signup flow, no password reset, no email. If someone forgets, you rerun
the script.

### Screens

**Dashboard.** Capacity at a glance and a sold-out toggle per location and per game.
One click, saves immediately, live on the site on the next request. This is the screen
that gets used weekly; everything else gets used monthly.

**Games.** List, create, edit, reorder, archive. Per game: label, tagline, description,
status, accent, key art upload, highlights, and a repeatable plan editor covering name,
WHMCS `pid`, RAM, slots, popular flag, and per-cycle pricing. Delete is a soft archive,
because deleting a game whose `pid` is live in someone's cart is not recoverable.

**Locations.** Miami and Ashburn. Label, `valueId`, the customer-facing note, sold-out.

**Staff and teams.** Name, title, photo upload, bio. Reorderable.

**Legal and changelog.** A plain Markdown textarea with a preview. These are prose; a
rich text editor would add a dependency and a class of formatting bugs for no gain.

**Announcements and spotlight.** The rotating banner items, and the featured community
block, both with an on/off switch. The old site had `spotlight.enabled` as a source
constant; it becomes a checkbox.

**Settings.** Navigation, contact emails, social links.

### Uploads

Images go to a media directory beside the content directory, also outside the deploy
path. Validate by magic bytes rather than extension, cap the size, generate a UUID
filename, and never trust the client-supplied name. Astro's image pipeline handles
optimization on the way out.

## 5. Deploy on cPanel

**cPanel → Git Version Control**, cloning this repo, with a `.cpanel.yml` that copies the
build output into the app directory on deploy. Push to `main`, pull in cPanel, restart
the Node app. Manual restart is a real step; Passenger needs `tmp/restart.txt` touched.

`npm run build` produces a server bundle rather than static HTML once the adapter is in.
Whether `npm ci && npm run build` runs on the server or in Actions depends on whether the
host gives you enough memory to build there. Building in Actions and deploying the output
is the safer default on shared hosting.

**`.github/workflows/deploy.yml` is dead.** It rsyncs over SSH to `/srv/www/` on a server
that is no longer where this site lives, and it will fail on every push to `main`. It
should be deleted or rewritten once the deploy path is settled.

## 6. What this removes from the old plan

Keystatic, the GitHub App, the separate admin deploy on Netlify, the `content` branch
question, the rebuild-per-edit tradeoff, and the WHMCS stock endpoint. None of it is
needed once the site can run code.

The one previously flagged trap that still applies in a new form: a deploy that clobbers
content. It was `rsync --delete` before, it is the cPanel deploy path now. Same failure,
same fix, which is keeping content outside whatever the deploy writes.

## 7. Sequence and effort

1. Confirm Node 22.12+ in cPanel — blocks everything, do it first
2. Add `@astrojs/node`, switch output to server, get a hello-world deploy running under
   Passenger and surviving a restart — half a day, and most of the risk lives here
3. Content directory, loaders, zod schemas, migrate content off `main` — half a day
4. Auth, session middleware, login page — half a day
5. Dashboard with sold-out toggles — half a day
6. Games editor including the plan repeater — a day, it is the biggest screen
7. Staff, teams, locations, legal, announcements, spotlight, settings — a day
8. Uploads and image handling — half a day

Roughly four to five days, and step 2 is the one that either goes smoothly or eats a day
on its own depending on how cooperative the host is.

## 8. Fallback if Node is unavailable

Astro builds static, deployed to cPanel by Git Version Control or FTP. `/admin` is a
small PHP app, since cPanel always has PHP, writing to the same YAML content directory.

The catch is that a static build cannot see those edits without rebuilding. So the split
comes back: volatile state (sold-out, capacity, announcements) is written by PHP to a
JSON file and fetched client-side at runtime, while structural content (games, staff,
legal) still needs a rebuild after editing, triggered by the PHP admin calling a GitHub
Actions `workflow_dispatch`.

It works. It is two languages, two content paths, and a rebuild delay on half the content.
Only take it if section 2 comes back negative.

## 9. Open decisions

1. **Node availability and version in cPanel.** Blocks the whole plan. Check first.
2. **Build on the server or in Actions?** Depends on memory limits on the plan.
3. **How many admin accounts, and do they need separate permissions?** A single shared
   login is fine for two people and a real liability for five.
4. ~~**Light mode.**~~ Settled: there isn't one. Dark only, no toggle, no
   `prefers-color-scheme` branch, legal pages included. See DESIGN.md section 5.
