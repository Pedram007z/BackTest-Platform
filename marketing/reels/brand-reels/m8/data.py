# m8's three real market moments, from the platform's 1-minute store (BTM1 month files):
#   1 · gold, 4-hour candles: the climb into 9 March 2020, then the COVID sell-off to 16 March (−14.8% high to low)
#   2 · Nasdaq 100, 4-hour candles: the April 2025 tariff slide with its failed bounce, then 9 April (+13.6% close to close)
#   3 · Bitcoin, 12-hour candles: the late-October 2024 top and pullback, then the run from 5 November to 22 November
# Each chart is [setup candles …] + [reveal candles …]; the reel stops at the end of the setup and asks.
#   python3 data.py <store dir>  → charts.json
import sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '..')
from m6.store import month
S = sys.argv[1]
ts = lambda s: int(dt.datetime.strptime(s, '%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone.utc).timestamp())
def candles(sym, months, step, a, b):
    B = np.vstack([month(S, sym, m) for m in months]); B = B[(B[:, 0] >= ts(a)) & (B[:, 0] < ts(b))]
    g = (B[:, 0] // step).astype(np.int64); idx = np.r_[0, np.nonzero(np.diff(g))[0] + 1]; end = np.r_[idx[1:], len(B)]
    return [[round(float(B[i, 1]), 2), round(float(B[i:j, 2].max()), 2), round(float(B[i:j, 3].min()), 2), round(float(B[j - 1, 4]), 2)] for i, j in zip(idx, end)]
def chart(sym, months, step, a, cut, b, **kw):
    s, r = candles(sym, months, step, a, cut), candles(sym, months, step, cut, b)
    return {'sym': sym, 'setup': s, 'reveal': r, **kw}
C = [chart('XAUUSD', ['2020-02', '2020-03'], 4 * 3600, '2020-02-27 00:00', '2020-03-09 00:00', '2020-03-17 00:00'),
     chart('NAS100', ['2025-03', '2025-04'], 4 * 3600, '2025-03-26 00:00', '2025-04-09 00:00', '2025-04-10 00:00'),
     chart('BTCUSD', ['2024-10', '2024-11'], 12 * 3600, '2024-10-19 00:00', '2024-11-05 12:00', '2024-11-22 12:00')]
# the moves the reel states, from the same bars
g = C[0]; hi = max(c[1] for c in g['setup'][-6:] + g['reveal'][:3]); lo = min(c[2] for c in g['reveal']); g['move'] = round((lo / hi - 1) * 100, 1)
n = C[1]; n['move'] = round((n['reveal'][-1][3] / n['setup'][-1][3] - 1) * 100, 1)        # 8 April close → 9 April close (UTC days)
b = C[2]; b['move'] = round((max(c[1] for c in b['reveal']) / b['reveal'][0][0] - 1) * 100, 1)
json.dump(C, open('charts.json', 'w'))
for c in C: print(c['sym'], len(c['setup']), '+', len(c['reveal']), 'candles; move', c['move'], '%; last setup close', c['setup'][-1][3])
