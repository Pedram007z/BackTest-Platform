#!/usr/bin/env bash
# Sets up the nightly backup to ArvanCloud Object Storage (or any S3 service) in one go:
# installs rclone, installs backup-s3.sh, asks for the bucket and keys, tests them, adds the nightly
# run to cron and starts the first backup.
#
#   curl -fsSLo /tmp/setup-backup.sh https://raw.githubusercontent.com/Pedram007z/BackTest-Platform/main/deploy/setup-backup.sh
#   sudo bash /tmp/setup-backup.sh
#
# Running it again is safe: it keeps the saved settings unless you choose to change them.
# REF (branch of the repository to take backup-s3.sh from, default main), DIR and HOUR change the defaults.
set -euo pipefail
REF="${REF:-main}"
DIR="${DIR:-/opt/backtestlab}"
HOUR="${HOUR:-3}"
SCRIPT_URL="https://raw.githubusercontent.com/Pedram007z/BackTest-Platform/$REF/deploy/backup-s3.sh"
BACKUP_ENV="$DIR/backup.env"
LOG=/var/log/backtestlab-backup.log
UNIT=backtestlab-backup-first

if [ "$(id -u)" != 0 ]; then
  echo "Run with sudo: sudo bash $0"
  exit 1
fi
[ -t 0 ] || exec < /dev/tty
mkdir -p "$DIR"

echo "== 1/5 rclone"
if command -v rclone > /dev/null; then
  echo "installed: $(rclone version | head -n 1)"
else
  if ! { apt-get install -y rclone || { apt-get update && apt-get install -y rclone; }; }; then
    echo "Could not install rclone with apt. Download the .deb on your computer from https://rclone.org/downloads/,"
    echo "upload it (scp rclone-*-linux-amd64.deb root@SERVER_IP:/tmp/), then: sudo dpkg -i /tmp/rclone-*-linux-amd64.deb"
    echo "and run this script again."
    exit 1
  fi
fi

echo "== 2/5 backup-s3.sh"
here=$(cd "$(dirname "$0")" && pwd)
if [ -f "$here/backup-s3.sh" ] && [ "$here" != "$DIR" ]; then
  cp "$here/backup-s3.sh" "$DIR/backup-s3.sh"
  echo "copied from $here"
elif [ "$here" != "$DIR" ] || [ ! -f "$DIR/backup-s3.sh" ]; then
  tmp=$(mktemp)
  curl -fsSL --retry 3 -o "$tmp" "$SCRIPT_URL" || { rm -f "$tmp"; echo "Could not download $SCRIPT_URL"; exit 1; }
  mv "$tmp" "$DIR/backup-s3.sh"
  echo "downloaded from GitHub ($REF)"
fi
chmod 755 "$DIR/backup-s3.sh"

echo "== 3/5 bucket and keys"
ask() { # ask VAR "question" DEFAULT
  local answer
  read -r -p "$2${3:+ [$3]}: " answer
  printf -v "$1" '%s' "${answer:-$3}"
}
current() {
  if [ -r "$BACKUP_ENV" ]; then grep -E "^$1=" "$BACKUP_ENV" | tail -n 1 | cut -d= -f2- || true; fi
}
change=y
if [ -s "$BACKUP_ENV" ]; then
  echo "Saved settings: $(current S3_BUCKET) at $(current S3_ENDPOINT)"
  ask change "Change them? (y/n)" n
fi
if [ "$change" = y ] || [ "$change" = Y ]; then
  echo "From the ArvanCloud panel → Object Storage: create a private bucket in your server's region, then"
  echo "an access key. The endpoint is shown in the panel (Tehran: s3.ir-thr-at1.arvanstorage.ir,"
  echo "Tabriz: s3.ir-tbz-sh1.arvanstorage.ir)."
  saved=$(current S3_ENDPOINT)
  ask endpoint "Endpoint" "${saved:-https://s3.ir-thr-at1.arvanstorage.ir}"
  case "$endpoint" in http://* | https://*) ;; *) endpoint="https://$endpoint" ;; esac
  saved=$(current S3_BUCKET)
  ask bucket "Bucket name" "${saved:-backtestlab-backup}"
  ask access "Access key" "$(current S3_ACCESS_KEY)"
  read -r -s -p "Secret key (not shown while typing): " secret
  echo
  [ -n "$secret" ] || secret=$(current S3_SECRET_KEY)
  if [ -z "$endpoint" ] || [ -z "$bucket" ] || [ -z "$access" ] || [ -z "$secret" ]; then
    echo "All four are needed."
    exit 1
  fi
  market=n
  ask market "Also back up the market history? It can be imported from GitHub again (y/n)" n
  old=$(mktemp)
  if [ -r "$BACKUP_ENV" ]; then
    grep -vE '^(S3_ENDPOINT|S3_BUCKET|S3_ACCESS_KEY|S3_SECRET_KEY|MARKET)=' "$BACKUP_ENV" > "$old" || true
  fi
  (
    umask 077
    {
      echo "S3_ENDPOINT=$endpoint"
      echo "S3_BUCKET=$bucket"
      echo "S3_ACCESS_KEY=$access"
      echo "S3_SECRET_KEY=$secret"
      if [ "$market" = y ] || [ "$market" = Y ]; then echo "MARKET=yes"; fi
      cat "$old"
    } > "$BACKUP_ENV"
  )
  rm -f "$old"
  chown root:root "$BACKUP_ENV"
  chmod 600 "$BACKUP_ENV"
  echo "saved in $BACKUP_ENV (readable by root only)"
fi

echo "== 4/5 test"
if ! BACKUP_ENV="$BACKUP_ENV" bash "$DIR/backup-s3.sh" --check; then
  echo
  echo "The test failed: check the endpoint, the bucket name and the keys, then run this script again."
  exit 1
fi

echo "== 5/5 nightly run and first backup"
cat > /etc/cron.d/backtestlab-backup << EOF
# Nightly backup of BacktestLab's data to object storage (setup-backup.sh)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 $HOUR * * * root BACKUP_ENV=$BACKUP_ENV bash $DIR/backup-s3.sh >> $LOG 2>&1
EOF
chmod 644 /etc/cron.d/backtestlab-backup
cat > /etc/logrotate.d/backtestlab-backup << EOF
$LOG {
  monthly
  rotate 6
  compress
  missingok
  notifempty
}
EOF
echo "every night at $(printf '%02d' "$HOUR"):15 (/etc/cron.d/backtestlab-backup), log: $LOG"

if systemctl is-active --quiet "$UNIT"; then
  echo "The first backup is already running."
else
  systemctl reset-failed "$UNIT" 2> /dev/null || true
  if ! systemd-run --quiet --unit="$UNIT" bash -c "BACKUP_ENV=$BACKUP_ENV bash $DIR/backup-s3.sh >> $LOG 2>&1" 2> /dev/null; then
    BACKUP_ENV="$BACKUP_ENV" setsid nohup bash "$DIR/backup-s3.sh" >> "$LOG" 2>&1 < /dev/null &
  fi
  echo "The first backup has started in the background (it keeps running if you close SSH)."
fi
echo
echo "Follow it:     sudo tail -f $LOG"
echo "When it ends:  sudo bash $DIR/backup-s3.sh --list"
echo "Restore:       sudo bash $DIR/backup-s3.sh --restore"
