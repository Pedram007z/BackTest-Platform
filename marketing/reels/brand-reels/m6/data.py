# m6's real gold prices, from the platform's market store (BTM1 month files of 1-minute bars, server/src/market/store.ts):
# five years of daily closes (Oct 2021 → Oct 2026) for the «۵ سال» race, and the hour with the biggest fall in those
# five years with the hours around it for «کندل به کندل … با سقوط‌هاش». The NFP replay comes from nfp.py.
#   python3 data.py <store dir, e.g. DATA_DIR/market/store>  → gold.json
import sys, json, datetime as dt
import numpy as np
from store import month as _month
STORE = sys.argv[1]
month = lambda key: _month(STORE, 'XAUUSD', key)
keys = [f'{y}-{m:02d}' for y in range(2021, 2027) for m in range(1, 13) if '2021-10' <= f'{y}-{m:02d}' <= '2026-10']
B = np.vstack([month(k) for k in keys])
def agg(step):
    g = (B[:, 0] // step).astype(np.int64); idx = np.nonzero(np.diff(g))[0] + 1; starts = np.r_[0, idx]; ends = np.r_[idx, len(B)]
    return np.array([[g[s] * step, B[s, 1], B[s:e, 2].max(), B[s:e, 3].min(), B[e - 1, 4]] for s, e in zip(starts, ends)])
D = agg(86400); Hh = agg(3600)
drop = Hh[:, 4] - Hh[:, 1]; k = int(np.argmin(drop))
win = Hh[k - 30:k + 10]
day = lambda ts: dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime('%Y-%m-%d %H:%M')
r2 = lambda a: [[int(x[0])] + [round(float(v), 2) for v in x[1:]] for x in a]
J = {'daily': [[int(t), round(float(c), 2)] for t, c in zip(D[:, 0], D[:, 4])], 'crash': {'bars': r2(win), 'at': 30, 'ts': int(Hh[k, 0]), 'drop': round(float(drop[k]), 2)}}
json.dump(J, open('gold.json', 'w'))
print('days', len(D), day(D[0, 0]), round(D[0, 4], 2), '→', day(D[-1, 0]), round(D[-1, 4], 2)); print('biggest hourly fall', day(Hh[k, 0]), Hh[k, 1:].round(2), round(float(drop[k]), 2))
