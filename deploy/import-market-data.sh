#!/usr/bin/env bash
# Loads ready-made market history (1-minute candles from 2015) into the API server's storage, so the
# server does not have to download it from Dukascopy and Binance itself. The history is kept in a
# GitHub repository in the server's own file format (store/<SYMBOL>/<YYYY>-<MM>.m1).
#
#   sudo bash import-market-data.sh                     the default repository below
#   sudo bash import-market-data.sh https://github.com/OWNER/REPO.git
#
# The repository is private: git asks for a username and a password. Give your GitHub username and,
# as the password, a token (github.com → Settings → Developer settings → Fine-grained tokens, access to
# that repository only, Contents: Read-only). Or set GITHUB_TOKEN=... to skip the questions.
#
# A month the server already has is replaced only by a larger file (more days). Run it again later to
# add months published after the first import. ENV_FILE and SERVICE change the defaults below.
set -euo pipefail
REPO="${1:-https://github.com/Pedram007z/BackTest-Market-Data.git}"
ENV_FILE="${ENV_FILE:-/opt/backtestlab/server/.env}"
SERVICE="${SERVICE:-backtestlab}"

if [ "$(id -u)" != 0 ]; then
  echo "Run with sudo: it writes to the server's data folder and restarts the service."
  exit 1
fi
command -v git > /dev/null || { echo "git is needed: sudo apt install -y git"; exit 1; }

DATA_DIR=$( [ -r "$ENV_FILE" ] && grep -E '^DATA_DIR=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' || true)
DATA_DIR="${DATA_DIR:-/var/lib/backtestlab}"
STORE="$DATA_DIR/market/store"
OWNER=$(stat -c %U "$DATA_DIR" 2> /dev/null || echo backtestlab)

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
URL="$REPO"
if [ -n "${GITHUB_TOKEN:-}" ]; then URL="${REPO/https:\/\//https://x-access-token:$GITHUB_TOKEN@}"; fi
echo "Downloading the market history from $REPO (about 1 GB; a few minutes)…"
git clone --depth 1 --quiet "$URL" "$TMP/data"
[ -d "$TMP/data/store" ] || { echo "No store/ folder in $REPO: is it the market data repository?"; exit 1; }

mkdir -p "$STORE"
added=0
replaced=0
kept=0
while IFS= read -r -d '' f; do
  rel="${f#"$TMP/data/store/"}"
  dest="$STORE/$rel"
  if [ ! -e "$dest" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$f" "$dest"
    added=$((added + 1))
  elif [ "$(stat -c %s "$f")" -gt "$(stat -c %s "$dest")" ]; then
    cp "$f" "$dest"
    replaced=$((replaced + 1))
  else
    kept=$((kept + 1))
  fi
done < <(find "$TMP/data/store" -type f \( -name '*.m1' -o -name '*.s1' \) -print0)
chown -R "$OWNER" "$DATA_DIR/market"

echo "Months added: $added, replaced with fuller ones: $replaced, already on the server: $kept."
if systemctl list-unit-files "$SERVICE.service" > /dev/null 2>&1; then
  systemctl restart "$SERVICE"
  echo "Restarted $SERVICE. Coverage per symbol: admin panel → نمادها و داده‌ی بازار."
fi
