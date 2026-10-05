#!/usr/bin/env bash
# BackTest Platform installer for Ubuntu 22.04 / 24.04. Run it from the release folder (npm run release).
#
#   sudo bash install.sh                     install the site on this server, or update it
#   sudo bash install.sh --set-relay URL     use a relay for market data and the calendar (DEPLOY.md, step 8)
#   sudo bash install.sh --relay             set up the relay itself, on a server outside Iran
#
# Safe to run again. An existing installation keeps its settings (.env), accounts, payments and data.
# Every run is logged to /var/log/backtestlab-install.log.
#
# Answers can also come from the environment (for unattended runs):
#   BTL_DOMAIN, BTL_ADMIN_PHONES, BTL_EMAIL, BTL_RELAY_URL (main server)
#   BTL_RELAY_DOMAIN, BTL_MAIN_IP, BTL_EMAIL (relay)
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR=/opt/backtestlab
SERVER_DIR=$APP_DIR/server
WEB_DIR=/var/www/backtestlab
DATA_DIR=/var/lib/backtestlab
ENV_FILE=$SERVER_DIR/.env
SITE=/etc/nginx/sites-available/backtestlab
RELAY_SITE=/etc/nginx/sites-available/backtestlab-relay
SERVICE=backtestlab
PORT=8787
LOG=/var/log/backtestlab-install.log

# ---------- output ----------
step() { printf '\n== %s\n' "$*"; }
ok() { printf '   OK  %s\n' "$*"; }
note() { printf '   ..  %s\n' "$*"; }
warn() { printf '   !!  %s\n' "$*"; }
die() {
  printf '\nSTOPPED: %s\n' "$*" >&2
  printf 'Fix the problem above and run the installer again; it is safe to re-run. Full log: %s\n' "$LOG" >&2
  exit 1
}
# Report the first real failure. Failures inside $(...) and pipelines are left to the caller.
on_err() { [ "$BASH_SUBSHELL" -gt 0 ] && return 0; die "a command failed (line $1): $2"; }
trap 'on_err "$LINENO" "$BASH_COMMAND"' ERR

# ask VAR "question" [default] [regex]: answer from $VAR if set, otherwise from the terminal
ask() {
  local var=$1 question=$2 default=${3:-} re=${4:-} answer
  if [ -n "${!var:-}" ]; then
    answer=${!var}
    if [[ $answer == "-" ]]; then answer=""; fi
    if [ -z "$re" ] || [[ $answer =~ $re ]]; then
      printf -v "$var" '%s' "$answer"
      return 0
    fi
    die "$var=$answer is not valid."
  fi
  while true; do
    if ! read -r -p "   $question${default:+ [$default]}: " answer </dev/tty; then die "no answer (run the installer in a terminal)"; fi
    answer=${answer:-$default}
    if [[ $answer == "-" ]]; then answer=""; fi
    if [ -z "$re" ] || [[ $answer =~ $re ]]; then
      printf -v "$var" '%s' "$answer"
      return 0
    fi
    echo "   That does not look right; please try again."
  done
}

setting() { [ -r "$ENV_FILE" ] && grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' || true; }

set_setting() { # set_setting KEY VALUE: replace or append in .env
  if grep -qE "^$1=" "$ENV_FILE"; then sed -i "s#^$1=.*#$1=$2#" "$ENV_FILE"; else echo "$1=$2" >>"$ENV_FILE"; fi
}

# ---------- system checks ----------
need_root() { [ "$(id -u)" = 0 ] || die "run it with sudo: sudo bash install.sh"; }

check_os() {
  # shellcheck disable=SC1091
  . /etc/os-release
  if [ "${ID:-}" != ubuntu ]; then warn "this installer is made for Ubuntu; found ${PRETTY_NAME:-unknown}. Continuing."
  elif [[ ${VERSION_ID:-} != 22.04 && ${VERSION_ID:-} != 24.04 ]]; then warn "tested on Ubuntu 22.04 and 24.04; found $VERSION_ID. Continuing."
  else ok "$PRETTY_NAME"; fi
}

ipv6_ok() { [ -f /proc/net/if_inet6 ] && [ "$(cat /proc/sys/net/ipv6/conf/all/disable_ipv6 2>/dev/null || echo 0)" = 0 ]; }

drop_ipv6_listen() { # nginx cannot listen on [::] without IPv6
  local f
  for f in "$@"; do [ -f "$f" ] && sed -i '/listen \[::\]:/d' "$f"; done
  return 0
}

apt_sources() { ls /etc/apt/sources.list.d/*.sources /etc/apt/sources.list 2>/dev/null || true; }

use_mirror() { # point the Ubuntu archive and security sources at another mirror
  local mirror=$1 f
  for f in $(apt_sources); do
    grep -qE 'archive\.ubuntu\.com|security\.ubuntu\.com|ir\.archive\.ubuntu\.com' "$f" || continue
    [ -f "$f.backtestlab-backup" ] || cp "$f" "$f.backtestlab-backup"
    sed -i -E "s#https?://([a-z]{2}\.)?(archive|security)\.ubuntu\.com/ubuntu/?#${mirror%/}/#g" "$f"
  done
}

apt_update() {
  step "Package lists"
  if timeout 180 apt-get update -qq; then ok "Ubuntu package lists updated"; return; fi
  warn "apt-get update failed; trying the Ubuntu mirror in Iran (ir.archive.ubuntu.com)"
  use_mirror "http://ir.archive.ubuntu.com/ubuntu"
  if timeout 180 apt-get update -qq; then ok "using ir.archive.ubuntu.com (old sources saved as *.backtestlab-backup)"; return; fi
  local mirror=""
  echo "   Your VPS provider's Ubuntu mirror is usually listed in its panel or help pages."
  ask mirror "Ubuntu mirror address, e.g. http://mirror.example.ir/ubuntu" "" '^https?://[^ ]+$'
  use_mirror "$mirror"
  timeout 180 apt-get update -qq || die "apt-get update still fails with $mirror. Check the server's internet connection and the mirror address."
  ok "using $mirror"
}

apt_install() {
  export DEBIAN_FRONTEND=noninteractive
  if ! apt-get install -y -qq "$@" >/dev/null; then
    # On servers without IPv6 the nginx package cannot start with its default site; fix it and finish.
    warn "package setup did not finish; checking nginx's default site for IPv6"
    drop_ipv6_listen /etc/nginx/sites-available/default
    dpkg --configure -a
    apt-get install -y -qq "$@" >/dev/null || die "could not install: $*"
  fi
  ok "installed: $*"
}

# ---------- Node.js ----------
NODE_BIN=""
node_usable() { # Node 20.12+ outside home folders (the service cannot read /root or /home)
  local bin
  bin=$(command -v node 2>/dev/null || true)
  [ -n "$bin" ] || return 1
  bin=$(readlink -f "$bin")
  [[ $bin == /root/* || $bin == /home/* ]] && return 1
  "$bin" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=12)?0:1)' || return 1
  NODE_BIN=$bin
}

install_node() {
  step "Node.js"
  if node_usable; then ok "Node $("$NODE_BIN" -v) at $NODE_BIN"; return; fi
  local arch tarball=""
  case "$(uname -m)" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; *) die "unsupported processor: $(uname -m)" ;; esac
  local user_home=""
  [ -n "${SUDO_USER:-}" ] && user_home=$(getent passwd "$SUDO_USER" | cut -d: -f6 || true)
  tarball=$(ls -t "$HERE"/node-v*-linux-$arch.tar.xz /tmp/node-v*-linux-$arch.tar.xz /root/node-v*-linux-$arch.tar.xz ${user_home:+"$user_home"/node-v*-linux-$arch.tar.xz} 2>/dev/null | head -n 1 || true)
  if [ -n "$tarball" ]; then
    note "installing from $tarball"
    tar -xJf "$tarball" -C /usr/local --strip-components=1 --exclude='*/CHANGELOG.md' --exclude='*/README.md' --exclude='*/LICENSE'
    ln -sf /usr/local/bin/node /usr/bin/node
  else
    note "no Node file uploaded; trying NodeSource"
    if ! { curl -fsSL --max-time 60 https://deb.nodesource.com/setup_22.x | bash - >/dev/null && apt-get install -y -qq nodejs >/dev/null; }; then
      die "could not install Node.js. On your computer download the Linux $arch .tar.xz of Node 22 from https://nodejs.org/en/download, upload it next to install.sh (or to /tmp), and run the installer again."
    fi
  fi
  hash -r
  node_usable || die "Node.js 20.12 or newer is needed; found $(node -v 2>/dev/null || echo none)"
  ok "Node $("$NODE_BIN" -v) at $NODE_BIN"
}

# ---------- DNS and HTTPS ----------
local_ips() { hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' || true; }
resolves_here() { # resolves_here NAME: the name points to one of this server's addresses
  local ip
  for ip in $(getent ahostsv4 "$1" 2>/dev/null | awk '{print $1}' | sort -u || true); do
    local_ips | grep -qxF "$ip" && return 0
  done
  return 1
}

HTTPS_DONE=0
get_certificate() { # get_certificate EMAIL NAME [NAME...]
  local email=$1
  shift
  if [ -d "/etc/letsencrypt/live/$1" ]; then
    ok "HTTPS certificate for $1 already exists (renewed automatically)"
    HTTPS_DONE=1
    return
  fi
  if ! resolves_here "$1"; then
    warn "$1 does not point to this server yet ($(getent ahostsv4 "$1" | awk '{print $1}' | sort -u | tr '\n' ' ' || true)); this server: $(local_ips | tr '\n' ' ')"
    warn "add an A record for $1 with this server's IP in your DNS panel, wait a few minutes, then run the installer again for HTTPS"
    return
  fi
  local names=() n
  for n in "$@"; do names+=(-d "$n"); done
  local who=(--register-unsafely-without-email)
  [ -n "$email" ] && who=(-m "$email")
  if certbot --nginx --non-interactive --agree-tos --redirect "${who[@]}" "${names[@]}"; then
    ok "HTTPS for $*"
    HTTPS_DONE=1
  else
    warn "certbot could not get a certificate. Port 80 must be open to the internet, and international access must work."
    warn "run the installer again later; nothing else needs redoing"
  fi
}

# ---------- relay settings on the main server ----------
apply_relay() {
  local url=${1%/}
  [[ $url =~ ^https?://[^/[:space:]]+$ ]] || die "relay address must look like https://relay.your-domain.ir"
  [[ $url == http://* ]] && warn "the relay address uses http, not https"
  set_setting DUKASCOPY_URL "$url/dukascopy"
  set_setting BINANCE_URL "$url/binance"
  set_setting FF_BASE_URL "$url/forexfactory"
  set_setting FF_FEED_URL "$url/ff_calendar_thisweek.json"
  ok "relay set to $url"
}

check_sources() {
  step "Market data and calendar sources"
  if bash "$APP_DIR/check-sources.sh" "$ENV_FILE"; then return 0; fi
  return 1
}

restart_api() {
  systemctl restart "$SERVICE"
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then ok "API server running"; return; fi
    sleep 1
  done
  journalctl -u "$SERVICE" -n 30 --no-pager || true
  die "the API server did not start; its log is above"
}

# =====================================================================
main_install() {
  need_root
  [ -f "$HERE/server/server.mjs" ] && [ -d "$HERE/web" ] || die "run install.sh from the release folder (it needs web/ and server/server.mjs next to it)"
  exec > >(tee -a "$LOG") 2>&1
  echo "--- $(date -Is) install.sh"

  step "This server"
  check_os
  local update=0 domain admin_phones="" email="" built_for
  built_for=$(sed -n 's/^built .* for \(.*\)$/\1/p' "$HERE/VERSION.txt" 2>/dev/null || true)

  if [ -f "$ENV_FILE" ]; then
    update=1
    domain=$(setting APP_URL | sed -E 's#^https?://##; s#/$##')
    ok "existing installation for $domain: updating it (settings and data are kept)"
  else
    step "Questions"
    local suggested=""
    [ -n "$built_for" ] && suggested=$(echo "$built_for" | sed -E 's#^https?://##; s#^www\.##')
    BTL_DOMAIN=$(echo "${BTL_DOMAIN:-}" | tr 'A-Z' 'a-z' | sed -E 's#^https?://##; s#/$##; s#^www\.##')
    ask BTL_DOMAIN "Site domain, without www" "$suggested" '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
    domain=$BTL_DOMAIN
    ask BTL_ADMIN_PHONES "Admin mobile number(s), comma separated (09xxxxxxxxx)" "" '^09[0-9]{9}(,09[0-9]{9})*$'
    admin_phones=$BTL_ADMIN_PHONES
    ask BTL_EMAIL "Email for the HTTPS certificate (Let's Encrypt notices; '-' for none)" "" '^([^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+)?$'
    email=${BTL_EMAIL:-}
  fi

  if [ -n "$built_for" ] && [ "${built_for%/}" != "https://$domain" ] && [ "${built_for%/}" != "https://www.$domain" ]; then
    die "this release was built for $built_for, but the site is $domain. On your computer run: npm run release -- https://$domain"
  fi
  ok "release: $(cat "$HERE/VERSION.txt" 2>/dev/null || echo 'unknown build')"

  apt_update
  step "Packages"
  apt_install nginx certbot python3-certbot-nginx curl xz-utils ca-certificates
  install_node

  step "Files"
  id "$SERVICE" >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin "$SERVICE"
  mkdir -p "$SERVER_DIR" "$WEB_DIR" "$DATA_DIR"
  chown "$SERVICE:$SERVICE" "$DATA_DIR"
  rm -rf "$WEB_DIR.new" "$WEB_DIR.old"
  cp -r "$HERE/web" "$WEB_DIR.new"
  chmod -R a+rX "$WEB_DIR.new"
  mv "$WEB_DIR" "$WEB_DIR.old" && mv "$WEB_DIR.new" "$WEB_DIR" && rm -rf "$WEB_DIR.old"
  install -m 644 "$HERE/server/server.mjs" "$SERVER_DIR/server.mjs"
  install -m 755 "$HERE/check-sources.sh" "$APP_DIR/check-sources.sh"
  install -m 755 "$HERE/install.sh" "$APP_DIR/install.sh"
  cp "$HERE/VERSION.txt" "$APP_DIR/VERSION.txt" 2>/dev/null || true
  ok "site in $WEB_DIR, API server in $SERVER_DIR, data in $DATA_DIR"

  if [ "$update" = 0 ]; then
    umask 027
    cat >"$ENV_FILE" <<EOF
# BackTest Platform API server settings (written by install.sh on $(date -I)).
# Everything else is set in the admin panel. After changing this file: sudo systemctl restart backtestlab
NODE_ENV=production
HOST=127.0.0.1
PORT=$PORT
APP_URL=https://$domain
PUBLIC_URL=https://$domain
CORS_ORIGINS=https://$domain,https://www.$domain
ADMIN_PHONES=$admin_phones
DATA_DIR=$DATA_DIR
TRUST_PROXY=true
EOF
    umask 022
    ok "settings written to $ENV_FILE"
  fi
  chown "root:$SERVICE" "$ENV_FILE"
  chmod 640 "$ENV_FILE"

  step "API server"
  sed "s#^ExecStart=.*#ExecStart=$NODE_BIN $SERVER_DIR/server.mjs#" "$HERE/backtestlab.service" >/etc/systemd/system/$SERVICE.service
  systemctl daemon-reload
  systemctl enable "$SERVICE" >/dev/null 2>&1
  restart_api

  step "nginx"
  if [ -f "$SITE" ]; then
    ok "keeping the existing site configuration ($SITE)"
  else
    sed "s/backtestlab\.ir/$domain/g" "$HERE/nginx-site.conf" >"$SITE"
    ok "site configuration written"
  fi
  if ! ipv6_ok; then
    drop_ipv6_listen "$SITE" /etc/nginx/sites-available/default
    note "this server has no IPv6; listening on IPv4 only"
  fi
  ln -sf "$SITE" /etc/nginx/sites-enabled/backtestlab
  rm -f /etc/nginx/sites-enabled/default
  nginx -t >/dev/null 2>&1 || { nginx -t || true; die "nginx rejected the configuration (details above)"; }
  if systemctl is-active --quiet nginx; then systemctl reload nginx; else systemctl restart nginx; fi
  local page api
  page=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $domain" http://127.0.0.1/ || true)
  if [ "$page" = 301 ] || [ "$page" = 308 ]; then
    # HTTPS is already set up and redirects; check through it
    page=$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$domain:443:127.0.0.1" "https://$domain/" || true)
    api=$(curl -sk --resolve "$domain:443:127.0.0.1" "https://$domain/api/health" || true)
  else
    api=$(curl -s -H "Host: $domain" http://127.0.0.1/api/health || true)
  fi
  [ "$page" = 200 ] || die "nginx does not serve the site (HTTP $page); see /var/log/nginx/error.log"
  [[ $api == *'"ok":true'* ]] || die "nginx does not reach the API server; see /var/log/nginx/error.log"
  ok "nginx serves the site and the API"

  step "HTTPS"
  local names=("$domain")
  resolves_here "www.$domain" && names+=("www.$domain")
  get_certificate "$email" "${names[@]}"

  local relay_needed=0
  if ! check_sources; then
    relay_needed=1
    if [ "$update" = 0 ] && [ -z "$(setting DUKASCOPY_URL)" ]; then
      echo "   A relay outside Iran fixes this (DEPLOY.md, step 8: sudo bash install.sh --relay on that server)."
      local relay=""
      if [ -n "${BTL_RELAY_URL:-}" ]; then relay=${BTL_RELAY_URL#-}; else ask relay "Relay address if you already have one, e.g. https://relay.$domain (Enter to skip)" "" '^(https?://[^/[:space:]]+/?)?$'; fi
      if [ -n "$relay" ]; then
        apply_relay "$relay"
        restart_api
        check_sources && relay_needed=0
      fi
    fi
  fi

  step "Done"
  local scheme=https
  [ "$HTTPS_DONE" = 1 ] || scheme=http
  echo "   Site:           $scheme://$domain"
  echo "   Admin numbers:  $(setting ADMIN_PHONES)"
  echo "   First sign-in:  click ورود, enter an admin number, then read the code with"
  echo "                   sudo journalctl -u $SERVICE -n 20 | grep sms:dev"
  echo "   Next:           admin panel (پنل مدیریت): SMS provider, payment gateways, plans"
  if [ "$HTTPS_DONE" != 1 ]; then
    echo
    warn "HTTPS is not set up yet, and the app needs it to sign in. Fix the DNS record above, then run: sudo bash $APP_DIR/install.sh --https"
  fi
  if [ "$relay_needed" = 1 ]; then
    echo
    warn "market data and the calendar need a relay. On a server outside Iran: sudo bash install.sh --relay"
    warn "then here: sudo bash $APP_DIR/install.sh --set-relay https://relay.$domain"
  fi
  echo
  echo "   Updating later: build a new release, upload it, and run sudo bash install.sh in it again."
}

# =====================================================================
https_only() { # retry HTTPS for an existing installation
  need_root
  exec > >(tee -a "$LOG") 2>&1
  [ -f "$ENV_FILE" ] || die "no installation found; run the installer from the release folder first"
  local domain
  domain=$(setting APP_URL | sed -E 's#^https?://##; s#/$##')
  step "HTTPS for $domain"
  local names=("$domain")
  resolves_here "www.$domain" && names+=("www.$domain")
  get_certificate "${BTL_EMAIL:-}" "${names[@]}"
  [ "$HTTPS_DONE" = 1 ] || exit 1
}

# =====================================================================
set_relay() {
  need_root
  exec > >(tee -a "$LOG") 2>&1
  [ -f "$ENV_FILE" ] || die "no installation found; run the installer from the release folder first"
  step "Relay"
  apply_relay "${1:-}"
  restart_api
  if check_sources; then
    step "Done"
    echo "   Market data and the calendar now come through the relay. In the admin panel, press sync on the calendar page."
  else
    warn "the relay does not answer for everything. If a line says HTTP 403, the relay does not accept this server's IP:"
    warn "on the relay run sudo bash install.sh --relay again with this server's public IP"
    exit 1
  fi
}

# =====================================================================
relay_install() {
  need_root
  [ -f "$HERE/relay-nginx.conf" ] || die "run install.sh from the release folder (it needs relay-nginx.conf next to it)"
  exec > >(tee -a "$LOG") 2>&1
  echo "--- $(date -Is) install.sh --relay"
  step "This server (relay)"
  check_os

  step "Questions"
  BTL_RELAY_DOMAIN=$(echo "${BTL_RELAY_DOMAIN:-}" | tr 'A-Z' 'a-z' | sed -E 's#^https?://##; s#/$##')
  ask BTL_RELAY_DOMAIN "Relay domain, e.g. relay.your-domain.ir" "" '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  ask BTL_MAIN_IP "Public IP of your main (Iranian) server" "" '^([0-9]{1,3}\.){3}[0-9]{1,3}$'
  ask BTL_EMAIL "Email for the HTTPS certificate ('-' for none)" "" '^([^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+)?$'

  apt_update
  step "Packages"
  apt_install nginx certbot python3-certbot-nginx curl ca-certificates

  step "nginx"
  if [ -f "$RELAY_SITE" ]; then
    # keep certbot's HTTPS part; only update the allowed IP
    sed -i -E "s/allow ([0-9]{1,3}\.){3}[0-9]{1,3};/allow $BTL_MAIN_IP;/" "$RELAY_SITE"
    ok "relay configuration updated (allowed IP: $BTL_MAIN_IP)"
  else
    sed -e "s/relay\.example\.com/$BTL_RELAY_DOMAIN/g" -e "s/203\.0\.113\.10/$BTL_MAIN_IP/" "$HERE/relay-nginx.conf" >"$RELAY_SITE"
    ok "relay configuration written"
  fi
  ipv6_ok || drop_ipv6_listen "$RELAY_SITE" /etc/nginx/sites-available/default
  ln -sf "$RELAY_SITE" /etc/nginx/sites-enabled/backtestlab-relay
  rm -f /etc/nginx/sites-enabled/default
  nginx -t >/dev/null 2>&1 || { nginx -t || true; die "nginx rejected the configuration (details above)"; }
  if systemctl is-active --quiet nginx; then systemctl reload nginx; else systemctl restart nginx; fi
  ok "nginx relay active; only $BTL_MAIN_IP may use it"

  step "HTTPS"
  get_certificate "${BTL_EMAIL:-}" "$BTL_RELAY_DOMAIN"

  step "Sources, as seen from this relay"
  local reach=1
  CHECK_SOURCES_HINT=0 bash "$HERE/check-sources.sh" /nonexistent || reach=0

  step "Done"
  local scheme=https
  [ "$HTTPS_DONE" = 1 ] || scheme=http
  echo "   On your main server run:"
  echo "   sudo bash $APP_DIR/install.sh --set-relay $scheme://$BTL_RELAY_DOMAIN"
  [ "$reach" = 1 ] || warn "this server cannot reach every source either; choose a VPS in another country"
  [ "$HTTPS_DONE" = 1 ] || warn "HTTPS is not set up yet: point $BTL_RELAY_DOMAIN to this server and run sudo bash install.sh --relay again"
}

case "${1:-}" in
  "") main_install ;;
  --relay) relay_install ;;
  --set-relay) set_relay "${2:-}" ;;
  --https) https_only ;;
  -h | --help) sed -n '2,15p' "$0" ;;
  *) die "unknown option $1 (use --help)" ;;
esac
