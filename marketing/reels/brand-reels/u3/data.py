# u3: data.json = the voice timing (voice/timing.json) + a real test of the setup the reel talks about, the «support
# bounce», on daily gold (XAUUSD from the platform's stored 1-minute data, January 2015 to September 2026; UTC days,
# Sunday's few hours joined to Monday):
#   a swing low is a day whose low is the lowest of the 5 days either side; once confirmed (5 days later), the first
#   return to it buys at the level + ¼ ATR(14), stop at the level − ¾ ATR (1R = 1 ATR), target 2R; a day touching both
#   counts as the stop. One trade per level, within 60 days. The trades are replayed day by day.
# It keeps every trade's result, and one winner (the cleanest recent bounce) with its candles for the «Instagram» chart,
# cut two days after the target, where a screenshot would be taken.   python3 data.py
import os, sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')
keys = [f'{y}-{m:02d}' for y in range(2015, 2027) for m in range(1, 13) if (y, m) <= (2026, 9)]
a = np.vstack([month(STORE, 'XAUUSD', k) for k in keys])
day = (a[:, 0] // 86400).astype(np.int64); wd = (day + 3) % 7; day = np.where(wd == 6, day + 1, day)   # Sunday → Monday
u, start = np.unique(day, return_index=True); end = np.append(start[1:], len(a))
O = a[start, 1]; Hh = np.maximum.reduceat(a[:, 2], start); Ll = np.minimum.reduceat(a[:, 3], start); C = a[end - 1, 4]
dates = [dt.date(1970, 1, 1) + dt.timedelta(days=int(d)) for d in u]
n = len(u); tr = np.maximum(Hh[1:], C[:-1]) - np.minimum(Ll[1:], C[:-1]); atr = np.full(n, np.nan)
for i in range(15, n): atr[i] = tr[i - 14:i].mean()
trades = []
for i in range(5, n - 5):
    if Ll[i] != Ll[i - 5:i + 6].min() or np.isnan(atr[i + 5]): continue
    L = Ll[i]
    for j in range(i + 6, min(n, i + 66)):
        A = atr[j]; E = L + 0.25 * A
        if Ll[j] > E: continue
        if Ll[j - 1] <= E: break                                  # came from below or sat on it: not a fresh return
        SL, TP = L - 0.75 * A, E + 2 * A; res, k = None, j
        if Ll[j] <= SL: res = -1
        else:
            for k in range(j + 1, min(n, j + 120)):
                if Ll[k] <= SL: res = -1; break
                if Hh[k] >= TP: res = 2; break
        if res is not None: trades.append({'swing': i, 'entry': j, 'exit': k, 'E': float(E), 'SL': float(SL), 'TP': float(TP), 'L': float(L), 'R': res, 'date': dates[j].isoformat()})
        break
wins = sum(1 for t in trades if t['R'] > 0); R = sum(t['R'] for t in trades)
# the «Instagram» example: a recent winner that bounced cleanly (reached the target fast)
best = max((t for t in trades if t['R'] > 0 and t['date'] >= '2024-01-01'), key=lambda t: (t['TP'] - t['E']) / max(1, t['exit'] - t['entry']))
lo_i, hi_i = best['swing'] - 10, best['exit'] + 2          # cut where a screenshot would be: at the top
bars = [[round(float(O[k]), 2), round(float(Hh[k]), 2), round(float(Ll[k]), 2), round(float(C[k]), 2)] for k in range(lo_i, hi_i + 1)]
ex = {'bars': bars, 'swing': best['swing'] - lo_i, 'entry': best['entry'] - lo_i, 'exit': best['exit'] - lo_i, 'L': round(best['L'], 2), 'E': round(best['E'], 2),
      'SL': round(best['SL'], 2), 'TP': round(best['TP'], 2), 'from': dates[lo_i].isoformat(), 'to': dates[hi_i].isoformat(), 'date': best['date']}
setup = {'n': len(trades), 'wins': wins, 'R': R, 'results': [t['R'] for t in trades], 'from': dates[0].isoformat(), 'to': dates[-1].isoformat(), 'example': ex}
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'setup': setup}, open('data.json', 'w'), ensure_ascii=False)
print(f"{len(trades)} trades, {wins} wins ({wins / len(trades):.0%}), {len(trades) - wins} losses, {R:+d}R; example {ex['date']} ({ex['from']} → {ex['to']}, {len(bars)} days)")
