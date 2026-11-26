# Lumix admin

`https://lumixsolutions.org/admin`: a login, then forms for the data the site
reads from `src/data/*.json`. Regions (with the sold-out switch), partners,
staff, the promo code and the Trustpilot score.

It is one PHP file, `public/admin/index.php`, plus `app.js` and `app.css`. It ships
inside the site through the normal deploy. Every save is a git commit made through
the GitHub API, so the existing Actions workflows build and ship it. No database,
no Node on the server.

Saves go to `dev`. "Save and go live" writes the same file to `main` too, which
deploys lumixsolutions.org in about two minutes. `dev` and `main` carry the same
tree with different hashes, so the admin writes the file to each branch separately
instead of merging.

## One-time setup (cPanel, about ten minutes)

1. **Token.** GitHub, Settings, Developer settings, Fine-grained tokens. This repo
   only. Permissions: Contents read and write, Actions read. It can push to `main`,
   and a push to `main` deploys, so it goes in one place only (step 3).
2. **Your login hash**, on your own machine:
   `node scripts/admin-hash.mjs evan`. It asks for a password (12 characters
   minimum) and prints a line like `'evan' => 'pbkdf2$600000$...',`.
3. **Config file.** In cPanel File Manager, make a folder named `lumix-admin` in your
   home folder, **next to** `public_html`, not inside it (anything inside is public).
   Upload `admin/config.example.php` there as `config.php`, paste the hash line into
   `users`, and the token into `github_token`.
4. Open `https://lumixsolutions.org/admin` and sign in. If something is off, the page
   says what: "not set up yet" means the config file isn't where it looks
   (`~/lumix-admin/config.php`), a red banner after login quotes what GitHub said.

More people: another `'name' => 'hash'` line each. Forgot a password: make a new hash.

## What it can't do

- Flip the WHMCS `hidden` flag on a Server Location. After a sold-out change the
  page names the region to flip by hand (ONBOARDING.md, "Open or close a region").
- Upload logos or photos. The Logo/Photo dropdowns list files already in
  `src/assets/partners` and `src/assets/staff`. A new image still goes in through git.
- Games and plans. Those stay in `src/content/games/*.yaml`.

## Keeping it honest

- The rules a save is checked against are in `index.php` (`datasets()`) and are a copy
  of `src/lib/schemas.mjs`, which the site build parses the JSON with. Change a rule in
  one, change the other. If they ever disagree, the build is the backstop: a save PHP
  lets through that zod rejects fails the deploy before anything uploads, and the live
  site stays up. `npm test` runs the real PHP against a fake GitHub (needs `php`
  installed, skipped if not) and checks every data file round-trips unchanged.
- `dev.lumixsolutions.org` gets the same files but the admin 404s there
  (`allowed_hosts` in the config).
- Passwords are PBKDF2-SHA256. Five wrong passwords for one username locks that
  username for five minutes (by username, not IP, because behind Cloudflare the IP
  can't be trusted). Sessions are HttpOnly, SameSite=Strict, 12 hours. Writes check
  the Origin header. It's `noindex` and `Disallow`ed in robots.txt.
- Needs the PHP `curl` extension to reach GitHub (cPanel has it on by default) and
  PHP 7.4 or newer.
