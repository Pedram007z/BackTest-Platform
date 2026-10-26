# k1: data.json = the voice timing (voice/timing.json) + the real example the drawdown scenes use: the breakout rule on
# gold 4-hour candles from z1 (../z1/data.py: 755 trades, 2015–2026, spread and commission included). From its trades in
# order it keeps the equity curve in R, its deepest drawdown (peak and trough) and its longest losing streak; then the
# same sequence is replayed with a fixed share of the balance at risk on every trade (2%, 1%, 0.5%, 0.25%), and the largest
# fall from a high is measured in percent, as a prop challenge measures it.   python3 data.py
import json
z = json.load(open('../z1/data.json'))['strat']; R = z['R']
eq = [0.0]
for r in R: eq.append(eq[-1] + r)
peak = dd = 0.0; pk = pi = ti = 0
for i, v in enumerate(eq):
    if v > eq[pk]: pk = i
    if eq[pk] - v > dd: dd, pi, ti = eq[pk] - v, pk, i
def max_dd_pct(risk):
    bal = hi = 1.0; worst = 0.0
    for r in R:
        bal *= 1 + r * risk; hi = max(hi, bal); worst = max(worst, 1 - bal / hi)
    return worst
step = max(1, len(eq) // 300)
ex = {'n': len(R), 'eq': [round(v, 2) for v in eq[::step]], 'step': step, 'dd': round(dd, 1), 'ddPeak': pi, 'ddTrough': ti,
      'streak': z['maxL'], 'streakAt': z['maxL_at'], 'total': round(eq[-1], 1),
      'ladder': [[r, round(max_dd_pct(r / 100) * 100, 1)] for r in (2, 1, 0.5, 0.25)]}      # risk % per trade → largest fall %
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'ex': ex}, open('data.json', 'w'), ensure_ascii=False)
print(f"{ex['n']} trades; deepest drawdown {ex['dd']}R (trade {pi} → {ti}); longest losing streak {ex['streak']} (from trade {ex['streakAt']});"
      f" largest fall by risk per trade: {ex['ladder']}")
