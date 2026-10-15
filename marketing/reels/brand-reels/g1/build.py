# g1 · «زیر ۳۰ بخر، بالای ۷۰ بفروش»: the RSI 30/70 rule tested on 11 years of real gold prices (music only, 18 s).
# gold.json comes from reeldata.py (bt.py's backtest on XAUUSD 1-minute history from the platform's store, 2015-01 .. 2026-10):
# 550 trades, win rate 61.3%, account -59.0% (max drawdown 74.0%), buy-and-hold +246.9%; with a $0.30 spread: -62.9%.
import json
r = lambda x: round(x, 2)
g = json.load(open('gold.json')); g['buy_hold_pct'] = json.load(open('results.json'))['buy_hold_pct']
T = {'hook': 0.0, 'run': 2.2, 'tease': 6.4, 'reveal': 8.0, 'compare': 11.6, 'cta': 14.2}
DUR = 18.0
json.dump({'t': T, 'dur': DUR, 'place': [], 'lens': [], 'lines': [], **g}, open('data.json', 'w'))

NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
add('impact', 0.02, size=0.6, gain=0.5)
for k, t in enumerate([0.55, 0.95, 1.35]): add('pop', t, f=760 + 140 * k, gain=0.28)          # BUY / SELL marks on the RSI
add('whoosh', T['run'], gain=0.4)
add('impact', T['tease'], size=0.7, gain=0.55); add('bell', T['tease'] + 0.05, f=1318.5, d=1.2, gain=0.3)
add('riser', T['tease'] + 0.6, d=1.0, f0=300, f1=5000, gain=0.3)
add('impact', T['reveal'] + 0.05, size=1.0, gain=0.8); add('fail', T['reveal'] + 1.5, gain=0.35)
add('whoosh', T['compare'], gain=0.35); add('bell', T['compare'] + 1.1, f=1568.0, d=1.6, gain=0.3)
add('whoosh', T['cta'], gain=0.35); add('pop', T['cta'] + 1.3, f=980, gain=0.35)
sp = {'seed': 71, 'dur': DUR, 'grid0': 0.0, 'bar': 2.0, 'fade_from': r(DUR - 0.5),
      'ticks': [{'start': r(T['run'] + 0.3), 'dur': 3.6, 'count': 40, 'f': 1400, 'step': 6, 'level': 0.07}],
      'chords': {'Am': chord('A3 C4 E4 A4', 'A1'), 'F': chord('A3 C4 F4 A4', 'F1'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')},
      'prog': ['Am', 'F', 'C', 'G'],
      'groove': [[0.0, T['reveal']], [T['compare'], DUR]], 'full': [[T['run'], T['tease']], [T['cta'], DUR]],
      'dark': [[T['reveal'], T['compare']]], 'arp': [[0, DUR]],
      'hats': [[T['run'], T['reveal']], [T['compare'], DUR]], 'clap': [[T['run'], T['tease']], [T['cta'], DUR]],
      'outro_bass': [DUR, DUR], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'fx', len(fx), 'stats', g['stats'])
