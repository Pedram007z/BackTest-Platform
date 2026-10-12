import json, datetime as dt
b = json.load(open('../data/btc_daily.json'))
D = [str(dt.datetime.fromtimestamp(x[0] / 1000, dt.UTC).date()) for x in b]; idx = {d: i for i, d in enumerate(D)}
O = [x[1] for x in b]; C = [x[4] for x in b]; n = len(C)
def sma(k, i): return sum(C[i - k + 1:i + 1]) / k if i >= k - 1 else None
fee = 0.001; trades = []; pos = None
for i in range(200, n - 1):
    p50, p200, s50, s200 = sma(50, i - 1), sma(200, i - 1), sma(50, i), sma(200, i)
    if pos is None and p50 <= p200 and s50 > s200: pos = i + 1
    elif pos is not None and p50 >= p200 and s50 < s200:
        trades.append([pos, i + 1, round(((O[i + 1] / O[pos]) * (1 - fee) ** 2 - 1) * 100, 1)]); pos = None
assert pos is None
eq = 1.0
for t in trades: eq *= 1 + t[2] / 100
# mark-to-market equity, daily
val = 1.0; curve = []; k = 0; units = None
for i in range(n):
    if k < len(trades) and units is None and i == trades[k][0]: units = val * (1 - fee) / O[i]
    if units is not None:
        if i == trades[k][1]: val = units * O[i] * (1 - fee); units = None; k += 1; v = val
        else: v = units * C[i]
    else: v = val
    curve.append(v)
peak = 0; mdd = 0
for i, v in enumerate(curve):
    if v > peak: peak, pk = v, i
    if 1 - v / peak > mdd: mdd, a, z = 1 - v / peak, pk, i
bh = C[-1] / O[0]
print('trades', len(trades), 'wins', sum(t[2] > 0 for t in trades), 'total', round((eq - 1) * 100, 1), 'final curve', round(curve[-1], 3), 'bh', round((bh - 1) * 100, 1))
print('maxDD', round(mdd * 100, 1), D[a], round(curve[a], 3), D[z], round(curve[z], 3))
assert D[z] == '2020-03-12' and round(mdd * 100) == 67 and round((eq - 1) * 100) == 624 and round((bh - 1) * 100) == 539
# the rule window: 2019-01-01 .. 2020-01-31, with both averages
w0, w1 = idx['2019-01-01'], idx['2020-01-31'] + 1
rule = {'close': [round(C[i]) for i in range(w0, w1)], 'sma50': [round(sma(50, i)) for i in range(w0, w1)], 'sma200': [round(sma(200, i)) for i in range(w0, w1)],
        'buy': trades[0][0] - w0, 'sell': trades[0][1] - w0}
step = 1
lens = json.load(open('lens.json')); lines = json.load(open('lines.json'))
gaps = [0.35, 0.55, 0.3, 0.55, 0.35, 0.5, 0.4, 0.3, 0.35, 0.5, 0.4, 0.55, 0.45, 0.4]
place = [0.25]
for k in range(1, len(lens)): place.append(round(place[-1] + lens[k - 1] + gaps[k - 1], 3))
dur = round(place[-1] + lens[-1] + 2.0, 2)
json.dump({'place': place, 'lens': lens, 'dur': dur, 'lines': lines, 'step': step, 'n': n,
           'close': [round(C[i]) for i in range(0, n, step)], 'curve': [round(curve[i], 4) for i in range(0, n, step)],
           'trades': trades, 'peak': a, 'trough': z, 'final': round(eq, 3), 'bh': round(bh, 3), 'rule': rule}, open('data.json', 'w'), ensure_ascii=False)
print('dur', dur, [round(p, 2) for p in place])
