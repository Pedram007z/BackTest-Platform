# b1 · «ترید رو شروع نکن اگه…»: timeline (data.json), voice track (vo.wav) and score (sound.json).
# The voice is the user's own take t1.mp3, cut with `python3 cut.py b1 t1 1.0 tight` (lens.json).
import json, random, sys
sys.path.insert(0, '..')
from bcommon import timeline, voice, markers
r = lambda x: round(x, 2)

place, lens, DUR = timeline([0.32, 0.18, 0.26, 0.22, 0.3, 0.26, 0.24, 0.26, 0.22, 0.22, 0.2])
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'nakon': ('نکن', 0), 'age': ('اگه', 0), 'sad0': ('=صد', 0),
    'sad1': ('=صد', 1), 'shanse': ('شانسه', 2), 'adade': ('عدده', 2),
    'do': ('=دو', 3), 'sood': ('سود', 3), 'vaghei': ('واقعی', 3),
    'se': ('=سه', 4), 'dur': ('دور', 4),
    'panjah': ('پنجاه', 5), 'sad5': ('=صد', 5), 'panj': ('=پنج', 5), 'hashtad': ('هشتاد', 5),
    'adi': ('عادی', 6), 'khabar': ('خبر', 6),
    'backtest': ('بکتست', 7), 'rial': ('ریال', 7),
    'candle': ('کندل', 8), 'ayande': ('آینده', 8),
    'moamele': ('معامله', 9), 'journal': ('نال', 9), 'amar': ('آمار', 9),
    'link': ('لینکش', 10), 'raygan': ('رایگانه', 10),
    'follow': ('فالو', 11),
}, place, lens)

# 100 coin-flip trades at 50%: a sample with exactly one run of 5 losses, inside a single row of the 10×10 grid
def runs(seq):
    out, i = [], 0
    while i < len(seq):
        if seq[i] == 0:
            j = i
            while j < len(seq) and seq[j] == 0: j += 1
            out.append((i, j - i)); i = j
        else: i += 1
    return out
for seed in range(1, 100000):
    rnd = random.Random(seed); seq = [1 if rnd.random() < 0.5 else 0 for _ in range(100)]
    rs = runs(seq); big = [x for x in rs if x[1] >= 5]
    if sum(seq) in (49, 50, 51) and len(big) == 1 and big[0][1] == 5 and 40 <= big[0][0] and big[0][0] % 10 <= 5 and max(l for _, l in rs if l < 5) <= 3: break
streak = big[0][0]

# the replay scene: real Bitcoin daily candles (Binance BTC/USDT), 1 April to 9 July 2019
import datetime as dt
day = lambda ms: dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc).date().isoformat()
btc = [[r(o), r(h), r(l), r(c)] for ts, o, h, l, c in json.load(open('../data/btc_daily.json')) if '2019-04-01' <= day(ts) <= '2019-07-09']
json.dump({'place': place, 'lens': lens, 'dur': DUR, 'lines': lines, 'm': M, 'trades': seq, 'streak': streak, 'btc': btc}, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR, 'seed', seed, 'streak at', streak, 'markers', M)

# ---- score: A minor; tense hook, dark through the three losses, lifts at «عادی» and «بک‌تست», full for the app and the end ----
S = lambda k: place[k]
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
for k in range(1, 12): add('whoosh', S(k) - 0.05, gain=0.24)
add('impact', M['nakon'] - 0.05, size=1.1, gain=0.75)                               # «شروع نکن»
add('pop', M['sad0'], f=760, gain=0.28)
add('impact', M['sad1'], size=0.7, gain=0.5)                                         # one dot becomes 100
add('bell', M['shanse'], f=987.77, d=1.2, gain=0.22); add('bell', M['adade'], f=1318.5, d=1.6, gain=0.3)
add('pop', M['do'], f=820, gain=0.3); add('pop', M['do'] + 0.35, f=920, gain=0.3); add('riser', M['sood'], d=r(max(0.6, M['vaghei'] - M['sood'])), f0=300, f1=4000, gain=0.25)
add('impact', M['vaghei'] + 0.2, size=0.6, gain=0.45)
for i in range(3): add('impact', M['se'] + 0.45 * i, size=0.55, gain=0.45)          # three losses
add('downlifter', M['dur'] - 0.4, d=1.4, gain=0.4); add('fail', M['dur'] + 0.1, gain=0.3)
add('pop', M['panjah'], f=760, gain=0.28); add('pop', M['sad5'], f=860, gain=0.28)
for i in range(5): add('tick', M['panj'] + 0.12 * i, f=1500, level=0.45)
add('impact', M['hashtad'], size=0.9, gain=0.6)
add('bell', M['adi'], f=1046.5, d=1.6, gain=0.3)
add('bell', M['backtest'] + 0.05, f=1318.5, d=1.6, gain=0.3); add('pop', M['rial'], f=880, gain=0.3)
add('riser', S(8) - 1.0, d=1.0, f0=300, f1=5000, gain=0.25)
for kk, fr in (('moamele', 760), ('journal', 860), ('amar', 960)): add('pop', M[kk], f=fr, gain=0.3)
add('pop', M['raygan'], f=900, gain=0.3); add('pop', M['link'], f=760, gain=0.28)
FP = max(M['follow'] + 0.9, S(11) + 1.0)   # the follow button is pressed once its card is up
add('impact', S(11), size=0.6, gain=0.45); add('pop', FP, f=980, gain=0.35); add('bell', FP + 0.15, f=1318.5, d=2.0, gain=0.32)
sp = {'seed': 41, 'dur': DUR, 'grid0': 0.0, 'fade_from': r(DUR - 1.4), 'rolls': [[r(S(8) - 0.9), r(S(8))]], 'bar': 2.2,
      'ticks': [{'start': r(M['sad1'] + 0.05), 'dur': 0.9, 'count': 20, 'f': 1500, 'step': 12, 'level': 0.09},
                {'start': r(M['sad5'] - 0.1), 'dur': 1.6, 'count': 24, 'f': 1500, 'step': 10, 'level': 0.09}],
      'chords': {'Am': chord('A3 C4 E4 A4', 'A2'), 'F': chord('A3 C4 F4 A4', 'F2'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')},
      'prog': ['Am', 'F', 'C', 'G'],
      'groove': [[r(S(1)), r(S(4))], [r(S(6)), r(DUR - 1.4)]], 'full': [[r(S(8)), r(DUR - 1.4)]],
      'dark': [[0, r(S(1))], [r(S(4)), r(S(6))]], 'arp': [[0, r(S(4))], [r(S(6)), r(DUR)]],
      'hats': [[r(S(2)), r(S(4))], [r(S(7)), r(DUR - 1.4)]], 'clap': [[r(S(8)), r(DUR - 1.4)]],
      'outro_bass': [r(DUR - 1.4), r(DUR)], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1); print('fx', len(fx))
