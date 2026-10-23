# q2: data.json = the voice timing (voice/timing.json from voice/build.py) + real gold monthly candles for «سال‌ها داده‌ی
# واقعی» (XAUUSD from the platform's stored 1-minute data, January 2015 to the last full month, one candle per calendar
# month in UTC).   MARKET_STORE=/path/to/store python3 data.py
import os, sys, json
import numpy as np
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')
keys = [f'{y}-{m:02d}' for y in range(2015, 2027) for m in range(1, 13) if (y, m) <= (2026, 9)]
bars = []
for k in keys:
    a = month(STORE, 'XAUUSD', k)
    bars.append([round(a[0, 1], 2), round(a[:, 2].max(), 2), round(a[:, 3].min(), 2), round(a[-1, 4], 2)])
t = json.load(open('voice/timing.json')) if os.path.exists('voice/timing.json') else {'T': {}, 'w': [], 'dur': 0}
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'gold': {'bars': bars, 'from': keys[0], 'to': keys[-1]}}, open('data.json', 'w'), ensure_ascii=False)
print(len(bars), 'months', keys[0], bars[0], '→', keys[-1], bars[-1])
