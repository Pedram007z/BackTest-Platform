#!/usr/bin/env bash
# Backs up what lives only on the server (the code is on GitHub) to S3 object storage: ArvanCloud
# Object Storage or any S3-compatible service, with rclone. Made for slow and unstable links: only files
# that changed since the last run are uploaded, uploads go in small parts, and a dropped connection is
# retried instead of failing the night's backup.
#
#   sudo bash backup-s3.sh --check       test the settings and measure the upload speed
#   sudo bash backup-s3.sh               back up now (what cron runs every night)
#   sudo bash backup-s3.sh --list        the archives in the bucket
#   sudo bash backup-s3.sh --restore [YYYY-MM-DD | YYYY-MM]
#                                         download a backup (the latest by default) into a new folder
#                                         next to the data folder; the live data is not touched
#
# In the bucket:
#   daily/backtestlab-YYYY-MM-DD.tar.gz  accounts, payments, settings, blog, news, users' workspaces and
#                                        backtests (the JSON files) and the server's .env, one per day
#   monthly/backtestlab-YYYY-MM.tar.gz   the first archive of each month, kept longer
#   mirror/                              the data folder as files: pictures, videos, journal screenshots
#   changed/YYYY-MM-DD/                  the old versions of files the mirror replaced or deleted that day
#
# Settings, in /opt/backtestlab/backup.env (BACKUP_ENV changes it), readable by root only:
#   S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
#   S3_BUCKET=backtestlab-backup
#   S3_ACCESS_KEY=...
#   S3_SECRET_KEY=...
# Optional: KEEP_DAYS=30 (daily archives and old versions), KEEP_MONTHS=12, BWLIMIT=1M (upload speed
# cap, so the site stays fast during a backup), MARKET=yes (also mirror market/store; by default it is
# left out: it can be imported from GitHub again with import-market-data.sh and downloaded again).
# ENV_FILE, DATA_DIR and SERVICE change the defaults below; each setting can also be given as a variable.
set -euo pipefail
BACKUP_ENV="${BACKUP_ENV:-/opt/backtestlab/backup.env}"
ENV_FILE="${ENV_FILE:-/opt/backtestlab/server/.env}"
SERVICE="${SERVICE:-backtestlab}"
LOCK=/run/backtestlab-backup.lock

# conf NAME FILE: the value of the last NAME=... line of FILE (quotes around it removed)
conf() {
  [ -r "$2" ] || return 0
  grep -E "^$1=" "$2" | tail -n 1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/" || true
}
setting() { # setting NAME DEFAULT: the variable if set, else backup.env, else DEFAULT
  local v="${!1:-}"
  [ -n "$v" ] || v=$(conf "$1" "$BACKUP_ENV")
  echo "${v:-$2}"
}
stamp() { date '+%F %T'; }

if [ "$(id -u)" != 0 ]; then
  echo "Run with sudo: it reads the server's data folder and $BACKUP_ENV."
  exit 1
fi
if ! command -v rclone > /dev/null; then
  echo "rclone is needed: sudo apt install -y rclone"
  echo "(or upload the .deb from https://rclone.org/downloads/ and: sudo dpkg -i rclone-*-linux-amd64.deb)"
  exit 1
fi

S3_ENDPOINT=$(setting S3_ENDPOINT '')
S3_BUCKET=$(setting S3_BUCKET '')
S3_ACCESS_KEY=$(setting S3_ACCESS_KEY '')
S3_SECRET_KEY=$(setting S3_SECRET_KEY '')
KEEP_DAYS=$(setting KEEP_DAYS 30)
KEEP_MONTHS=$(setting KEEP_MONTHS 12)
BWLIMIT=$(setting BWLIMIT '')
MARKET=$(setting MARKET no)
DATA_DIR="${DATA_DIR:-$(conf DATA_DIR "$ENV_FILE")}"
DATA_DIR="${DATA_DIR:-/var/lib/backtestlab}"
DATA_DIR="${DATA_DIR%/}"

if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
  echo "Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY in $BACKUP_ENV (see the top of this script)."
  exit 1
fi
if ! [[ "$KEEP_DAYS" =~ ^[0-9]+$ && "$KEEP_MONTHS" =~ ^[0-9]+$ ]]; then
  echo "KEEP_DAYS and KEEP_MONTHS must be numbers."
  exit 1
fi
case "$S3_ENDPOINT" in http://* | https://*) ;; *) S3_ENDPOINT="https://$S3_ENDPOINT" ;; esac

# The bucket as an rclone remote, from variables only: no rclone.conf, and the keys never appear in
# the process list. (RCLONE_CONFIG empty: rclone keeps its settings in memory.)
export RCLONE_CONFIG=
export RCLONE_CONFIG_BTLBACKUP_TYPE=s3
export RCLONE_CONFIG_BTLBACKUP_PROVIDER=Other
export RCLONE_CONFIG_BTLBACKUP_ENDPOINT="$S3_ENDPOINT"
export RCLONE_CONFIG_BTLBACKUP_ACCESS_KEY_ID="$S3_ACCESS_KEY"
export RCLONE_CONFIG_BTLBACKUP_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
export RCLONE_CONFIG_BTLBACKUP_ACL=private
R="btlbackup:$S3_BUCKET"

# For a slow, dropping link: few parallel uploads in 8 MB parts, long timeouts, many retries (a failed
# part is sent again, not the whole file).
RC=(rclone --log-level NOTICE --stats 5m --stats-one-line --stats-log-level NOTICE
  --transfers 2 --checkers 8 --s3-chunk-size 8M --s3-upload-concurrency 2 --s3-upload-cutoff 64M
  --contimeout 60s --timeout 5m --retries 5 --retries-sleep 30s --low-level-retries 20)
if [ -n "$BWLIMIT" ]; then RC+=(--bwlimit "$BWLIMIT"); fi

# Never copied: files being written (renamed into place when complete) and the old download caches.
EXCLUDE=(--exclude '*.tmp' --exclude '*.part' --exclude '/market/dukascopy/**' --exclude '/market/binance/**')
if [ "$MARKET" != yes ]; then EXCLUDE+=(--exclude '/market/**'); fi
TMPD=''
trap 'if [ -n "$TMPD" ]; then rm -rf "$TMPD"; fi' EXIT

check() {
  echo "rclone:      $(rclone version | head -n 1)"
  echo "data folder: $DATA_DIR ($(du -sh "$DATA_DIR" 2> /dev/null | cut -f1))"
  echo "bucket:      $S3_BUCKET at $S3_ENDPOINT"
  "${RC[@]}" mkdir "$R"
  TMPD=$(mktemp -d /var/tmp/backtestlab-check.XXXXXX)
  head -c 4M /dev/urandom > "$TMPD/probe"
  local t0 t1 probe
  probe=".backup-check-$(date +%s)"
  t0=$(date +%s.%N)
  "${RC[@]}" copyto "$TMPD/probe" "$R/$probe"
  t1=$(date +%s.%N)
  "${RC[@]}" deletefile "$R/$probe"
  local kbs
  kbs=$(awk -v a="$t0" -v b="$t1" 'BEGIN { s = b - a; if (s < 0.01) s = 0.01; printf "%d", 4096 / s }')
  echo "OK: wrote and deleted a test file. Upload speed: about $kbs KB/s."
  local excl=(--exclude '*.tmp' --exclude '*.part' --exclude dukascopy --exclude binance)
  if [ "$MARKET" != yes ]; then excl+=(--exclude market); fi
  local kb
  kb=$(du -sk "${excl[@]}" "$DATA_DIR" 2> /dev/null | cut -f1)
  if [ -n "$kb" ] && [ "$kbs" -gt 0 ]; then
    echo "The first backup uploads about $((kb / 1024 + 1)) MB: about $((kb / kbs / 60 + 1)) minutes at this speed. Later ones only send what changed."
  fi
}

list() {
  echo "Daily archives:"
  "${RC[@]}" lsf --files-only --format tsp --separator '  ' "$R/daily/" 2> /dev/null | sort || true
  echo "Monthly archives:"
  "${RC[@]}" lsf --files-only --format tsp --separator '  ' "$R/monthly/" 2> /dev/null | sort || true
}

# Deletes daily archives and old versions older than KEEP_DAYS, monthly archives older than KEEP_MONTHS.
# Runs only after today's archive is uploaded, so failing backups never empty the bucket.
prune() {
  local day month name d
  day=$(date -d "-$KEEP_DAYS days" +%F)
  month=$(date -d "$(date +%Y-%m-15) -$KEEP_MONTHS months" +%Y-%m)
  while IFS= read -r name; do
    d=${name#backtestlab-}
    d=${d%.tar.gz}
    if [[ "$d" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ && "$d" < "$day" ]]; then
      "${RC[@]}" deletefile "$R/daily/$name"
    fi
  done < <("${RC[@]}" lsf --files-only "$R/daily/" 2> /dev/null || true)
  while IFS= read -r name; do
    d=${name#backtestlab-}
    d=${d%.tar.gz}
    if [[ "$d" =~ ^[0-9]{4}-[0-9]{2}$ && "$d" < "$month" ]]; then
      "${RC[@]}" deletefile "$R/monthly/$name"
    fi
  done < <("${RC[@]}" lsf --files-only "$R/monthly/" 2> /dev/null || true)
  while IFS= read -r name; do
    d=${name%/}
    if [[ "$d" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ && "$d" < "$day" ]]; then
      "${RC[@]}" purge "$R/changed/$d"
    fi
  done < <("${RC[@]}" lsf --dirs-only "$R/changed/" 2> /dev/null || true)
}

backup() {
  exec 9> "$LOCK"
  if ! flock -n 9; then
    echo "$(stamp) the previous backup is still running; skipped"
    exit 0
  fi
  [ -d "$DATA_DIR" ] || { echo "$(stamp) no data folder at $DATA_DIR (set DATA_DIR)"; exit 1; }
  local today month
  today=$(date +%F)
  month=$(date +%Y-%m)
  echo "$(stamp) backup of $DATA_DIR to $S3_BUCKET"
  TMPD=$(mktemp -d /var/tmp/backtestlab-backup.XXXXXX)

  # 1. The archive: small, and a consistent copy of the JSON files at one moment.
  local items=() f
  for f in db.json news.json blog.json workspaces layouts backtests; do
    if [ -e "$DATA_DIR/$f" ]; then items+=(-C "$DATA_DIR" "$f"); fi
  done
  if [ -r "$ENV_FILE" ]; then
    mkdir -p "$TMPD/stage/config"
    cp "$ENV_FILE" "$TMPD/stage/config/server.env"
    items+=(-C "$TMPD/stage" config)
  fi
  if [ ${#items[@]} -eq 0 ]; then
    echo "$(stamp) nothing to archive in $DATA_DIR"
    exit 1
  fi
  local archive="$TMPD/backtestlab-$today.tar.gz" rc=0
  # Exit code 1 only means a file was replaced while being read: the server writes a new file and
  # renames it into place, so the archive holds the old or the new one, both complete.
  tar -czf "$archive" --exclude='*.tmp' --exclude='*.part' --warning=no-file-changed "${items[@]}" || rc=$?
  if [ "$rc" -gt 1 ]; then
    echo "$(stamp) tar failed ($rc)"
    exit 1
  fi
  echo "$(stamp) archive: $(du -h "$archive" | cut -f1)"
  "${RC[@]}" copyto "$archive" "$R/daily/backtestlab-$today.tar.gz"
  local monthly
  monthly=$("${RC[@]}" lsf --files-only "$R/monthly/" 2> /dev/null || true)
  if ! grep -qx "backtestlab-$month.tar.gz" <<< "$monthly"; then
    # a copy inside the bucket: nothing is uploaded again
    "${RC[@]}" copyto "$R/daily/backtestlab-$today.tar.gz" "$R/monthly/backtestlab-$month.tar.gz"
  fi

  # 2. The mirror: uploads only new and changed files (compared by checksum, from the bucket listing).
  # What it replaces or deletes is moved into changed/<today> instead of being lost.
  local status=0
  "${RC[@]}" sync "$DATA_DIR" "$R/mirror" "${EXCLUDE[@]}" --checksum --fast-list \
    --backup-dir "$R/changed/$today" || status=$?

  # 3. Old archives and versions.
  prune
  if [ "$status" != 0 ]; then
    echo "$(stamp) the archive is saved, but the mirror did not finish (rclone exit $status); the next run continues it"
    exit "$status"
  fi
  echo "$(stamp) done"
}

restore() {
  local want="${1:-}" src
  if [ -z "$want" ]; then
    src=$("${RC[@]}" lsf --files-only "$R/daily/" 2> /dev/null | grep -E '^backtestlab-.*\.tar\.gz$' | sort | tail -n 1 || true)
    [ -n "$src" ] || { echo "No daily archive in $S3_BUCKET."; exit 1; }
    src="daily/$src"
  elif [[ "$want" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    src="daily/backtestlab-$want.tar.gz"
  elif [[ "$want" =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
    src="monthly/backtestlab-$want.tar.gz"
  else
    echo "Usage: sudo bash backup-s3.sh --restore [YYYY-MM-DD | YYYY-MM]"
    exit 1
  fi
  local target owner
  target="$DATA_DIR-restore-$(date +%Y%m%d-%H%M%S)"
  owner=$(stat -c %U "$DATA_DIR" 2> /dev/null || echo "$SERVICE")
  mkdir -p "$target"
  echo "$(stamp) downloading the mirror into $target"
  "${RC[@]}" copy "$R/mirror" "$target" "${EXCLUDE[@]}" --fast-list
  echo "$(stamp) downloading $src"
  "${RC[@]}" copyto "$R/$src" "$target/.restore.tar.gz"
  # the archive's JSON files are the ones of that day: they replace the mirror's
  tar -xzf "$target/.restore.tar.gz" -C "$target"
  rm -f "$target/.restore.tar.gz"
  echo
  echo "Restored into $target"
  echo "The server's .env of that day is in $target/config/server.env (compare it with $ENV_FILE)."
  echo "To switch to it:"
  echo "  sudo systemctl stop $SERVICE"
  echo "  sudo mv $DATA_DIR $DATA_DIR.old"
  echo "  sudo mv $target $DATA_DIR && sudo rm -rf $DATA_DIR/config"
  if [ "$MARKET" != yes ]; then
    echo "  sudo mv $DATA_DIR.old/market $DATA_DIR/    # the market history (or import it: import-market-data.sh)"
  fi
  echo "  sudo chown -R $owner: $DATA_DIR"
  echo "  sudo systemctl start $SERVICE"
}

case "${1:-}" in
  '') backup ;;
  --check) check ;;
  --list) list ;;
  --restore) restore "${2:-}" ;;
  *)
    echo "Usage: sudo bash backup-s3.sh [--check | --list | --restore [YYYY-MM-DD | YYYY-MM]]"
    exit 1
    ;;
esac
