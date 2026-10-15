# e3, voiced: the user's take (t1.mp3, 26 s, used whole) with a 1.1 s pause added after «۱۴۵ تا شنبه گذشت» for the freeze.
# The recording opens «مهر ماه ۱۴۰۲ بود» and keeps «۲۰۴۵ دلار» and «۱۴۵ تا شنبه» (the user chose to keep the take as
# recorded), so the reel starts on Saturday 1 Mehr 1402 and shows those two figures as spoken; the climb after that
# is gold's real monthly closes from the music version's data. Scene times come from the take's word timings.
#   python3 ../../transcribe.py t1.mp3 t1.words.json && python3 build.py && python3 ../../mkpage_e.py e3/voice && python3 sound.py
import json, subprocess
r = lambda x: round(x, 2)
w = json.load(open('t1.words.json'))
LEAD, SPLIT, PAUSE = 0.15, 21.12, 1.1
sh = lambda t: t + LEAD + (PAUSE if t >= SPLIT else 0)
s, e = (lambda i: sh(w[i][0])), (lambda i: sh(w[i][1]))
SR = 48000
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 't1.mp3', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2', '-ar', str(SR), '-ac', '1', 't1-clean.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 't1-clean.wav', '-filter_complex',
    f'[0]atrim=0:{SPLIT},afade=t=out:st={SPLIT - 0.03}:d=0.03,adelay={int(LEAD * 1000)}[a];[0]atrim={SPLIT},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,adelay={int((LEAD + SPLIT + PAUSE) * 1000)}[b];[a][b]amix=inputs=2:normalize=0',
    '-ar', str(SR), 'vo.wav'], check=True)

def words(text, idx):
    out = []
    for word, i in zip(text.split(' '), idx):
        if isinstance(i, tuple): i, part = i; a = s(i) + part * (e(i) - s(i)); b = a + 0.5 * (e(i) - s(i))
        else: a, b = s(i), e(i)
        out.append([word, r(a), r(b)])
    return out
SUBS = [
    words('مهر ماه ۱۴۰۲ بود. گفتم از شنبه شروع می‌کنم.', [(0, 0.0), (0, 0.5), 1, 2, 3, 4, 5, 6, 7]),
    words('طلا اون روز ۲۰۴۵ دلار بود.', range(9, 15)),
    words('هر هفته یه بهونه داشتم.', range(15, 20)),
    words('بقیه داشتن تمرین می‌کردن، داشتن جلو می‌رفتن.', [20, 21, 22, 23, 25, 26, 27]),
    words('و من هنوز منتظر شنبه بودم.', range(29, 35)),
    words('طلا دو برابر شد.', range(35, 39)),
]
T = {'said': s(3), 'room': s(9) - 0.1, 'price': s(12), 'lapse': s(15) - 0.1, 'double': s(36), 'freeze': e(38) + 0.12, 'n145': s(39),
     'turn': s(43) - 0.2, 'market': s(43), 'end': s(49) - 0.15, 'tonight': s(49), 'na': s(52), 'logo': e(53) + 0.4}
T['lid'] = T['turn'] + 0.6
DUR = r(T['logo'] + 2.1)
base = json.load(open('../data.json'))
steps = base['steps']; n = len(steps)
for k, st in enumerate(steps):   # one Saturday per step, faster and faster, the last one on «دو برابر»
    x = k / (n - 1); st['t'] = r(T['lapse'] + 0.15 + (T['double'] - T['lapse'] - 0.15) * (1 - (1 - x) ** 1.7))
data = {**base, 't': {k: r(v) for k, v in T.items()}, 'dur': DUR, 'steps': steps, 'voice': True, 'subs': SUBS,
        'start': {'day': '۱', 'month': 'مهر', 'year': '۱۴۰۲', 'label': 'مهر ۱۴۰۲', 'note': '۱۴۰۲/۰۷/۰۱', 'hook': 'مهر ماه ۱۴۰۲.'},
        'p0': 2045, 'saturdays': 145, 'gain': round((base['last']['price'] / 2045 - 1) * 100),
        'bub': [r(s(20)), r(s(22) + 0.1), r(s(25))], 'bubLife': 1.25}
json.dump(data, open('data.json', 'w'), ensure_ascii=False)
print('dur', DUR); print({k: r(v) for k, v in T.items()}); print('steps', [st['t'] for st in steps][:3], '…', steps[-1]['t'])
