# The 5 July 2024 jobs-report replay for m6, from the platform's market store: 1-minute bars 12:05–12:40 UTC and
# 5-minute bars 12:40–19:10 UTC (gold reached 2392.82 at 19:03). The trade on them: buy at the 12:29 close (2366.09),
# stop 2340 (under the 2347.52 wick), target 2392 → +$2,600 on 1 lot (100 oz).
#   python3 nfp.py <store dir>  → nfp.json
import sys, json, datetime as dt
from store import month
B = month(sys.argv[1], 'XAUUSD', '2024-07')
ts = lambda s: int(dt.datetime.strptime(s, '%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone.utc).timestamp())
def agg(a, b, step):
    w = B[(B[:, 0] >= ts(a)) & (B[:, 0] < ts(b))]; out = []
    for t0 in range(ts(a), ts(b), step):
        s = w[(w[:, 0] >= t0) & (w[:, 0] < t0 + step)]
        if len(s): out.append([t0, round(float(s[0, 1]), 2), round(float(s[:, 2].max()), 2), round(float(s[:, 3].min()), 2), round(float(s[-1, 4]), 2)])
    return out
m1 = agg('2024-07-05 12:05', '2024-07-05 12:40', 60); m5 = agg('2024-07-05 12:40', '2024-07-05 19:10', 300)
bars = m1 + m5; i_news = [k for k, b in enumerate(bars) if b[0] == ts('2024-07-05 12:30')][0]
entry = bars[i_news - 1][4]; tp_i = next(k for k, b in enumerate(bars) if k > i_news and b[2] >= 2392)
assert min(b[3] for b in bars[i_news:]) > 2340
json.dump({'bars': bars, 'news': i_news, 'm1': len(m1), 'entry': entry, 'sl': 2340.0, 'tp': 2392.0, 'tp_i': tp_i, 'oz': 100}, open('nfp.json', 'w'))
print('bars', len(bars), 'news at', i_news, 'entry', entry, 'tp hit bar', tp_i, dt.datetime.utcfromtimestamp(bars[tp_i][0]), bars[tp_i][2])
