#!/usr/bin/env bash
# Makes a mobile number an admin of the site (ADMIN_PHONES in the API server's .env), restarts the
# API server, and shows how to sign in. Admins sign in like everyone else: mobile number + SMS code.
#   sudo bash make-admin.sh 09121234567
set -euo pipefail
ENV_FILE="${ENV_FILE:-/opt/backtestlab/server/.env}"
SERVICE="${SERVICE:-backtestlab}"

phone="$(printf '%s' "${1:-}" | tr -d ' -')"
if [[ "$phone" =~ ^\+?98(9[0-9]{9})$ ]]; then phone="0${BASH_REMATCH[1]}"; fi
if [[ ! "$phone" =~ ^09[0-9]{9}$ ]]; then
  echo "Usage: sudo bash make-admin.sh 09121234567   (an Iranian mobile number, English digits)"
  exit 1
fi
if [ ! -w "$ENV_FILE" ]; then
  echo "Cannot change $ENV_FILE: run with sudo (or set ENV_FILE=path/to/.env)."
  exit 1
fi

current="$(grep -E '^ADMIN_PHONES=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' || true)"
if [[ ",${current}," == *",${phone},"* ]]; then
  echo "$phone is already an admin number."
else
  updated="${current:+${current},}${phone}"
  if grep -qE '^ADMIN_PHONES=' "$ENV_FILE"; then
    sed -i "s/^ADMIN_PHONES=.*/ADMIN_PHONES=${updated}/" "$ENV_FILE"
  else
    printf '\nADMIN_PHONES=%s\n' "$updated" >> "$ENV_FILE"
  fi
  echo "Added $phone to ADMIN_PHONES (now: $updated)."
fi

systemctl restart "$SERVICE"
sleep 2
if ! systemctl is-active --quiet "$SERVICE"; then
  echo "The API server did not start. See: sudo journalctl -u $SERVICE -n 50"
  exit 1
fi

site="$(grep -E '^APP_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' || true)"
cat <<EOF

Done. To sign in as admin:
  1. Open ${site:-https://YOUR-DOMAIN}/#/login and enter ${phone}.
  2. Get the sign-in code:
     - if SMS sending is on (admin panel → پیامک → ارسال واقعی), it arrives by SMS;
     - until then it is written in the server log. Run this right after pressing the button:
         sudo journalctl -u ${SERVICE} -n 30 --no-pager | grep sms:dev
       The last line reads: [sms:dev] ${phone} ← CODE
  3. Enter the code (and your name, the first time). The menu then shows «پنل مدیریت».
EOF
