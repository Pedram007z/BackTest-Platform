#!/usr/bin/env bash
# Admin access to the site. Two ways, then the API server is restarted and the sign-in steps shown:
#
#   sudo bash make-admin.sh --username admin   an admin who signs in with a username and password
#                                               (asks for the password; .env keeps only its hash)
#   sudo bash make-admin.sh 09121234567         a mobile number that becomes admin (sign-in by SMS code)
#
# ENV_FILE, SERVICE, SERVER_JS and NODE change the defaults below. ADMIN_PASSWORD=... skips the prompt.
set -euo pipefail
ENV_FILE="${ENV_FILE:-/opt/backtestlab/server/.env}"
SERVICE="${SERVICE:-backtestlab}"
SERVER_JS="${SERVER_JS:-/opt/backtestlab/server/server.mjs}"
NODE="${NODE:-node}"

usage() {
  echo "Usage: sudo bash make-admin.sh --username admin      (username and password)"
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
  restart
  cat <<EOF

Done. To sign in as admin:
  1. Open the admin sign-in page: ${site}/#/admin/login
     (it is not linked from the site; bookmark it)
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
