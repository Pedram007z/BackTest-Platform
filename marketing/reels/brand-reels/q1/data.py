# q1: data.json = the voice timing (voice/timing.json from voice/build.py) + real gold daily candles for the replay scene
# (XAUUSD from the stored 1-minute data, broker-style days that close at 17:00 New York, as the platform draws them).
import os, sys, json, datetime as dt, numpy as np
from zoneinfo import ZoneInfo
sys.path.insert(0, '../m6'); from store import month
STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store'); NY = ZoneInfo('America/New_York')
FROM, TO = dt.date(2025, 8, 29), dt.date(2025, 9, 16)          # the September 2025 run-up
m1 = np.vstack([month(STORE, 'XAUUSD', k) for k in ('2025-08', '2025-09')])
day = lambda ts: (dt.datetime.fromtimestamp(ts, NY) + dt.timedelta(hours=7)).date()   # 17:00 NY → the next trading day
keys = np.array([day(t).toordinal() for t in m1[:, 0]])
bars, dates = [], []
for k in sorted(set(keys)):
    d = dt.date.fromordinal(int(k))
    if not (FROM <= d <= TO) or d.weekday() >= 5: continue
    s = m1[keys == k]
    bars.append([round(s[0, 1], 2), round(s[:, 2].max(), 2), round(s[:, 3].min(), 2), round(s[-1, 4], 2)]); dates.append(d.isoformat())
t = json.load(open('voice/timing.json')) if os.path.exists('voice/timing.json') else {'T': {}, 'w': [], 'dur': 0}
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'gold': {'bars': bars, 'dates': dates}}, open('data.json', 'w'), ensure_ascii=False)
for d, b in zip(dates, bars): print(d, b)
