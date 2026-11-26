#!/usr/bin/env bash
# one-shot setup of the site admin on dev-srv-01 (Debian 13). run it ONCE as
# root with a real terminal, because it asks you for stuff (github token, cert,
# a login password):
#
#   scp admin/setup-dev-srv.sh dev-srv-01:/tmp/
#   ssh -t dev-srv-01 'sudo bash /tmp/setup-dev-srv.sh'
#
# safe to rerun, it skips what's already there. it does NOT touch DNS or
# Cloudflare, and it prints what's left at the end.
set -euo pipefail

HOST=admin.lumixsolutions.org
REPO=LordOfTheCorgis/lumix-website
DIR=/opt/lumix-website
SVC_USER=lumix-admin
CERT_DIR=/etc/ssl/cloudflare-origin

say() { printf '\n== %s\n' "$*"; }
die() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run it with sudo: sudo bash $0"
[ -t 0 ] || die "needs a terminal (use ssh -t), it asks questions"
command -v nginx >/dev/null || die "nginx isn't installed on this box"

say "packages"
for p in git curl; do command -v "$p" >/dev/null || { apt-get update -qq && apt-get install -y -qq "$p"; }; done

# ---- node. the admin needs 22.22+ (it imports astro's zod). debian 13 ships
# older, so if the box doesn't already have a new enough one, use the official
# tarball and check its sha256 against nodejs.org's own list
say "node"
node_ok() { "$1" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=22)?0:1)' 2>/dev/null; }
NODE=$(command -v node || true)
if [ -n "$NODE" ] && node_ok "$NODE"; then
  echo "using $NODE ($("$NODE" -v))"
else
  case "$(uname -m)" in x86_64) A=x64;; aarch64) A=arm64;; *) die "unknown cpu $(uname -m)";; esac
  base=https://nodejs.org/dist/latest-v22.x
  tmp=$(mktemp -d)
  curl -fsS "$base/SHASUMS256.txt" -o "$tmp/sums"
  f=$(grep -o "node-v[0-9.]*-linux-$A\.tar\.gz" "$tmp/sums" | head -1)
  [ -n "$f" ] || die "couldn't find a linux-$A tarball in SHASUMS256.txt"
  curl -fsS "$base/$f" -o "$tmp/$f"
  (cd "$tmp" && grep " $f\$" sums | sha256sum -c -) || die "node tarball checksum didn't match"
  rm -rf /opt/node22 && mkdir -p /opt/node22 && tar -xzf "$tmp/$f" -C /opt/node22 --strip-components=1
  rm -rf "$tmp"
  NODE=/opt/node22/bin/node
  node_ok "$NODE" || die "installed node is still too old?"
  echo "installed $("$NODE" -v) at /opt/node22"
fi
NPM="$(dirname "$NODE")/npm"

say "service user and checkout"
id "$SVC_USER" >/dev/null 2>&1 || useradd --system --home-dir "$DIR" --shell /usr/sbin/nologin "$SVC_USER"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only -q
else
  git clone -q "https://github.com/$REPO.git" "$DIR"
fi
git -C "$DIR" config --global --add safe.directory "$DIR" 2>/dev/null || true
# the admin only needs astro for its zod, no build tools or sharp
(cd "$DIR" && PATH="$(dirname "$NODE"):$PATH" "$NPM" ci --omit=dev --ignore-scripts --no-audit --no-fund --loglevel=error)
[ -f "$DIR/src/data/locations.json" ] || die "$DIR has no src/data/locations.json, is the data refactor on the main branch?"

say "github token"
ENVF=$DIR/admin/.env
if [ -s "$ENVF" ] && grep -q '^GITHUB_TOKEN=.\+' "$ENVF"; then
  echo "admin/.env already has a token, keeping it"
else
  echo "Paste the fine-grained token (this repo only; Contents read+write, Actions read)."
  read -rsp "token: " TOKEN; echo
  [ -n "$TOKEN" ] || die "empty token"
  sed -e "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$TOKEN|" "$DIR/admin/.env.example" > "$ENVF"
  unset TOKEN
fi
chown "$SVC_USER" "$ENVF"; chmod 600 "$ENVF"

# prove the token can do the three things the admin does before starting anything
set -a; . "$ENVF"; set +a
api() { curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $GITHUB_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" "https://api.github.com/repos/$GITHUB_REPO/$1"; }
for check in "contents/src/data/locations.json?ref=$EDIT_BRANCH" "contents/src/data/locations.json?ref=$LIVE_BRANCH" "actions/runs?per_page=1"; do
  code=$(api "$check")
  [ "$code" = 200 ] || die "github said $code for $check. wrong token, wrong scope, or the file isn't on that branch yet"
  echo "ok  $check"
done
# can't test a write without making a commit, so the first real save is the write test
unset GITHUB_TOKEN

say "admin login"
touch "$DIR/admin/users.json"; chown "$SVC_USER" "$DIR/admin/users.json"; chmod 600 "$DIR/admin/users.json"
while true; do
  read -rp "username to add (blank to finish): " U
  [ -n "$U" ] || break
  (cd "$DIR" && sudo -u "$SVC_USER" "$NODE" admin/add-user.mjs "$U") || echo "that one didn't save, try again"
done
[ "$(wc -c < "$DIR/admin/users.json")" -gt 3 ] || die "no users yet. rerun and add at least one"

say "systemd"
sed "s|/usr/bin/node|$NODE|" "$DIR/admin/lumix-admin.service" > /etc/systemd/system/lumix-admin.service
systemctl daemon-reload
systemctl enable --now lumix-admin
systemctl restart lumix-admin
sleep 1
curl -fsS -o /dev/null http://127.0.0.1:4322/login || { journalctl -u lumix-admin -n 20 --no-pager; die "admin didn't come up on :4322"; }
echo "admin is answering on 127.0.0.1:4322"

say "tls cert"
CRT=$CERT_DIR/$HOST.crt; KEY=$CERT_DIR/$HOST.key
if [ ! -s "$CRT" ] || [ ! -s "$KEY" ]; then
  echo "No origin cert for $HOST yet. In Cloudflare: SSL/TLS > Origin Server > Create Certificate,"
  echo "hostname $HOST. Paste the certificate, then a line with just END. Then the private key, then END."
  mkdir -p "$CERT_DIR"
  read_block() { local out=$1 line; : > "$out"; while IFS= read -r line; do [ "$line" = END ] && break; printf '%s\n' "$line" >> "$out"; done; }
  echo "--- certificate:"; read_block "$CRT"
  echo "--- private key:"; read_block "$KEY"
  chmod 644 "$CRT"; chmod 600 "$KEY"
  openssl x509 -in "$CRT" -noout -subject -enddate || die "that wasn't a valid certificate"
  openssl pkey -in "$KEY" -noout || die "that wasn't a valid private key"
fi

say "nginx"
# real client ip behind cloudflare, or the lockout sees one visitor. kept inside
# this server block so it can't clash with directives elsewhere on this box
REAL=$(mktemp)
for v in 4 6; do
  curl -fsS "https://www.cloudflare.com/ips-v$v" | sed 's|.*|    set_real_ip_from &;|' >> "$REAL" || die "couldn't fetch cloudflare's ip list"
done
echo "    real_ip_header CF-Connecting-IP;" >> "$REAL"
VH=/etc/nginx/sites-available/$HOST
[ -f "$VH" ] && cp "$VH" "$VH.bak-$(date +%s)"
cat > "$VH" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name __HOST__;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name __HOST__;

    ssl_certificate     __CRT__;
    ssl_certificate_key __KEY__;

__REALIP__

    client_max_body_size 2m;
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://127.0.0.1:4322;
        proxy_set_header Host $host;                # the admin compares this to the Origin header
        proxy_set_header X-Real-IP $remote_addr;    # already the real visitor ip after real_ip above
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sed -i -e "s|__HOST__|$HOST|g" -e "s|__CRT__|$CRT|" -e "s|__KEY__|$KEY|" -e "/__REALIP__/{r $REAL" -e "d}" "$VH"
rm -f "$REAL"
ln -sf "$VH" /etc/nginx/sites-enabled/$HOST
if ! nginx -t; then
  rm -f /etc/nginx/sites-enabled/$HOST
  die "nginx -t failed, the new site is disabled again and nginx was not reloaded"
fi
systemctl reload nginx
curl -fsSk -o /dev/null --resolve "$HOST:443:127.0.0.1" "https://$HOST/login" && echo "https://$HOST/login answers locally"

cat <<DONE

== done on the box. what's left is outside it:
  1. Cloudflare DNS: A record  admin  ->  216.173.77.89  (proxied, orange cloud).
  2. Cloudflare SSL/TLS mode must be Full (strict) (the status hosts already need that).
  3. Open https://$HOST, sign in, flip a region on the Regions tab, Save to dev.
     That first save is the real write test; check the dev branch for the commit.
  4. When src/lib/schemas.mjs changes, update this box too:
       sudo git -C $DIR pull --ff-only && sudo systemctl restart lumix-admin
DONE
