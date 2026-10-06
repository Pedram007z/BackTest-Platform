#!/usr/bin/env bash
# Checks that this server can reach the market-data and calendar sources, directly or through the
# relay set in the API server's .env (DEPLOY.md, step 8). Run it on the server:
#   bash check-sources.sh                  (reads /opt/backtestlab/server/.env)
#   bash check-sources.sh path/to/.env
ENV_FILE="${1:-/opt/backtestlab/server/.env}"

setting() {
  [ -r "$ENV_FILE" ] && grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r'
}
DUKASCOPY_API=$(setting DUKASCOPY_API_URL); DUKASCOPY_API=${DUKASCOPY_API:-https://jetta.dukascopy.com/v1}
DUKASCOPY=$(setting DUKASCOPY_URL); DUKASCOPY=${DUKASCOPY:-https://datafeed.dukascopy.com/datafeed}
BINANCE=$(setting BINANCE_URL); BINANCE=${BINANCE:-https://data-api.binance.vision}
BINANCE_VISION=$(setting BINANCE_VISION_URL); BINANCE_VISION=${BINANCE_VISION:-https://data.binance.vision}
FF=$(setting FF_BASE_URL); FF=${FF:-https://www.forexfactory.com}
FF_FEED=$(setting FF_FEED_URL); FF_FEED=${FF_FEED:-https://nfs.faireconomy.media/ff_calendar_thisweek.json}

failed=0
# check NAME URL [optional]: an optional source that fails is reported but does not fail the run
check() {
  local name=$1 url=$2 optional=$3 code
  code=$(curl -s -o /dev/null -m 20 -r 0-4095 -A 'Mozilla/5.0' -w '%{http_code}' "$url")
  if [ "$code" = "200" ] || [ "$code" = "206" ]; then
    echo "OK    $name"
    return 0
  else
    [ -z "$optional" ] && failed=1
    case "$code" in
      000) why="no connection (blocked or no route)" ;;
      403|451) why="refused (HTTP $code): blocked for this server's country, or by Cloudflare" ;;
      *) why="HTTP $code" ;;
    esac
    echo "FAIL  $name: $why"
    echo "      $url"
    return 1
  fi
}

echo "Checking from $(hostname) with $( [ -r "$ENV_FILE" ] && echo "$ENV_FILE" || echo "default addresses")"
# Dukascopy (forex, metals, energy, indices): the data API is used first, the datafeed files when it
# fails, so one of the two is enough
api_ok=0; feed_ok=0
check "Dukascopy data API (forex, metals, energy, indices)" "$DUKASCOPY_API/candles/minute/EUR-USD/BID/2024/1/15" optional && api_ok=1
check "Dukascopy datafeed (forex, metals, energy, indices)" "$DUKASCOPY/EURUSD/2024/00/15/BID_candles_min_1.bi5" optional && feed_ok=1
if [ "$api_ok" = 0 ] && [ "$feed_ok" = 0 ]; then
  failed=1
  echo "      Neither Dukascopy address works: forex, metals, energy and indices will have no data."
fi
check "Binance (crypto)" "$BINANCE/api/v3/klines?symbol=BTCUSDT&interval=5m&startTime=1704067200000&endTime=1704067499999&limit=1"
check "Binance history archives (crypto download)" "$BINANCE_VISION/data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip"
check "ForexFactory calendar" "$FF/calendar?week=jan7.2024"
check "ForexFactory weekly feed" "$FF_FEED"

if [ "$failed" = 1 ]; then
  echo
  echo "Some sources are not reachable. Set up the relay (DEPLOY.md, step 8), then run this again."
  exit 1
fi
echo
echo "All sources reachable."
