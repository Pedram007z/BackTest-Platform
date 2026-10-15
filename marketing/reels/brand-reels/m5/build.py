# m5 · «درد تریدر»: the stop that gets hit right before the price turns. Motion graphics on the user's take
# (voice/t1.mp3, 27.4 s, used whole) with a 0.8 s pause after line 4 so the backtest replay can land. Everything on
# screen is gold's real 1-minute and 30-minute prices around the US jobs report of 5 July 2024 (bars.json, from
# bars.py); the trade on them is one example: buy 2357, target 2373; A stops at 2349 (under the previous low 2350.36
# and the round 2350) with 1 lot, B at 2341 with 0.5 lot, so both risk $800.
#   python3 ../transcribe.py voice/t1.mp3 voice/t1.words.json && python3 build.py && python3 ../mkpage_b.py m5 && python3 sound.py
import json, subprocess
r = lambda x: round(x, 2)
w = json.load(open('voice/t1.words.json'))
LEAD, SPLIT, PAUSE, TAIL = 0.1, 19.75, 0.8, 1.75
sh = lambda t: t + LEAD + (PAUSE if t >= SPLIT else 0)
s, e = (lambda i: sh(w[i][0])), (lambda i: sh(w[i][1]))
SR = 48000
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice/t1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2', '-ar', str(SR), '-ac', '1', 'voice/t1-clean.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice/t1-clean.wav', '-filter_complex',
    f'[0]atrim=0:{SPLIT},afade=t=out:st={SPLIT - 0.03}:d=0.03,adelay={int(LEAD * 1000)}[a];[0]atrim={SPLIT},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,adelay={int((LEAD + SPLIT + PAUSE) * 1000)}[b];[a][b]amix=inputs=2:normalize=0',
    '-ar', str(SR), 'vo.wav'], check=True)

def words(text, idx):
    """On-screen words in the script's spelling, each timed to the spoken word (or a share of one: (i, from, to))."""
    out = []
    for word, i in zip(text.split(' '), idx):
        if isinstance(i, tuple): i, p0, p1 = i; a, b = s(i) + p0 * (e(i) - s(i)), s(i) + p1 * (e(i) - s(i))
        else: a, b = s(i), e(i)
        out.append([word, r(a), r(b)])
    return out
SAY = {
    'hook': words('حد ضرر می‌خوره… و دقیقاً بعدش قیمت برمی‌گرده.', [0, 1, 2, 3, 4, 5, 6, 8]),
    'fam1': words('آشناست؟', [9]),
    'fam2': words('بازار دنبال تو نیست.', [10, 11, 12, 13]),
    'zone1': words('حد ضررت رو همون‌جایی گذاشتی که همه می‌ذارن:', [14, 15, 16, 17, 19, 20, 21, 22]),
    'zone2': words('درست زیر کف قبلی، روی عدد رُند.', [23, 24, 25, 26, 27, 28, 29]),
    'bt': words('تو بک‌تست ببین حد ضرر یه کم دورتر، با حجم کمتر، چی کار می‌کنه.', [30, 31, 32, 33, 34, (35, 0, 0.5), (35, 0.5, 1), 36, 37, 38, 39, 40, 41, 42]),
    'share1': words('بفرستش برای رفیقی که', [43, 44, 45, 46]),
    'share2': words('همیشه یه پیپ قبل از برگشت استاپ می‌خوره.', [47, 48, 49, 50, 51, 52, 53, 54]),
    'cta': words('لینک توی بیو؛ هفت روز رایگان.', [55, 56, 57, 58, 59, 60]),
}
T = {'hook': 0.0, 'hit': s(2) + 0.12, 'back': s(4), 'fam': s(9) - 0.2, 'crowd': s(10), 'zone': s(14) - 0.15, 'all': s(21), 'low': s(25),
     'round': s(28), 'sweep': e(29) - 0.45, 'bt': s(30) - 0.12, 'far': s(35), 'size': s(38), 'run': s(39) + 0.5,
     'share': s(43) - 0.05, 'pip': s(48), 'cta': s(55) - 0.2, 'free': s(58)}
DUR = r(e(60) + TAIL)
B = json.load(open('bars.json'))
TRADE = {'entry': 2357.0, 'tp': 2373.0, 'a': {'sl': 2349.0, 'lot': 1.0}, 'b': {'sl': 2341.0, 'lot': 0.5}, 'oz': 100}
data = {'t': {k: r(v) for k, v in T.items()}, 'dur': DUR, 'say': SAY, 'trade': TRADE, **B,
        'place': [], 'lens': [], 'lines': []}
json.dump(data, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR); print({k: r(v) for k, v in T.items()})
