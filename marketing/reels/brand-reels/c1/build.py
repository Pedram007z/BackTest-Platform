import json, datetime as dt
b = json.load(open('../data/btc_daily.json'))
D = [str(dt.datetime.fromtimestamp(x[0] / 1000, dt.UTC).date()) for x in b]; idx = {d: i for i, d in enumerate(D)}
i0, i1 = idx['2021-06-01'], idx['2024-03-31'] + 1
close = [round(x[4]) for x in b[i0:i1]]
top, low, rec = idx['2021-11-08'] - i0, idx['2022-11-21'] - i0, idx['2024-03-04'] - i0
assert max(close[:top + 1]) == close[top] and all(c < close[top] for c in close[top + 1:rec]) and close[rec] >= close[top]
lens = json.load(open('lens.json')); lines = json.load(open('lines.json'))
gaps = [0.35, 0.4, 0.65, 0.35, 0.5, 0.55, 0.35, 0.3, 0.8, 0.4, 0.65, 0.5, 0.5, 0.4]
place = [0.25]
for k in range(1, len(lens)): place.append(round(place[-1] + lens[k - 1] + gaps[k - 1], 3))
dur = round(place[-1] + lens[-1] + 2.0, 2)
json.dump({'place': place, 'lens': lens, 'dur': dur, 'lines': lines, 'close': close, 'top': top, 'low': low, 'rec': rec,
           'dates': [D[i0], D[i1 - 1]]}, open('data.json', 'w'), ensure_ascii=False)
print('dur', dur, 'top', top, close[top], 'low', low, close[low], 'rec', rec, close[rec], 'days', (dt.date.fromisoformat(D[rec + i0]) - dt.date.fromisoformat(D[top + i0])).days)
print([round(p, 2) for p in place])
