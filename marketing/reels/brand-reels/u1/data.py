# u1: data.json = the voice timing (voice/timing.json) + the coin-flip test on real gold, run here from the platform's
# stored 1-minute XAUUSD data (2023–2025):
#   1,000 entries at random weekday minutes 07:00–20:00 UTC, a random side (the coin), stop and target both $3 away;
#   each entry is scored twice: with no costs, and with a 0.30 spread (bid/ask around the stored mid) and $7 a lot
#   commission ($0.07 per oz). A trade is ±1R (minus commission/3 with costs); a bar touching both levels counts as the
#   stop. Trades that would sit over a weekend gap are skipped. Seed 3, the run quoted in the voice-over (seeds 1–12 give −79 to −159R with costs; 10 of 12 reach $0 before trade 1,000).
# It also keeps the first entry's 5-minute candles, for the «یه لحظه‌ی تصادفی» scene.   python3 data.py
import os, sys, json, datetime as dt
import numpy as np
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')
D, S, C, N, SEED = 3.0, 0.30, 0.07, 1000, 3
keys = [f'{y}-{m:02d}' for y in (2023, 2024, 2025) for m in range(1, 13)]
a = np.vstack([month(STORE, 'XAUUSD', k) for k in keys]); ts, op, hi, lo, cl = a[:, 0], a[:, 1], a[:, 2], a[:, 3], a[:, 4]
hours = ((ts % 86400) // 3600).astype(int); wd = ((ts // 86400 + 3) % 7).astype(int)   # 1970-01-01 was a Thursday (3)
idx = np.nonzero((wd < 5) & (hours >= 7) & (hours < 20))[0]
def outcome(i, side, s):
    m0 = cl[i]; tp = m0 + side * (D + s); sl = m0 - side * (D - s)
    for j in range(i + 1, min(len(cl), i + 60 * 24 * 5)):
        if ts[j] - ts[j - 1] > 3600 * 6: return None, j
        hs = lo[j] <= sl if side == 1 else hi[j] >= sl; ht = hi[j] >= tp if side == 1 else lo[j] <= tp
        if hs: return -1, j
        if ht: return 1, j
    return None, j
rng = np.random.default_rng(SEED); free, cost, first = [], [], None
while len(cost) < N:
    i = int(rng.choice(idx)); side = 1 if rng.random() < 0.5 else -1
    r0, _ = outcome(i, side, 0.0); r1, j1 = outcome(i, side, S)
    if r0 is None or r1 is None: continue
    free.append(r0); cost.append(r1 - C / D)
    if first is None: first = (i, side, r1, j1)
cf, cc = np.cumsum(free), np.cumsum(cost)
zero = int(np.argmax(10000 + 100 * cc <= 0)) + 1 if (10000 + 100 * cc <= 0).any() else None   # $100 a trade on $10,000
# the first entry on 5-minute candles: 40 before it, through its exit
i, side, r1, j1 = first; t0 = ts[i] - 40 * 300; t1 = ts[j1] + 6 * 300
sel = (ts >= t0) & (ts <= t1); b5 = {}
for t, o, h, l, c in zip(ts[sel], op[sel], hi[sel], lo[sel], cl[sel]):
    k = int(t // 300); b = b5.get(k); b5[k] = [o, h, l, c] if b is None else [b[0], max(b[1], h), min(b[2], l), c]
bars = [[round(v, 2) for v in b] for _, b in sorted(b5.items())]
when = dt.datetime.fromtimestamp(ts[i], dt.timezone.utc)
sample = {'bars': bars, 'entry': round(float(cl[i]), 2), 'side': side, 'won': r1 == 1, 'at': int(ts[i] // 300 - t0 // 300), 'date': when.strftime('%Y-%m-%d %H:%M UTC')}
down = lambda arr: [round(float(arr[k]), 2) for k in np.linspace(0, len(arr) - 1, 200).astype(int)]
sim = {'n': N, 'D': D, 'spread': S, 'comm': C, 'seed': SEED, 'from': keys[0], 'to': keys[-1],
       'free': {'wins': int(sum(1 for r in free if r > 0)), 'R': round(float(cf[-1]), 1), 'curve': down(cf)},
       'cost': {'wins': int(sum(1 for r in cost if r > 0)), 'R': round(float(cc[-1]), 1), 'curve': down(cc), 'full': [round(float(v), 2) for v in cc]},
       'zero': zero, 'sample': sample}
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'sim': sim}, open('data.json', 'w'), ensure_ascii=False)
print('no costs:', sim['free']['wins'], 'wins', sim['free']['R'], 'R | with costs:', sim['cost']['wins'], 'wins', sim['cost']['R'], 'R | $10k at $100/trade hits zero at trade', zero)
print('sample:', sample['date'], 'side', side, 'won' if sample['won'] else 'lost', len(bars), 'bars')
