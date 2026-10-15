# g1 · «زیر ۳۰ بخر، بالای ۷۰ بفروش»: the RSI 30/70 rule tested on 11 years of real gold prices (music only, 18 s).
# gold.json comes from reeldata.py (bt.py's backtest on XAUUSD 1-minute history from the platform's store, 2015-01 .. 2026-10):
# 550 trades, win rate 61.3%, account -59.0% (max drawdown 74.0%), buy-and-hold +246.9%; with a $0.30 spread: -62.9%.
import json
r = lambda x: round(x, 2)
g = json.load(open('gold.json')); g['buy_hold_pct'] = json.load(open('results.json'))['buy_hold_pct']
T = {'hook': 0.0, 'run': 2.2, 'tease': 6.4, 'reveal': 8.0, 'compare': 11.6, 'cta': 14.2}
DUR = 18.0
json.dump({'t': T, 'dur': DUR, 'place': [], 'lens': [], 'lines': [], **g}, open('data.json', 'w'))

from score import TB, score
sp = score(T, DUR)
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'fx', len(sp['fx']), 'stats', g['stats'])
