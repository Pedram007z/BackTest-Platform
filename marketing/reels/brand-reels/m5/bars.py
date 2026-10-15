# m5's real gold prices, from the platform's market store (BTM1 month files of 1-minute bars, see
# server/src/market/store.ts): 5 July 2024, the US jobs report at 12:30 UTC (16:00 Tehran), when one 1-minute
# candle fell from 2366.10 to 2347.52, under the round 2350 and the previous low (2350.36, 4 July 06:32 UTC),
# and closed back at 2362.59; gold reached 2392.82 that evening.
#   python3 bars.py <store dir, e.g. DATA_DIR/market/store>  → bars.json
import sys, zlib, json, datetime as dt
import numpy as np
STORE = sys.argv[1]; GAP = -2147483648
def month(sym, key):
    b = open(f'{STORE}/{sym}/{key}.m1', 'rb').read(); assert b[:4] == b'BTM1'
    sc = 10 ** b[5]; status = b[8:39]; ints = np.frombuffer(zlib.decompress(b[48:]), '<i4')
    y, m = map(int, key.split('-')); t0 = int(dt.datetime(y, m, 1, tzinfo=dt.timezone.utc).timestamp()); out = []; blk = 0
    for d in range(31):
        if status[d] != 2: continue
        prev = 0; base = blk * 1440 * 4
        for j in range(1440):
            i = base + j * 4
            if ints[i] == GAP: continue
            o = prev + int(ints[i]); c = o + int(ints[i + 3])
            out.append([t0 + d * 86400 + j * 60, o / sc, (o + int(ints[i + 1])) / sc, (o - int(ints[i + 2])) / sc, c / sc]); prev = c
        blk += 1
    return np.array(out)
B = month('XAUUSD', '2024-07')
ts = lambda s: dt.datetime.strptime(s, '%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone.utc).timestamp()
def agg(a, b, step):
    w = B[(B[:, 0] >= ts(a)) & (B[:, 0] < ts(b))]; out = []
    for t0 in range(int(ts(a)), int(ts(b)), step):
        s = w[(w[:, 0] >= t0) & (w[:, 0] < t0 + step)]
        if len(s): out.append([t0, round(s[0, 1], 2), round(s[:, 2].max(), 2), round(s[:, 3].min(), 2), round(s[-1, 4], 2)])
    return out
m1 = agg('2024-07-05 12:00', '2024-07-05 13:30', 60)
m30 = agg('2024-07-03 22:00', '2024-07-05 15:00', 1800)
prev = B[(B[:, 0] >= ts('2024-07-04 00:00')) & (B[:, 0] < ts('2024-07-05 00:00'))]; k = int(np.argmin(prev[:, 3]))
after = B[(B[:, 0] >= ts('2024-07-05 12:30')) & (B[:, 0] < ts('2024-07-06 00:00'))]; kh = int(np.argmax(after[:, 2]))
J = {'m1': m1, 'm30': m30, 'prev_low': [int(prev[k, 0]), round(prev[k, 3], 2)], 'wick': [x for x in m1 if x[0] == ts('2024-07-05 12:30')][0],
     'high_after': [int(after[kh, 0]), round(after[kh, 2], 2)]}
json.dump(J, open('bars.json', 'w'))
print('m1', len(m1), 'm30', len(m30), 'prev low', J['prev_low'], 'wick', J['wick'], 'high after', J['high_after'])
