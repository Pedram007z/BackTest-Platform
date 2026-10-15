# Data for the sample reel: gold daily closes, the H1 "RSI 30/70 both ways" trades and equity, and a short RSI window.
import json, math
exec(open('bt.py').read().split("res = {}")[0])   # reuse loaders, rsi() and run()
c1 = [b[4] for b in H1]; r1 = rsi(c1)
# trades of the H1 both-ways rule (entry index, side)
pos, entries = 0, []
for i in range(15, len(H1)):
    if r1[i] < 30 and pos != 1: pos = 1; entries.append((H1[i][0], 1))
    elif r1[i] > 70 and pos != -1: pos = -1; entries.append((H1[i][0], -1))
m, curve = run(H1, 'both')
# with a $0.30 round-turn cost per trade (spread), for the caption's honesty note
def run_cost(cost):
    pos, entry, eq = 0, 0.0, 1.0
    for i in range(15, len(H1)):
        px = c1[i]
        if r1[i] < 30 and pos != 1:
            if pos == -1: eq *= (entry - cost) / px
            pos, entry = 1, px
        elif r1[i] > 70 and pos != -1:
            if pos == 1: eq *= (px - cost) / entry
            pos, entry = -1, px
    return eq * ((c1[-1] / entry) if pos == 1 else (entry / c1[-1]))
eq_cost = run_cost(0.30)
daily = [[b[0], round(b[4], 2)] for b in D1]
eqd = [[t, round(v, 4)] for t, v in curve[:: max(1, len(curve) // 500)]]
# an RSI window with both a dip under 30 and a push over 70 (last 2 weeks of April 2025 on H1)
t0 = int(datetime(2025, 4, 14, tzinfo=timezone.utc).timestamp()); t1 = int(datetime(2025, 4, 30, tzinfo=timezone.utc).timestamp())
win = [[H1[i][0], H1[i][1], H1[i][2], H1[i][3], H1[i][4], round(r1[i], 1)] for i in range(len(H1)) if t0 <= H1[i][0] <= t1]
json.dump({'daily': daily, 'equity': eqd, 'entries': entries, 'rsi_window': win, 'stats': m, 'eq_with_cost': round(eq_cost, 4)}, open('reel.json', 'w'))
print('trades', len(entries), m, 'eq with $0.30 cost', round(eq_cost, 3), 'window bars', len(win),
      'rsi<30', sum(1 for w in win if w[5] < 30), 'rsi>70', sum(1 for w in win if w[5] > 70))
