# The showreel's numbers are real backtests on the platform's market store (BTM1 month files of 1-minute bars):
# a 20-hour breakout (buy above the 20-bar high, sell below the 20-bar low), stop 1 ATR(14), target 2 ATR, one trade
# at a time, a bar touching both counts as the stop. From it: the replay panel's trade (EUR/USD's latest target hit),
# the analytics (EUR/USD's last 100 trades in R), the four synchronised panels (each market's latest trade), and the
# 3D city (EUR/USD's weekly moves, 14 × 24 weeks).   python3 data.py <store dir>  → data.json
import sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '..')
from m6.store import month
S = sys.argv[1]
def months(a, b):
    y, m = a; out = []
    while (y, m) <= b:
        out.append(f'{y}-{m:02d}'); m += 1
        if m > 12: y, m = y + 1, 1
    return out
def bars(sym, step, a=(2025, 1), b=(2026, 10)):
    parts = []
    for k in months(a, b):
        try: parts.append(month(S, sym, k))
        except Exception as e: print('  skipped unreadable', sym, k, '-', type(e).__name__)
    B = np.vstack(parts); g = (B[:, 0] // step).astype(np.int64)
    idx = np.r_[0, np.nonzero(np.diff(g))[0] + 1]
    return np.column_stack([g[idx] * step, B[idx, 1], np.maximum.reduceat(B[:, 2], idx), np.minimum.reduceat(B[:, 3], idx), B[np.r_[idx[1:] - 1, len(B) - 1], 4]])
def backtest(H):
    o, h, l, c = H[:, 1], H[:, 2], H[:, 3], H[:, 4]; tr = np.maximum(h[1:] - l[1:], np.maximum(abs(h[1:] - c[:-1]), abs(l[1:] - c[:-1]))); atr = np.r_[np.nan, np.convolve(tr, np.ones(14) / 14, 'full')[:len(tr)]]
    trades, i = [], 21
    while i < len(H) - 1:
        hi20, lo20 = h[i - 20:i].max(), l[i - 20:i].min(); d = 1 if c[i] > hi20 else -1 if c[i] < lo20 else 0
        if d == 0 or not np.isfinite(atr[i]): i += 1; continue
        e = c[i]; sl = e - d * atr[i]; tp = e + d * 2 * atr[i]; res = None
        for j in range(i + 1, min(len(H), i + 120)):
            if (l[j] <= sl if d > 0 else h[j] >= sl): res = -1.0; break
            if (h[j] >= tp if d > 0 else l[j] <= tp): res = 2.0; break
        if res is None: break
        trades.append({'i': i, 'x': j, 'd': d, 'e': float(e), 'sl': float(sl), 'tp': float(tp), 'r': res}); i = j + 1
    return trades
def window(H, t, before=26, after=6):
    a, b = max(0, t['i'] - before), min(len(H), t['x'] + after + 1)
    dec = 5 if H[0, 4] < 10 else 2
    return {'bars': [[round(float(v), dec) for v in H[k, 1:5]] for k in range(a, b)], 'entry': t['i'] - a, 'exit': t['x'] - a, 'd': t['d'], 'e': round(t['e'], dec), 'sl': round(t['sl'], dec), 'tp': round(t['tp'], dec), 'r': t['r'],
            'when': dt.datetime.utcfromtimestamp(H[t['i'], 0]).strftime('%Y-%m-%d %H:%M')}
EU = bars('EURUSD', 3600); T = backtest(EU)
last100 = T[-100:]; eq = np.cumsum([t['r'] for t in last100]); wins = sum(t['r'] > 0 for t in last100)
ui = next(t for t in reversed(T) if t['r'] > 0 and t['x'] - t['i'] <= 12)
panels = {}
for sym in ('EURUSD', 'XAUUSD', 'BTCUSD', 'NAS100'):
    H = EU if sym == 'EURUSD' else bars(sym, 3600, (2026, 6), (2026, 10)); tt = backtest(H); tr = next(t for t in reversed(tt) if t['x'] - t['i'] <= 14); panels[sym] = window(H, tr, 22, 4)
W = bars('EURUSD', 7 * 86400, (2015, 1), (2026, 10)); ok = np.diff(W[:, 0]) == 7 * 86400          # consecutive weeks only
wr = (W[1:, 4] / W[:-1, 4] - 1)[ok][-336:]
J = {'ui': window(EU, ui), 'trades': [t['r'] for t in last100], 'equity': [float(v) for v in eq], 'wins': wins, 'panels': panels, 'city': [round(float(v), 5) for v in wr],
     'span': [dt.datetime.utcfromtimestamp(EU[last100[0]['i'], 0]).strftime('%Y-%m-%d'), dt.datetime.utcfromtimestamp(EU[last100[-1]['x'], 0]).strftime('%Y-%m-%d')]}
json.dump(J, open('data.json', 'w'))
print('EURUSD trades', len(T), '| last 100:', wins, 'wins, total', eq[-1], 'R,', J['span']); print('ui trade', J['ui']['when'], J['ui']['d'], J['ui']['r'], len(J['ui']['bars']), 'bars')
for s, p in panels.items(): print(s, p['when'], 'dir', p['d'], 'R', p['r'], len(p['bars']), 'bars')
print('city weeks', len(wr), 'max |ret|', round(float(abs(wr).max()) * 100, 2), '%')
