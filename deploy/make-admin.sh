#!/usr/bin/env bash
# Admin access to the site. Two ways, then the API server is restarted and the sign-in steps shown:
#
#   sudo bash make-admin.sh --username admin   an admin who signs in with a username and password
#                                               (asks for the password; .env keeps only its hash)
#   sudo bash make-admin.sh --new-url           a new secret address for the admin sign-in page
#                                               (the old one stops working)
#   sudo bash make-admin.sh 09121234567         a mobile number that becomes admin (sign-in by SMS code)
#
# The admin sign-in page has a secret address, SITE/#/k/KEY. KEY (ADMIN_LOGIN_KEY in .env) is random;
# without it the page and the admin sign-in API answer "not found". The site never links to it.
#
# ENV_FILE, SERVICE, SERVER_JS and NODE change the defaults below. ADMIN_PASSWORD=... skips the prompt.
set -euo pipefail
ENV_FILE="${ENV_FILE:-/opt/backtestlab/server/.env}"
SERVICE="${SERVICE:-backtestlab}"
SERVER_JS="${SERVER_JS:-/opt/backtestlab/server/server.mjs}"
NODE="${NODE:-node}"

usage() {
  echo "Usage: sudo bash make-admin.sh --username admin      (username and password)"
  echo "       sudo bash make-admin.sh --new-url             (new secret admin sign-in address)"
  echo "       sudo bash make-admin.sh 09121234567           (mobile number, English digits)"
  exit 1
}
if [ ! -w "$ENV_FILE" ]; then
  echo "Cannot change $ENV_FILE: run with sudo (or set ENV_FILE=path/to/.env)."
  exit 1
fi

setting() { grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' || true; }
set_setting() {
  if grep -qE "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    # start on a new line if the file does not end with one
    [ -z "$(tail -c 1 "$ENV_FILE")" ] || echo >> "$ENV_FILE"
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}
restart() {
  systemctl restart "$SERVICE"
  sleep 2
  if ! systemctl is-active --quiet "$SERVICE"; then
    echo "The API server did not start. See: sudo journalctl -u $SERVICE -n 50"
    exit 1
  fi
}
site="$(setting APP_URL)"
site="${site:-https://YOUR-DOMAIN}"

# 32 random URL-safe characters
new_key() { head -c 24 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n'; }
# the admin sign-in key: the one in .env, or a new one
login_key() {
  local key
  key="$(setting ADMIN_LOGIN_KEY)"
  if [[ ! "$key" =~ ^[A-Za-z0-9_-]{16,128}$ ]]; then
    key="$(new_key)"
    set_setting ADMIN_LOGIN_KEY "$key"
  fi
  printf '%s' "$key"
}

if [ "${1:-}" = "--new-url" ]; then
  key="$(new_key)"
  set_setting ADMIN_LOGIN_KEY "$key"
  restart
  cat <<EOF

Done. The admin sign-in page is now at:
  ${site}/#/k/${key}
The previous address no longer works. Save this one (a password manager or a private note) and do
not share it; the site has no link to it.
EOF
  exit 0
fi

if [ "${1:-}" = "--username" ]; then
  username="$(printf '%s' "${2:-}" | tr 'A-Z' 'a-z')"
  [[ "$username" =~ ^[a-z0-9_.-]{3,32}$ ]] || { echo "The username must be 3-32 of a-z, 0-9 and _ . -"; usage; }
  password="${ADMIN_PASSWORD:-}"
  if [ -z "$password" ]; then
    read -r -s -p "Password for $username (at least 8 characters): " password
    echo
    read -r -s -p "Repeat the password: " again
    echo
    [ "$password" = "$again" ] || { echo "The two passwords are not the same."; exit 1; }
  fi
  [ "${#password}" -ge 8 ] || { echo "The password must be at least 8 characters."; exit 1; }
  hash="$(printf '%s' "$password" | "$NODE" "$SERVER_JS" hash-password)"
  set_setting ADMIN_USERNAME "$username"
  set_setting ADMIN_PASSWORD_HASH "$hash"
  key="$(login_key)"
  restart
  cat <<EOF

Done. To sign in as admin:
  1. Open the secret admin sign-in page:
       ${site}/#/k/${key}
     The site has no link to it and without the key it shows nothing: save it and do not share it.
     (sudo bash make-admin.sh --new-url makes a new one.)
  2. Username: ${username}
     Password: the one you just typed
  3. You land in the admin panel («پنل مدیریت»).
Change the password later in the admin panel → تنظیمات سایت, or run this again.
EOF
  exit 0
fi

phone="$(printf '%s' "${1:-}" | tr -d ' -')"
if [[ "$phone" =~ ^\+?98(9[0-9]{9})$ ]]; then phone="0${BASH_REMATCH[1]}"; fi
[[ "$phone" =~ ^09[0-9]{9}$ ]] || usage

current="$(setting ADMIN_PHONES)"
if [[ ",${current}," == *",${phone},"* ]]; then
  echo "$phone is already an admin number."
else
  updated="${current:+${current},}${phone}"
  set_setting ADMIN_PHONES "$updated"
  echo "Added $phone to ADMIN_PHONES (now: $updated)."
fi
restart
cat <<EOF

Done. To sign in as admin:
  1. Open ${site}/#/login and enter ${phone}.
  2. Get the sign-in code:
     - if SMS sending is on (admin panel → پیامک → ارسال واقعی), it arrives by SMS;
     - until then it is written in the server log. Run this right after pressing the button:
         sudo journalctl -u ${SERVICE} -n 30 --no-pager | grep sms:dev
       The last line reads: [sms:dev] ${phone} ← CODE
  3. Enter the code (and your name, the first time). The menu then shows «پنل مدیریت».
EOF
