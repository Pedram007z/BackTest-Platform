# m7's storm: Bitcoin's real crash of 5 August 2024 (15 Mordad 1403) from the platform's market store, as hourly
# candles from 4 Aug 08:00 to 6 Aug 00:00 UTC; it opened the day at 58,161, fell to 49,000 and closed at 54,019.
#   python3 data.py <store dir, e.g. DATA_DIR/market/store>  → storm.json
import sys, json, datetime as dt
sys.path.insert(0, '..')
from m6.store import month
B = month(sys.argv[1], 'BTCUSD', '2024-08')
ts = lambda s: int(dt.datetime.strptime(s, '%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone.utc).timestamp())
bars = []
for t0 in range(ts('2024-08-04 08:00'), ts('2024-08-06 00:00'), 3600):
    s = B[(B[:, 0] >= t0) & (B[:, 0] < t0 + 3600)]
    if len(s): bars.append([t0, round(float(s[0, 1])), round(float(s[:, 2].max())), round(float(s[:, 3].min())), round(float(s[-1, 4]))])
low = min(range(len(bars)), key=lambda i: bars[i][3])
json.dump({'bars': bars, 'low': low}, open('storm.json', 'w'))
print(len(bars), 'bars; low', bars[low][3], 'at', dt.datetime.utcfromtimestamp(bars[low][0]))
