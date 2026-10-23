# u2: data.json = the voice timing (voice/timing.json) + one real example of «درست بعد از بستن»: gold on 15-minute
# candles (XAUUSD from the platform's stored 1-minute data, 2025), a long entry whose move first went +a (a = 1.5 ×
# ATR(15m)), came back to within ¼a of the entry without reaching a stop half an ATR below it, and then ran to +3a
# within 12 hours. The cleanest such move (the biggest final run) is kept with its candles.   python3 data.py
import os, sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')
a = np.vstack([month(STORE, 'XAUUSD', f'2025-{m:02d}') for m in range(1, 13)])
k = (a[:, 0] // 900).astype(np.int64); u, s = np.unique(k, return_index=True); e = np.append(s[1:], len(a))
O, H, L, C = a[s, 1], np.maximum.reduceat(a[:, 2], s), np.minimum.reduceat(a[:, 3], s), a[e - 1, 4]
n = len(u); tr = H - L; atr = np.convolve(tr, np.ones(20) / 20, 'full')[:n]
best = None
for i in range(40, n - 60):
    if u[i + 48] - u[i] > 48 + 4: continue                                   # no weekend gap inside the window
    A = atr[i]; a1 = 1.5 * A; c0 = C[i]
    p1 = next((j for j in range(i + 1, i + 17) if H[j] >= c0 + a1), None)
    if p1 is None or L[i + 1:p1 + 1].min() < c0 - 0.5 * A: continue
    pb = next((j for j in range(p1 + 1, p1 + 17) if L[j] <= c0 + 0.25 * a1), None)
    if pb is None or L[p1:pb + 1].min() < c0 - 0.5 * A: continue
    run = next((j for j in range(pb + 1, i + 48) if H[j] >= c0 + 3 * a1), None)
    if run is None or L[pb:run + 1].min() < c0 - 0.5 * A: continue
    top = int(np.argmax(H[run:i + 48])) + run; gain = (H[top] - c0) / a1
    if best is None or gain > best[0]: best = (gain, i, p1, pb, top, a1)
gain, i, p1, pb, top, a1 = best
lo_i, hi_i = i - 24, min(n - 1, top + 6)
bars = [[round(float(O[j]), 2), round(float(H[j]), 2), round(float(L[j]), 2), round(float(C[j]), 2)] for j in range(lo_i, hi_i + 1)]
t0 = dt.datetime.fromtimestamp(int(u[i]) * 900, dt.timezone.utc)
ex = {'bars': bars, 'entry': i - lo_i, 'peak': p1 - lo_i, 'pull': pb - lo_i, 'top': top - lo_i, 'E': round(float(C[i]), 2), 'a': round(float(a1), 2),
      'exitAt': round(float(min(C[pb], C[i] + 0.25 * a1)), 2), 'high': round(float(H[top]), 2), 'date': t0.strftime('%Y-%m-%d %H:%M UTC')}
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'ex': ex}, open('data.json', 'w'), ensure_ascii=False)
print(f"{ex['date']}: entry {ex['E']}, +a = {a1:.2f}, pulled back at bar {pb - i}, ran to {ex['high']} (+{gain:.1f}a) by bar {top - i}; {len(bars)} bars")
