# b3 · «قبل از اینکه پوزیشن باز کنی، اینو بدون»: the worst days and the risk per trade. Timeline (data.json), voice (vo.wav), score (sound.json).
# The voice is the user's own take t1.mp3, cut with `python3 cut.py b3 t1 1.0 tight` (lens.json).
import json, random, sys
sys.path.insert(0, '..')
from bcommon import timeline, voice, markers
r = lambda x: round(x, 2)

place, lens, DUR = timeline([0.3, 0.24, 0.26, 0.24, 0.22, 0.26, 0.22, 0.26, 0.22, 0.22, 0.2])
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'position': ('پوزیشن', 0), 'bedun': ('بدون', 0),
    'badtarin1': ('بدترین', 1), 'behtarin': ('بهترینش', 1), 'badtarinesh': ('=بدترینش', 1),
    'hashta': ('هشتا', 2),
    'si5': ('35', 3), 'sad': ('=صد', 3), 'haftad': ('70', 3),
    'yek': ('=1', 4), 'hasht': ('=8', 4), 'ghabel': ('قابل', 4),
    'dah': ('10', 5), 'nesf': ('نصف', 5),
    'hamun': ('همون', 6), 'adad': ('عدد', 6),
    'test': ('تستش', 7),
    'backtest': ('بکتست', 8), 'badtarin8': ('بدترین', 8), 'risk8': ('ریسک', 8),
    'hajm': ('حجم', 9), 'akharesh': ('آخرش', 9), 'bishtarin': ('بیشترین', 9),
    'link': ('لینکش', 10), 'raygan': ('رایگان', 10),
    'follow': ('فالو', 11),
}, place, lens)

# 100 trades at 35% wins: a sample whose longest losing run is exactly 8, inside one row of the 10×10 grid
# (8+ losses in a row within 100 trades at 35% has a 69% chance: tools/verify_numbers.py)
def runs(seq):
    out, i = [], 0
    while i < len(seq):
        if seq[i] == 0:
            j = i
            while j < len(seq) and seq[j] == 0: j += 1
            out.append((i, j - i)); i = j
        else: i += 1
    return out
for seed in range(1, 200000):
    rnd = random.Random(seed); seq = [1 if rnd.random() < 0.35 else 0 for _ in range(100)]
    rs = runs(seq); big = [x for x in rs if x[1] >= 6]
    if 33 <= sum(seq) <= 37 and len(big) == 1 and big[0][1] == 8 and 30 <= big[0][0] and big[0][0] % 10 <= 2: break
streak = big[0][0]
dd = {p: round((1 - (1 - p / 100) ** 8) * 100, 1) for p in (1, 10)}   # 8 losses in a row: 7.7% at 1% risk, 57.0% at 10%

json.dump({'place': place, 'lens': lens, 'dur': DUR, 'lines': lines, 'm': M, 'trades': seq, 'streak': streak, 'dd': dd}, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR, 'seed', seed, 'wins', sum(seq), 'streak at', streak, 'dd', dd, 'markers', M)

# ---- score: D minor; a warning hook, dark through the losses and the 10% account, lifts at backtesting, full for the app and the end ----
S = lambda k: place[k]
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
for k in range(1, 12): add('whoosh', S(k) - 0.05, gain=0.24)
add('impact', M['bedun'], size=0.9, gain=0.6)
add('pop', M['behtarin'], f=880, gain=0.28); add('impact', M['badtarinesh'], size=0.8, gain=0.55)
for i in range(8): add('tick', M['hashta'] + 0.14 * i, f=1300 + 60 * i, level=0.4)
add('impact', M['hashta'] + 1.15, size=0.7, gain=0.5)
add('pop', M['si5'], f=760, gain=0.28); add('pop', M['sad'], f=860, gain=0.28); add('impact', M['haftad'], size=0.9, gain=0.6)
add('bell', M['ghabel'], f=1046.5, d=1.4, gain=0.28)
add('downlifter', M['dah'], d=1.8, gain=0.45); add('fail', M['nesf'], gain=0.3)
add('pop', M['adad'], f=900, gain=0.3)
add('bell', M['test'], f=1174.66, d=1.4, gain=0.25)
add('bell', M['backtest'] + 0.05, f=1318.5, d=1.6, gain=0.3); add('pop', M['badtarin8'], f=760, gain=0.28); add('pop', M['risk8'], f=880, gain=0.28)
for kk, fr in (('hajm', 760), ('bishtarin', 900)): add('pop', M[kk], f=fr, gain=0.3)
add('pop', M['link'], f=760, gain=0.28); add('pop', M['raygan'], f=900, gain=0.3)
FP = max(M['follow'] + 0.9, S(11) + 1.0)
add('impact', S(11), size=0.6, gain=0.45); add('pop', FP, f=980, gain=0.35); add('bell', FP + 0.15, f=1318.5, d=2.0, gain=0.32)
sp = {'seed': 63, 'dur': DUR, 'grid0': 0.0, 'fade_from': r(DUR - 1.4), 'rolls': [[r(S(8) - 0.9), r(S(8))]], 'bar': 2.2,
      'ticks': [{'start': r(M['sad'] - 0.1), 'dur': 1.6, 'count': 24, 'f': 1500, 'step': 10, 'level': 0.08}],
      'chords': {'Dm': chord('A3 D4 F4 A4', 'D2'), 'Bb': chord('A#3 D4 F4 A#4', 'A#1'), 'F': chord('A3 C4 F4 A4', 'F2'), 'C': chord('G3 C4 E4 G4', 'C2')},
      'prog': ['Dm', 'Bb', 'F', 'C'],
      'groove': [[r(S(1)), r(S(5))], [r(S(6)), r(DUR - 1.4)]], 'full': [[r(S(8)), r(DUR - 1.4)]],
      'dark': [[0, r(S(1))], [r(S(2)), r(S(4))], [r(S(5)), r(S(6))]], 'arp': [[0, r(DUR)]],
      'hats': [[r(S(3)), r(S(5))], [r(S(7)), r(DUR - 1.4)]], 'clap': [[r(S(8)), r(DUR - 1.4)]],
      'outro_bass': [r(DUR - 1.4), r(DUR)], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1); print('fx', len(fx))
