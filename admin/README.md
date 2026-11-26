# Lumix admin

`https://lumixsolutions.org/admin`: a login, then forms for everything on the site
that is data:

- **Regions** (the sold-out switch), **Partners**, **Staff**
- **Games**: add or delete a game, edit text, art, plans, WHMCS product ids, prices
- **Legal pages**: Terms, Privacy, CCPA (the date moves on its own when the text does)
- **FAQ**, **Site** (links, support email, application hosting price, demo panel),
  **Navigation** (header, More menu, footer, social)
- **Promo and Trust** (the discount code, the Trustpilot score)
- **Images**: upload logos, photos and game art from the file pickers

It is one PHP file, `public/admin/index.php`, plus `app.js` and `app.css`. It ships
inside the site through the normal deploy. Every save is a git commit made through
the GitHub API, so the existing Actions workflows build and ship it. No database,
no Node on the server.

Saves go to `dev`. "Save and go live" writes the same file to `main` too, which
deploys lumixsolutions.org in about two minutes. `dev` and `main` carry the same
tree with different hashes, so the admin writes the file to each branch separately
instead of merging.

## One-time setup (cPanel, about five minutes)

1. **GitHub token.** Settings, Developer settings, Fine-grained tokens. This repo only,
   Contents read and write, Actions read. (The admin commits as this token, so it can't
   work without one.)
2. **Config file.** Open `admin/config.example.php`, change the username and password,
   paste the token. In cPanel File Manager make a folder named `lumix-admin` in your home
   folder **next to** `public_html`, not inside it, and upload the file there as
   `config.php`.
3. Open `https://lumixsolutions.org/admin` and sign in with that username and password.

If something is off the page says what: "not set up yet" means the file isn't at
`~/lumix-admin/config.php`, and a red banner after login quotes what GitHub said.

More people: another `'name' => 'password'` line each. Changed your mind on a password:
edit the file. The password is plain text in that file, which is fine because it sits
above the web root next to the token. If you want a hash there instead,
`node scripts/admin-hash.mjs evan` prints one and either works.

## What it can't do

- Flip the WHMCS `hidden` flag on a Server Location. After a sold-out change the
  page names the region to flip by hand (ONBOARDING.md, "Open or close a region").
- Edit prose written straight into page templates (the homepage hero, "How it works",
  the tools pages). That text isn't data yet; moving a section into the JSON files is
  a small code change per section, then it shows up here.
- Change the design, add pages, or touch the FiveM cfg generator. Those are code.
- Images over 1 MB (GitHub's API limit for this). Shrink them first.

Every change is a git commit, so GitHub's history is the undo: open the file, History,
revert. Uploads wait on `dev` and are copied to `main` the first time a saved page
that uses them goes live.

## Keeping it honest

- The rules a save is checked against are in `datasets.php` and are a copy of
  `src/lib/schemas.mjs` and `src/content.config.ts`, which the site build parses with. Change a rule in
  one, change the other. If they ever disagree, the build is the backstop: a save PHP
  lets through that zod rejects fails the deploy before anything uploads, and the live
  site stays up. `npm test` runs the real PHP against a fake GitHub (needs `php`
  installed, skipped if not) and checks every data file round-trips unchanged.
- `dev.lumixsolutions.org` gets the same files but the admin 404s there
  (`allowed_hosts` in the config).
- Five wrong passwords for one username locks that
  username for five minutes (by username, not IP, because behind Cloudflare the IP
  can't be trusted). Sessions are HttpOnly, SameSite=Strict, 12 hours. Writes check
  the Origin header. It's `noindex` and `Disallow`ed in robots.txt.
- Needs the PHP `curl` extension to reach GitHub (cPanel has it on by default) and
  PHP 7.4 or newer.
