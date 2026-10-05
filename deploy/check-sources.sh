#!/usr/bin/env bash
# Checks that this server can reach the market-data and calendar sources, directly or through the
# relay set in the API server's .env (DEPLOY.md, step 8). Run it on the server:
#   bash check-sources.sh                  (reads /opt/backtestlab/server/.env)
#   bash check-sources.sh path/to/.env
ENV_FILE="${1:-/opt/backtestlab/server/.env}"

setting() {
  [ -r "$ENV_FILE" ] && grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r'
}
DUKASCOPY=$(setting DUKASCOPY_URL); DUKASCOPY=${DUKASCOPY:-https://datafeed.dukascopy.com/datafeed}
BINANCE=$(setting BINANCE_URL); BINANCE=${BINANCE:-https://data-api.binance.vision}
FF=$(setting FF_BASE_URL); FF=${FF:-https://www.forexfactory.com}
FF_FEED=$(setting FF_FEED_URL); FF_FEED=${FF_FEED:-https://nfs.faireconomy.media/ff_calendar_thisweek.json}

failed=0
check() {
  local name=$1 url=$2 code
  code=$(curl -s -o /dev/null -m 20 -A 'Mozilla/5.0' -w '%{http_code}' "$url")
  if [ "$code" = "200" ]; then
    echo "OK    $name"
  else
    failed=1
    case "$code" in
      000) why="no connection (blocked or no route)" ;;
      403|451) why="refused (HTTP $code): blocked for this server's country, or by Cloudflare" ;;
      *) why="HTTP $code" ;;
    esac
    echo "FAIL  $name: $why"
    echo "      $url"
  fi
}

echo "Checking from $(hostname) with $( [ -r "$ENV_FILE" ] && echo "$ENV_FILE" || echo "default addresses")"
check "Dukascopy (forex, metals, energy, indices)" "$DUKASCOPY/EURUSD/2024/00/15/BID_candles_min_1.bi5"
check "Binance (crypto)" "$BINANCE/api/v3/klines?symbol=BTCUSDT&interval=5m&startTime=1704067200000&endTime=1704067499999&limit=1"
check "ForexFactory calendar" "$FF/calendar?week=jan7.2024"
check "ForexFactory weekly feed" "$FF_FEED"

if [ "$failed" = 1 ]; then
  if [ "${CHECK_SOURCES_HINT:-1}" = 1 ]; then
    echo
    echo "Some sources are not reachable. Set up the relay (DEPLOY.md, step 8), then run this again."
  fi
  exit 1
fi
echo
echo "All sources reachable."
