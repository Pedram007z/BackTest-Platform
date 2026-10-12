import json, datetime as dt
b = json.load(open('../data/btc_daily.json'))
D = [str(dt.datetime.fromtimestamp(x[0] / 1000, dt.UTC).date()) for x in b]; idx = {d: i for i, d in enumerate(D)}
i0, i1 = idx['2020-01-15'], idx['2020-04-05'] + 1
ohlc = [[round(v, 2) for v in x[1:5]] for x in b[i0:i1]]
crash = idx['2020-03-12'] - i0
lens = json.load(open('lens.json')); lines = json.load(open('lines.json'))
gaps = [0.35, 0.4, 0.35, 0.45, 0.45, 0.45, 0.4, 0.4, 0.55, 0.45, 0.35, 0.4]
place = [0.25]
for k in range(1, len(lens)): place.append(round(place[-1] + lens[k - 1] + gaps[k - 1], 3))
dur = round(place[-1] + lens[-1] + 1.8, 2)
json.dump({'place': place, 'lens': lens, 'dur': dur, 'lines': lines, 'ohlc': ohlc, 'crash': crash, 'd0': D[i0], 'btc': [round(x[4]) for x in b[::4]], 'btcStep': 4}, open('data.json', 'w'), ensure_ascii=False)
print('dur', dur, 'crash', crash, ohlc[crash], [round(p, 2) for p in place])
