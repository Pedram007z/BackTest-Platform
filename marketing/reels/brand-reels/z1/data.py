# z1: data.json = the voice timing (voice/timing.json) + one real, fully specified example of «knowing your numbers»:
# a plain breakout rule tested on XAUUSD 4-hour candles (the platform's stored 1-minute data, January 2015 to September
# 2026, UTC-aligned 4-hour bars):
#   when a 4-hour candle closes above the highest high of the previous 20 candles, buy at the next open; below the lowest
#   low, sell. Stop 1.5 × ATR(14) away, target 2R. One trade at a time; a candle touching both counts as the stop.
#   Every trade pays a 0.30 spread and $7 per lot commission (0.37 an ounce), counted in R.
# It keeps the three numbers (win rate, average win against average loss, longest losing streak), every trade's result in
# R (the equity curve and the wall of trades), a five-loss streak inside the curve that the rule rode through to a new
# high, and one winning trade's candles for the replay scene.   python3 data.py
import os, sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')
keys = [f'{y}-{m:02d}' for y in range(2015, 2027) for m in range(1, 13) if (y, m) <= (2026, 9)]
a = np.vstack([month(STORE, 'XAUUSD', k) for k in keys])
TF, N, SL, RR, COST = 4 * 3600, 20, 1.5, 2, 0.37
b = (a[:, 0] // TF).astype(np.int64); u, st = np.unique(b, return_index=True); en = np.append(st[1:], len(a))
ts, O, H, L, C = u * TF, a[st, 1], np.maximum.reduceat(a[:, 2], st), np.minimum.reduceat(a[:, 3], st), a[en - 1, 4]
n = len(C); tr = np.maximum(H[1:], C[:-1]) - np.minimum(L[1:], C[:-1]); atr = np.full(n, np.nan)
for i in range(15, n): atr[i] = tr[i - 14:i].mean()
trades = []; i = N + 15
while i < n - 1:
    side = 1 if C[i] > H[i - N:i].max() else -1 if C[i] < L[i - N:i].min() else 0
    if not side: i += 1; continue
    E = O[i + 1]; risk = SL * atr[i]; S, TP = E - side * risk, E + side * RR * risk; r = None
    for k in range(i + 1, n):
        if (L[k] <= S) if side == 1 else (H[k] >= S): r = -1; break
        if (H[k] >= TP) if side == 1 else (L[k] <= TP): r = RR; break
    if r is None: break
    trades.append({'R': r - COST / risk, 'sig': i, 'in': i + 1, 'out': k, 'side': side, 'E': float(E), 'S': float(S), 'TP': float(TP)}); i = k + 1
R = np.array([t['R'] for t in trades]); win = R > 0
# losing runs: (start, length)
runs = []; j = 0
while j < len(R):
    if R[j] < 0:
        s = j
        while j < len(R) and R[j] < 0: j += 1
        runs.append((s, j - s))
    else: j += 1
eq = np.concatenate([[0], np.cumsum(R)])
# the five-loss streak to show: exactly 5 losses, recent, after which the curve made a new high within 40 trades
cands = [(s, l) for s, l in runs if l == 5 and s > 300 and any(eq[s + l + q] > eq[:s + 1].max() for q in range(1, 41) if s + l + q < len(eq))]
s5, _ = cands[-1]
mx_run = max(runs, key=lambda x: x[1]); mx = mx_run[1]
# the replay example: the last winning long trade before 2026-07, 40 candles before the entry and up to its exit
ex = [t for t in trades if t['R'] > 0 and t['side'] == 1 and ts[t['in']] < dt.datetime(2026, 7, 1, tzinfo=dt.timezone.utc).timestamp()][-1]
lo_i, hi_i = ex['in'] - 40, ex['out'] + 1
bars = [[round(float(O[q]), 2), round(float(H[q]), 2), round(float(L[q]), 2), round(float(C[q]), 2)] for q in range(lo_i, hi_i + 1)]
day = lambda q: dt.datetime.fromtimestamp(int(ts[q]), dt.timezone.utc).date().isoformat()
strat = {
    'n': len(R), 'wins': int(win.sum()), 'winrate': float(win.mean()), 'avgW': float(R[win].mean()), 'avgL': float(-R[~win].mean()),
    'ratio': float(R[win].mean() / -R[~win].mean()), 'total': float(R.sum()), 'maxL': int(mx), 'maxL_at': int(mx_run[0]),
    'R': [round(float(x), 2) for x in R], 'five': int(s5), 'from': day(trades[0]['in']), 'to': day(trades[-1]['out']),
    'replay': {'idx': trades.index(ex), 'bars': bars, 'entry': ex['in'] - lo_i, 'exit': ex['out'] - lo_i, 'E': round(ex['E'], 2), 'S': round(ex['S'], 2), 'TP': round(ex['TP'], 2), 'date': day(ex['in'])},
}
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'strat': strat}, open('data.json', 'w'), ensure_ascii=False)
print(f"{strat['n']} trades {strat['from']}→{strat['to']}: win {strat['winrate']:.1%}, avg win {strat['avgW']:.2f}R / avg loss {strat['avgL']:.2f}R = {strat['ratio']:.2f}, "
      f"total {strat['total']:+.1f}R, longest losing streak {strat['maxL']} (at trade {strat['maxL_at']}); five-loss streak at trade {s5} "
      f"(curve {eq[s5]:.1f} → {eq[s5 + 5]:.1f}R, high before {eq[:s5 + 1].max():.1f}R); replay {strat['replay']['date']} ({len(bars)} candles)")
