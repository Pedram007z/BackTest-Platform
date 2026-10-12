# r3 · «با پول واقعی تست می‌کنی؟ صبر کن!»: timeline (data.json) and score (sound.json) for the backtesting → profitability reel.
# The voice is t1.mp3 (Kourosh), cut with `python3 cut.py r3 t1 1.2 tight` into line01..10.wav (lens.json).
import json
r = lambda x: round(x, 2)
lens = json.load(open('lens.json'))
gaps = [0.32, 0.22, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.28]
place, t = [], 0.15
for k, L in enumerate(lens): place.append(round(t, 3)); t += L + (gaps[k] if k < len(gaps) else 0)
DUR = 54.3
lines = [
 ['اگه هنوز استراتژی‌هات رو با پولِ واقعی تست می‌کنی… صبر کن!', 'اگه هنوز استراتژی‌هات رو با پول واقعی تست می‌کنی… صبر کن!'],
 ['این گرون‌ترین راهِ یاد گرفتنه.', 'این گرون‌ترین راه یاد گرفتنه.'],
 ['یه چیزی رو کسی بهت نمی‌گه: هر استراتژی‌ای، حتی بهترینش، روزای بد داره.', 'یه چیزی رو کسی بهت نمی‌گه: هر استراتژی‌ای، حتی بهترینش، روزای بد داره.'],
 ['با پنجاه درصد برد، توی صد تا معامله، به احتمالِ هشتاد و یک درصد، پنج تا ضرر پشتِ هم می‌خوری.', 'با ۵۰٪ برد، توی ۱۰۰ معامله، به احتمال ۸۱٪، ۵ تا ضرر پشت هم می‌خوری.'],
 ['اگه اون روزا رو ندیده باشی، می‌ترسی… و درست قبل از این‌که جواب بده، ولش می‌کنی.', 'اگه اون روزا رو ندیده باشی، می‌ترسی… و درست قبل از این‌که جواب بده، ولش می‌کنی.'],
 ['بک‌تست یعنی اون روزا رو قبل از این‌که برسن ببینی؛ بدونِ ریسکِ حتی یه دلار.', 'بک‌تست یعنی اون روزا رو قبل از این‌که برسن ببینی؛ بدون ریسک حتی یه دلار.'],
 ['می‌فهمی درصدِ بردت چنده، بدترین افتِ حسابت چقدره، و کِی نباید بترسی.', 'می‌فهمی درصد بردت چنده، بدترین افت حسابت چقدره، و کی نباید بترسی.'],
 ['سودِ ثابت از استراتژیِ جادویی نمیاد؛ از شناختنِ استراتژیت میاد.', 'سود ثابت از استراتژی جادویی نمیاد؛ از شناختن استراتژیت میاد.'],
 ['ما یه پلتفرم ساختیم که این کارو روی فارکس، شاخص و کریپتو برات راحت می‌کنه؛ لینکش توی بیوئه.', 'ما یه پلتفرم ساختیم که این کارو روی فارکس، شاخص و کریپتو برات راحت می‌کنه؛ لینکش توی بیوئه.'],
 ['اگه می‌خوای سودت ثابت‌تر بشه، همین الان پیج رو فالو کن.', 'اگه می‌خوای سودت ثابت‌تر بشه، همین الان پیج رو فالو کن.'],
]
# word onsets in the finished voice-over (faster-whisper on vo.wav; can read ~0.1 s early)
M = dict(sabr=3.66, gerun=4.96, kasi=7.46, har=8.68, behtarin=10.28, bad=11.04, panjah=12.72, sad=14.32, hashtad=15.96, panj=17.32, zarar=17.88,
         mitarsi=20.62, ghabl=22.2, javab=22.88, velesh=23.58, backtest=24.42, ghabl2=26.46, bedun=28.22, dollar=29.9,
         darsad=31.22, badtarin=32.8, key=35.0, jadu=38.32, nemiad=38.84, shenakhtan=39.84, platform=42.14,
         forex=43.94, shakhes=44.76, crypto=45.48, link=47.56, sabet=49.44, follow=52.36)
# 100 coin-flip trades at 50%: one sample with exactly one run of 5 losses, inside a single row of the 10×10 grid
import random
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
json.dump({'place': place, 'lens': lens, 'dur': DUR, 'lines': lines, 'm': M, 'trades': seq, 'streak': streak}, open('data.json', 'w'), ensure_ascii=False)
print('seed', seed, 'wins', sum(seq), 'streak at', streak, 'place', place)

# ---- score: Dm minor, tense through the losses, lifts at «بک‌تست», full for the product and the follow ----
S = lambda k: place[k]
def note(n, o):
    N = {n_: 440 * 2 ** ((i - 9) / 12) for i, n_ in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}; return round(N[n] * 2 ** (o - 4), 2)
def chord(notes, root): return [[note(x[:-1], int(x[-1])) for x in notes.split()], note(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
for k in range(1, 10): add('whoosh', S(k) - 0.05, gain=0.26)
add('riser', 1.6, d=2.0, f0=200, f1=3000, gain=0.25); add('impact', M['sabr'], size=1.2, gain=0.85)          # the freeze on «صبر کن!»
add('downlifter', M['gerun'] - 0.2, d=1.6, gain=0.35); add('fail', S(1) + 1.4, gain=0.25)                  # the balance drains
add('pop', M['bad'], f=520, gain=0.3)
add('pop', M['panjah'], f=760, gain=0.28); add('pop', M['sad'], f=860, gain=0.28)
add('impact', M['hashtad'], size=0.9, gain=0.6)
for i in range(5): add('tick', M['panj'] + 0.12 * i, f=1500, level=0.45)
add('impact', M['zarar'] + 0.3, size=0.7, gain=0.5)
add('downlifter', S(4) + 0.1, d=1.4, gain=0.35); add('riser', M['ghabl'] - 0.2, d=1.2, f0=300, f1=4000, gain=0.28); add('fail', M['velesh'] + 0.05, gain=0.3)
add('bell', M['backtest'] + 0.1, f=1318.5, d=1.6, gain=0.3); add('pop', M['bedun'], f=880, gain=0.28)
for kk in ('darsad', 'badtarin', 'key'): add('pop', M[kk], f=820, gain=0.3)
add('fail', M['nemiad'], gain=0.25); add('bell', M['shenakhtan'], f=1046.5, d=1.6, gain=0.3)
for kk, f in (('forex', 760), ('shakhes', 860), ('crypto', 960)): add('pop', M[kk], f=f, gain=0.3)
add('pop', M['link'], f=900, gain=0.28)
add('impact', S(9), size=0.6, gain=0.45); add('pop', M['follow'], f=980, gain=0.35); add('bell', M['follow'] + 0.15, f=1318.5, d=2.0, gain=0.32)
sp = {'seed': 33, 'dur': DUR, 'grid0': 0.0, 'fade_from': r(DUR - 1.6), 'rolls': [], 'clap': [[r(S(5)), r(DUR - 1.6)]], 'bar': 2.2,
      'ticks': [{'start': r(S(3) + 1.7), 'dur': r(LN3 := lens[3] - 1.9), 'count': 20, 'f': 1500, 'step': 10, 'level': 0.1}],
      'chords': {'Dm': chord('A3 D4 F4 A4', 'D2'), 'Bb': chord('A3 D4 F4 A#4'.replace('A#4', 'A#4'), 'A#1'), 'F': chord('A3 C4 F4 A4', 'F2'), 'C': chord('G3 C4 E4 G4', 'C2')},
      'prog': ['Dm', 'Bb', 'F', 'C'],
      'groove': [[r(S(1)), r(S(4))], [r(S(5)), r(DUR - 1.6)]], 'full': [[r(S(8)), r(DUR - 1.6)]],
      'dark': [[0, r(S(5))]], 'arp': [[0, r(S(1))], [r(S(5)), r(DUR)]], 'hats': [[r(S(2)), r(S(4))], [r(S(6)), r(DUR - 1.6)]],
      'outro_bass': [r(DUR - 1.6), r(DUR)], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1); print('fx', len(fx))
