# Finds real XAUUSD 15-minute long setups for the chart scene: a pullback in an uptrend, entry at a bar's close, stop
# below the last 6 bars' low (plus a fifth of the average range), target 2R; the outcome is replayed on 1-minute bars.
#   python3 gold.py list            candidates that reached the target within 14 bars without touching the stop
#   python3 gold.py <ts>            writes chart.json for the candidate whose entry bar starts at <ts> (UTC seconds)
import os, sys, json, datetime as dt, numpy as np
from zoneinfo import ZoneInfo
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store'); TEH = ZoneInfo('Asia/Tehran')
MONTHS = [f'{y}-{m:02d}' for y in (2025, 2026) for m in range(1, 13) if not (y == 2026 and m > 9)]
m1 = np.vstack([month(STORE, 'XAUUSD', k) for k in MONTHS])
k = (m1[:, 0] // 900).astype(np.int64); idx = np.nonzero(np.diff(k))[0] + 1; st, en = np.r_[0, idx], np.r_[idx, len(m1)]
b = np.array([[k[s] * 900, m1[s, 1], m1[s:e, 2].max(), m1[s:e, 3].min(), m1[e - 1, 4]] for s, e in zip(st, en)])
rng = b[:, 2] - b[:, 3]
def outcome(i, entry, sl, tp):
    t0 = b[i, 0] + 900; a = m1[(m1[:, 0] >= t0) & (m1[:, 0] < t0 + 14 * 900)]
    for r in a:
        if r[3] <= sl: return 'sl', r[0]
        if r[2] >= tp: return 'tp', r[0]
    return 'open', None
def setup(i):
    avg = rng[i - 40:i].mean(); entry = b[i, 4]; sl = b[i - 5:i + 1, 3].min() - 0.2 * avg; risk = entry - sl
    return avg, entry, sl, risk, entry + 2 * risk
if sys.argv[1] == 'list':
    for i in range(60, len(b) - 20):
        if b[i, 0] - b[i - 40, 0] > 40 * 900 * 1.3: continue                  # no session gaps in the window
        avg, entry, sl, risk, tp = setup(i)
        trend = b[i - 30:i - 6, 4]; up = trend[-1] > trend[0] + 4 * avg        # a rise before…
        pull = b[i - 6:i, 3].min() < b[i - 8, 4] - 0.8 * avg                   # …a pullback…
        bull = b[i, 4] > b[i, 1] + 0.4 * avg                                   # …and a strong close back up
        if not (up and pull and bull and 1.2 * avg <= risk <= 2.6 * avg): continue
        o, t = outcome(i, entry, sl, tp)
        if o == 'tp': print(int(b[i, 0]), dt.datetime.fromtimestamp(b[i, 0], TEH).strftime('%Y-%m-%d %H:%M'), round(entry, 2), round(sl, 2), round(tp, 2), round(risk / avg, 2), int((t - b[i, 0]) // 900))
else:
    ts = int(sys.argv[1]); i = int(np.nonzero(b[:, 0] == ts)[0][0]); avg, entry, sl, risk, tp = setup(i)
    o, t = outcome(i, entry, sl, tp); out_i = i + 1 + int((t - b[i, 0] - 900) // 900)
    a0, a1 = i - 20, out_i + 3
    loc = lambda ts: dt.datetime.fromtimestamp(ts, TEH)
    json.dump({'bars': [[round(x, 2) for x in r[1:]] for r in b[a0:a1]], 'times': [loc(r[0]).strftime('%H:%M') for r in b[a0:a1]],
               'entry_i': i - a0, 'out_i': out_i - a0, 'entry': round(entry, 2), 'sl': round(sl, 2), 'tp': round(tp, 2), 'result': o,
               'day': loc(b[i, 0]).strftime('%Y-%m-%d'), 'entry_t': loc(b[i, 0] + 900).strftime('%H:%M'), 'out_t': loc(t).strftime('%H:%M')},
              open('chart.json', 'w'))
    print(o, 'entry', round(entry, 2), 'sl', round(sl, 2), 'tp', round(tp, 2), 'bars', a1 - a0, 'entry_i', i - a0, 'out_i', out_i - a0, loc(b[i, 0]))
