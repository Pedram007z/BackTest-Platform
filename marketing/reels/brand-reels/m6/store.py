# Read the platform's market store: month files of 1-minute bars (BTM1, see server/src/market/store.ts).
import zlib, datetime as dt
import numpy as np
GAP = -2147483648
def month(store, sym, key):
    """[[ts, open, high, low, close], …] for the stored minutes of month key (YYYY-MM)."""
    b = open(f'{store}/{sym}/{key}.m1', 'rb').read(); assert b[:4] == b'BTM1'
    sc = 10 ** b[5]; status = b[8:39]; ints = np.frombuffer(zlib.decompress(b[48:]), '<i4').reshape(-1, 1440, 4)
    y, m = map(int, key.split('-')); t0 = int(dt.datetime(y, m, 1, tzinfo=dt.timezone.utc).timestamp()); out = []; blk = 0
    for d in range(31):
        if status[d] != 2: continue
        a = ints[blk].astype(np.int64); blk += 1; ok = a[:, 0] != GAP
        if not ok.any(): continue
        v = a[ok]; close = np.cumsum(v[:, 0] + v[:, 3]); op = close - v[:, 3]     # each day's first open is relative to 0
        ts = t0 + d * 86400 + np.nonzero(ok)[0] * 60
        out.append(np.column_stack([ts, op / sc, (op + v[:, 1]) / sc, (op - v[:, 2]) / sc, close / sc]))
    return np.vstack(out) if out else np.zeros((0, 5))
