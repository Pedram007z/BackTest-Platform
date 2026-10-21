# One ICT-style short setup on a real day: London (02–05 NY) high swept in the NY morning, the first bearish FVG of the
# displacement after it, entry at the FVG's midpoint (CE), stop above the sweep's high, target 2R; replayed on 1m bars.
import os, sys, json, datetime as dt, numpy as np
from zoneinfo import ZoneInfo
sys.path.insert(0, '../m6'); from store import month
NY = ZoneInfo('America/New_York'); STORE = os.environ.get('MARKET_STORE', '/home/user/market-data/store')   # the market-data branch's store/
def bars5(sym, day, h0, h1):
    m1 = month(STORE, sym, day[:7]); d0 = dt.datetime.fromisoformat(day).replace(tzinfo=NY)
    a, b = (d0 + dt.timedelta(hours=h0)).timestamp(), (d0 + dt.timedelta(hours=h1)).timestamp()
    x = m1[(m1[:, 0] >= a) & (m1[:, 0] < b)]; k = (x[:, 0] // 300).astype(int); out = []
    for kk in np.unique(k): s = x[k == kk]; out.append([kk * 300, s[0, 1], s[:, 2].max(), s[:, 3].min(), s[-1, 4]])
    return np.array(out), m1
def setup(sym, day, h0=2, h1=13, buf_frac=0.25):
    b, m1 = bars5(sym, day, h0, h1)
    hh = np.array([(dt.datetime.fromtimestamp(t, NY).hour + dt.datetime.fromtimestamp(t, NY).minute / 60) for t in b[:, 0]])
    lon = np.nonzero((hh >= 2) & (hh < 5))[0]; LH = b[lon, 2].max(); lhi = lon[np.argmax(b[lon, 2])]
    avg = (b[:, 2] - b[:, 3]).mean()
    j = next(i for i in range(len(b)) if hh[i] >= 7 and b[i, 2] > LH)
    # the sweep's extreme: the highest high from the sweep until the displacement's FVG
    for k in range(j + 1, len(b) - 1):
        if b[k - 1, 3] > b[k + 1, 2] and b[k, 4] < b[k, 1]:
            top, bot = b[k - 1, 3], b[k + 1, 2]; break
    ext_i = j + int(np.argmax(b[j:k + 1, 2])); ext = b[ext_i, 2]
    ce = (top + bot) / 2; sl = ext + buf_frac * avg; risk = sl - ce; tp = ce - 2 * risk
    t0 = b[k + 1, 0] + 300; after = m1[(m1[:, 0] >= t0) & (m1[:, 0] < t0 + 6 * 3600)]
    fill = out = None
    for r in after:
        if fill is None:
            if r[2] >= ce: fill = r[0]; 
            if fill is None or r[2] < sl: continue
        if r[2] >= sl: out = ('sl', r[0]); break
        if r[3] <= tp: out = ('tp', r[0]); break
    f = lambda t: dt.datetime.fromtimestamp(t, NY).strftime('%H:%M') if t else '-'
    idx = lambda t: int((t - b[0, 0]) // 300) if t else None
    return dict(sym=sym, day=day, LH=LH, lhi=int(lhi), sweep=int(j), ext=ext, ext_i=int(ext_i), fvg_i=int(k), fvg=[bot, top], ce=ce, sl=sl, tp=tp,
                fill=f(fill), fill_i=idx(fill), out=out[0] if out else 'open', out_t=f(out[1]) if out else '-', out_i=idx(out[1]) if out else None,
                bars=b.tolist(), avg=avg)
if __name__ == '__main__':
    s = setup(sys.argv[1], sys.argv[2])
    print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in s.items() if k != 'bars'})
