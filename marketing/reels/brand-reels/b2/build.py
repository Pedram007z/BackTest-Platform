# b2 · «۹۰٪ تریدرها این اشتباه رو می‌کنن…»: judging a strategy after 20 trades. Timeline (data.json), voice (vo.wav), score (sound.json).
# The voice is the user's own take t1.mp3, cut with `python3 cut.py b2 t1 1.0 tight` (lens.json).
import json, random, sys
sys.path.insert(0, '..')
from bcommon import timeline, voice, markers
r = lambda x: round(x, 2)

place, lens, DUR = timeline([0.3, 0.2, 0.26, 0.22, 0.2, 0.24, 0.24, 0.26, 0.22, 0.22, 0.2])
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'nood': ('90', 0), 'to': ('=تو', 0),
    'bist1': ('20', 1), 'ghezavat': ('قضاوت', 1),
    'khub': ('خوب', 2), 'hamine': ('همینه', 2), 'bad': ('=بد', 2), 'badi': ('بعدی', 2),
    'kasi': ('کسی', 3),
    'panjah': ('50', 4), 'bist4': ('20', 4), 'si': ('30', 4), 'haftad': ('70', 4),
    'hichi': ('هیچی', 5),
    'pansad6': ('500', 6), 'chehel': ('45', 6), 'panjah5': ('55', 6),
    'pansad7': ('500', 7), 'sal': ('سال', 7),
    'sari': ('سری', 8), 'montazer': ('منتظر', 8),
    'ruzi': ('روزی', 9), 'candle': ('کندل', 9), 'amar': ('آمار', 9),
    'link': ('لینک', 10), 'raygan': ('گان', 10),
    'follow': ('فالو', 11),
}, place, lens)

# 30 traders with the same strategy (a true 50% win rate): their win rate after 20 trades and after 500.
# Picked so the 20-trade spread runs exactly from 30% to 70% (as the voice says) and all 500-trade results sit in 45–55%.
# (The chance of landing in 30–70% after 20 trades is 95.9%, in 45–55% after 500 trades 97.8%: tools/verify_numbers.py.)
for seed in range(1, 200000):
    rnd = random.Random(seed)
    w20 = [sum(rnd.random() < 0.5 for _ in range(20)) * 5 for _ in range(30)]
    if min(w20) == 30 and max(w20) == 70 and w20.count(30) == 1 and w20.count(70) == 1: break
for seed2 in range(1, 200000):
    rnd = random.Random(10_000 + seed2)
    w500 = [round(sum(rnd.random() < 0.5 for _ in range(500)) / 5, 1) for _ in range(30)]
    if 45 <= min(w500) and max(w500) <= 55: break

json.dump({'place': place, 'lens': lens, 'dur': DUR, 'lines': lines, 'm': M, 'w20': w20, 'w500': w500}, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR, 'seeds', seed, seed2, 'w20', sorted(w20), 'w500', min(w500), max(w500), 'markers', M)

# ---- score: E minor; a confident hook, the doubt in the middle, lifts at backtesting, full for the app and the end ----
S = lambda k: place[k]
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
for k in range(1, 12): add('whoosh', S(k) - 0.05, gain=0.24)
add('impact', M['nood'] - 0.05, size=1.0, gain=0.7); add('pop', M['to'], f=880, gain=0.3)
add('impact', M['ghezavat'], size=0.8, gain=0.6)                                     # the gavel
add('bell', M['hamine'], f=1318.5, d=1.2, gain=0.25); add('fail', M['badi'], gain=0.28)
add('riser', S(3) - 0.2, d=r(LN3 := place[4] - place[3]), f0=250, f1=4000, gain=0.25)
add('pop', M['panjah'], f=760, gain=0.28); add('pop', M['bist4'], f=860, gain=0.28)
add('impact', M['si'], size=0.5, gain=0.4); add('impact', M['haftad'], size=0.5, gain=0.4)
add('fail', M['hichi'], gain=0.25)
add('bell', M['chehel'], f=1046.5, d=1.6, gain=0.3)
add('pop', M['pansad7'], f=760, gain=0.28); add('impact', M['sal'], size=0.7, gain=0.5)
add('riser', M['sari'] - 0.3, d=1.2, f0=300, f1=6000, gain=0.3); add('bell', M['montazer'], f=1318.5, d=1.6, gain=0.28)
for kk, fr in (('ruzi', 760), ('candle', 860), ('amar', 960)): add('pop', M[kk], f=fr, gain=0.3)
add('pop', M['link'], f=760, gain=0.28); add('pop', M['raygan'], f=900, gain=0.3)
FP = max(M['follow'] + 0.9, S(11) + 1.0)
add('impact', S(11), size=0.6, gain=0.45); add('pop', FP, f=980, gain=0.35); add('bell', FP + 0.15, f=1318.5, d=2.0, gain=0.32)
sp = {'seed': 52, 'dur': DUR, 'grid0': 0.0, 'fade_from': r(DUR - 1.4), 'rolls': [[r(S(8) - 0.9), r(S(8))]], 'bar': 2.2,
      'ticks': [{'start': r(M['bist1'] - 0.2), 'dur': 1.2, 'count': 20, 'f': 1500, 'step': 12, 'level': 0.09},
                {'start': r(M['bist4']), 'dur': 1.6, 'count': 30, 'f': 1400, 'step': 10, 'level': 0.08},
                {'start': r(M['pansad7']), 'dur': 1.4, 'count': 12, 'f': 1300, 'step': 30, 'level': 0.12}],
      'chords': {'Em': chord('G3 B3 E4 G4', 'E2'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1'), 'D': chord('F#3 A3 D4 F#4', 'D2')},
      'prog': ['Em', 'C', 'G', 'D'],
      'groove': [[r(S(0) + 0.6), r(S(3))], [r(S(4)), r(S(8))], [r(S(8)), r(DUR - 1.4)]], 'full': [[r(S(8)), r(DUR - 1.4)]],
      'dark': [[r(S(3)), r(S(4))], [r(S(5)), r(S(6))]], 'arp': [[0, r(DUR)]],
      'hats': [[r(S(1)), r(S(3))], [r(S(6)), r(DUR - 1.4)]], 'clap': [[r(S(8)), r(DUR - 1.4)]],
      'outro_bass': [r(DUR - 1.4), r(DUR)], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1); print('fx', len(fx))
