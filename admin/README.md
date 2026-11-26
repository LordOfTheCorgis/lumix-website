# Lumix admin

Small login-protected editor for the data the site reads from `src/data/*.json`:
regions (including the sold-out switch), partners, staff, the promo code and
the Trustpilot score. Every save is a git commit made through the GitHub API,
so the deploy you already have builds and ships it. No database, no framework.

Saves go to `dev`. "Save and go live" writes the same file to `main` too, which
deploys lumixsolutions.org in about two minutes. `dev` and `main` carry the same
tree (different hashes), so the admin writes the file to each branch separately
instead of merging.

The admin refuses any save the site build would reject: it validates with
`src/lib/schemas.mjs`, the same zod the site parses the JSON with.

## What it can't do

- Flip the WHMCS `hidden` flag on a Server Location. After a sold-out change the
  page tells you which region to flip by hand (ONBOARDING.md, "Open or close a region").
- Upload logos or photos. The Logo/Photo dropdowns list files already in
  `src/assets/partners` and `src/assets/staff`. A new image still goes in through git.
- Games and plans. Those stay in `src/content/games/*.yaml`.

## Setup on a box (dev-srv-01 is the plan)

1. Node 22.22+, then `git clone` the repo to `/opt/lumix-website` and `npm ci`.
   Admin edits go to GitHub, so this checkout only supplies the code.
2. `cp admin/.env.example admin/.env`, fill in `GITHUB_TOKEN` (fine-grained PAT,
   this repo only, Contents read+write and Actions read).
3. `node admin/add-user.mjs evan` (asks for a password, 12 characters minimum,
   writes `admin/users.json`). Run it again to reset one. Add as many users as you like.
4. `sudo cp admin/lumix-admin.service /etc/systemd/system/ && sudo systemctl enable --now lumix-admin`
5. Put nginx in front with TLS (Cloudflare proxied DNS for the hostname is fine):

```nginx
server {
  server_name admin.lumixsolutions.org;
  # listen 443 ssl + certs as on the other vhosts
  location / {
    proxy_pass http://127.0.0.1:4322;
    proxy_set_header Host $host;                 # the origin check compares this to the Origin header
    proxy_set_header X-Real-IP $remote_addr;     # lockout is per IP
  }
}
```

Behind Cloudflare, use `real_ip_header CF-Connecting-IP` with Cloudflare's ranges
in `set_real_ip_from`, or every visitor shares one lockout bucket.

## Try it locally with no token

```bash
node admin/add-user.mjs me
ADMIN_FS_ROOT="$PWD" node admin/server.mjs   # edits the files in this checkout directly
```

Then open http://127.0.0.1:4322. In this mode a save just rewrites the JSON on
disk (no commits), so `git diff` shows exactly what the admin changed.

## Security notes

- scrypt hashes in `users.json` (gitignored, mode 600). Five bad logins from one
  IP locks that IP out for five minutes. Sessions live in memory, a restart logs everyone out.
- Cookie is HttpOnly + SameSite=Strict, writes check the Origin header.
- The GitHub token can push to `main`, and a push to `main` deploys. Keep it only
  in `admin/.env` on that box, scoped to this one repo.
