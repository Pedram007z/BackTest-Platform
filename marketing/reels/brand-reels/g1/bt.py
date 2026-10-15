# Backtests of the common "RSI 30/70" rules on real gold (XAUUSD) prices, 2015-01 .. 2026-10.
import csv, json, math
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
NY = ZoneInfo('America/New_York')
H1 = [(int(r['t']), float(r['o']), float(r['h']), float(r['l']), float(r['c'])) for r in csv.DictReader(open('xau_h1.csv'))]

def bucket(rows, keyf):
    out, cur, k0 = [], None, None
    for t, o, h, l, c in rows:
        k = keyf(t)
        if k != k0:
            if cur: out.append(cur)
            cur, k0 = [t, o, h, l, c], k
        else:
            cur[2] = max(cur[2], h); cur[3] = min(cur[3], l); cur[4] = c
    out.append(cur); return out
def ny_day(t):   # broker day: closes at 17:00 New York
    d = datetime.fromtimestamp(t, timezone.utc).astimezone(NY) + timedelta(hours=7)
    return d.date()
D1 = bucket(H1, ny_day)
H4 = bucket(H1, lambda t: (ny_day(t), ((datetime.fromtimestamp(t, timezone.utc).astimezone(NY).hour + 7) % 24) // 4))

def rsi(closes, n=14):
    out = [math.nan] * len(closes); g = l = 0.0
    for i in range(1, len(closes)):
        ch = closes[i] - closes[i - 1]; up, dn = max(ch, 0), max(-ch, 0)
        if i <= n:
            g += up; l += dn
            if i == n: g /= n; l /= n; out[i] = 100 - 100 / (1 + g / l) if l else 100
        else:
            g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; out[i] = 100 - 100 / (1 + g / l) if l else 100
    return out

def run(bars, mode):
    c = [b[4] for b in bars]; r = rsi(c)
    pos, entry, eq, peak, mdd = 0, 0.0, 1.0, 1.0, 0.0
    trades, curve = [], []
    for i in range(15, len(bars)):
        px = c[i]
        if mode == 'long':            # buy below 30, sell above 70
            if pos == 0 and r[i] < 30: pos, entry = 1, px
            elif pos == 1 and r[i] > 70: trades.append(px / entry - 1); eq *= px / entry; pos = 0
        else:                          # 'both': long below 30, short above 70 (always flip)
            if r[i] < 30 and pos != 1:
                if pos == -1: trades.append(entry / px - 1); eq *= entry / px
                pos, entry = 1, px
            elif r[i] > 70 and pos != -1:
                if pos == 1: trades.append(px / entry - 1); eq *= px / entry
                pos, entry = -1, px
        live = eq * ((px / entry) if pos == 1 else (entry / px) if pos == -1 else 1)
        peak = max(peak, live); mdd = max(mdd, 1 - live / peak); curve.append((bars[i][0], live))
    wins = [x for x in trades if x > 0]; streak = s = 0
    for x in trades: s = s + 1 if x <= 0 else 0; streak = max(streak, s)
    live = curve[-1][1]
    return {'trades': len(trades), 'win_rate': round(100 * len(wins) / max(1, len(trades)), 1), 'return_pct': round(100 * (live - 1), 1),
            'max_dd_pct': round(100 * mdd, 1), 'worst_losing_streak': streak, 'open_at_end': pos,
            'avg_win_pct': round(100 * sum(wins) / max(1, len(wins)), 2), 'avg_loss_pct': round(100 * sum(x for x in trades if x <= 0) / max(1, len(trades) - len(wins)), 2)}, curve
res = {}
for name, bars in (('D1', D1), ('H4', H4), ('H1', H1)):
    for mode in ('long', 'both'):
        m, curve = run(bars, mode); res[f'{name}-{mode}'] = m
        json.dump(curve[:: max(1, len(curve) // 400)], open(f'curve_{name}_{mode}.json', 'w'))
bh = H1[-1][4] / H1[0][1] - 1
print('bars D1/H4/H1', len(D1), len(H4), len(H1), 'first', H1[0][1], 'last', H1[-1][4], 'buy&hold %', round(100 * bh, 1))
for k, v in res.items(): print(k, v)
json.dump({'res': res, 'buy_hold_pct': round(100 * bh, 1), 'first': H1[0][1], 'last': H1[-1][4]}, open('results.json', 'w'), indent=1)
