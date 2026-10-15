# Find a clean ~110-bar H1 window (2024-2026) with one RSI dip under 30 and one push over 70, buy before sell.
import json
exec(open('bt.py').read().split("res = {}")[0])
c1 = [b[4] for b in H1]; r1 = rsi(c1)
best = None
start = next(i for i, b in enumerate(H1) if b[0] >= 1704067200)
for s in range(start, len(H1) - 110, 6):
    e = s + 110; seg = r1[s:e]
    downs = [i for i in range(s + 1, e) if r1[i] < 30 <= r1[i - 1]]; ups = [i for i in range(s + 1, e) if r1[i] > 70 >= r1[i - 1]]
    if len(downs) == 1 and len(ups) == 1 and 20 < ups[0] - downs[0] < 70 and downs[0] - s > 15 and e - ups[0] > 10:
        score = (30 - min(seg)) + (max(seg) - 70)
        if best is None or score > best[0]: best = (score, s, e, downs[0], ups[0])
_, s, e, d, u = best
win = [[H1[i][0], H1[i][1], H1[i][2], H1[i][3], H1[i][4], round(r1[i], 1)] for i in range(s, e)]
g = json.load(open('reel.json')); g['rsi_window'] = win; json.dump(g, open('reel.json', 'w'))
print('window', datetime.fromtimestamp(H1[s][0], timezone.utc), '→', datetime.fromtimestamp(H1[e - 1][0], timezone.utc), 'buy at', d - s, 'rsi', round(r1[d], 1), 'sell at', u - s, 'rsi', round(r1[u], 1), 'price', H1[d][4], '→', H1[u][4])
