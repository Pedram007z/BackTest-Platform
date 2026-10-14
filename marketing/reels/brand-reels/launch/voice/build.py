# Launch reel, version 2: the user's voice (t1.mp3, cut with `python3 cut.py launch/voice t1 1.0 tight`).
# Places the lines (vo.wav), sets each scene's start and its warp knots from the spoken words, and maps the
# music-only score onto the new times. Run twice: the second run reads the words as heard in vo.wav.
#   python3 build.py && python3 ../../transcribe.py vo.wav vo.words.json && python3 build.py
import json, sys
sys.path.insert(0, '../..'); sys.path.insert(0, '..')
from bcommon import timeline, voice, markers
from score import TB, score
r = lambda x: round(x, 2)

# gaps after each line: a beat for the target being hit after line 6, the feature stack after line 8
place, lens, DUR = timeline([0.3, 0.3, 0.25, 0.45, 0.3, 1.1, 0.35, 2.8, 0.7], lead=0.15, tail=2.0)
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'strat': ('استرا', 0), 'ba': ('=با', 1), 'kheili': ('خیلی', 1), 'tamum': ('تموم', 1),
    'candle': ('کندل', 3), 'dobare': ('دوباره', 3), 'pakhsh': ('پخش', 3), 'ayande': ('اینده', 3),
    'abzar': ('ابزار', 4), 'indicator': ('اندیکاتور', 4), 'taghvim': ('تقویم', 4),
    'position': ('پوزیشن', 5), 'migiri': ('گیری', 5), 'had': ('=حد', 5), 'hajm': ('حجم', 5),
    'journal': ('رنال', 6), 'analyze': ('انالیز', 6), 'win': ('وین', 6), 'worst': ('بدترین', 6),
    'chand': ('=چند', 7), 'tuye': ('=توی', 7),
    'jayie': ('جاییه', 8), 'tamrin': ('تمرین', 8),
    'emruz': ('امروز', 9), 'link': ('لینک', 9), 'follow': ('فالو', 9),
}, place, lens)
end = lambda k: place[k] + lens[k]

# scene starts (a little before the first word a scene waits for: whisper can hear it before the cut), and knots [actual s from the scene start, music-only s from the scene start]
T = {'hook': 0.0}
T['problem'] = M['ba'] - 0.25                  # «فهمیدنش» plays over the search still loading
T['brand'] = place[2] - 0.05
T['stack'] = min(place[3] - 0.05, M['candle'] - 0.5)
T['replay'] = M['pakhsh'] + 0.1
T['tools'] = min(place[4] - 0.15, M['abzar'] - 0.3)
T['pos'] = min(place[5] - 0.1, M['position'] - 0.25)
T['journal'] = place[6] - 0.1
T['hours'] = min(place[7] - 0.2, M['chand'] - 0.3)
T['pills'] = end(7) + 0.3
T['streak'] = place[8] - 0.15
T['end'] = place[9] - 0.1
W = {
    'hook': [[0, 0], [M['strat'], 0.95], [end(0) - 0.3, 2.0], [T['problem'] - 0.02, 2.78]],   # the click on «جستجو» lands before the cut
    'problem': [[0, 0.0], [M['kheili'] - T['problem'], 0.6], [M['tamum'] - T['problem'], 0.85], [T['brand'] - T['problem'], 2.0]],
    'brand': [[0, 0], [T['stack'] - T['brand'], 1.5]],
    'stack': [[0, 0], [M['candle'] - T['stack'], 0.1], [M['dobare'] - T['stack'], 1.05], [T['replay'] - T['stack'], 2.0]],
    'replay': [[0, 0], [M['ayande'] - 0.1 - T['replay'], 3.0], [T['tools'] - T['replay'], 4.5]],
    'tools': [[0, 0], [M['abzar'] - T['tools'], 0.15], [M['indicator'] - T['tools'], 1.05], [M['taghvim'] - T['tools'], 2.05], [T['pos'] - T['tools'], 3.0]],
    'pos': [[0, 0], [M['position'] - T['pos'], 0.1], [M['migiri'] - T['pos'], 0.68], [M['had'] - T['pos'], 1.1], [M['hajm'] - T['pos'], 2.1],
            [end(5) - T['pos'], 2.75], [end(5) + 0.45 - T['pos'], 3.45], [T['journal'] - T['pos'], 4.5]],
    'journal': [[0, 0], [M['journal'] - T['journal'], 0.4], [M['analyze'] - T['journal'], 1.3], [M['win'] - T['journal'], 1.42],
                [M['worst'] - T['journal'], 1.9], [T['hours'] - T['journal'], 3.0]],
    'hours': [[0, 0], [M['chand'] - T['hours'], 0.2], [M['tuye'] - T['hours'], 0.8], [T['pills'] - T['hours'], 2.0]],
    'pills': [[0, 0], [T['streak'] - T['pills'], 3.0]],
    # the three quick words of the music-only cut are left out: the scene opens on «بک‌تست‌لب»
    'streak': [[0, 1.2], [place[8] - T['streak'], 1.35], [M['jayie'] - T['streak'], 2.35], [M['tamrin'] - T['streak'], 2.55],
               [end(8) + 0.15 - T['streak'], 3.2], [T['end'] - T['streak'], 3.5]],
    'end': [[0, 0], [M['emruz'] - T['end'], 0.65], [M['link'] - T['end'], 1.0], [M['follow'] - T['end'], 1.7], [DUR - T['end'], 4.0]],
}
for k, kn in W.items():
    assert all(kn[i][0] < kn[i + 1][0] and kn[i][1] < kn[i + 1][1] for i in range(len(kn) - 1)), (k, kn)
T = {k: r(v) for k, v in T.items()}; W = {k: [[r(a), r(b)] for a, b in kn] for k, kn in W.items()}
json.dump({'t': T, 'warp': W, 'dur': DUR, 'place': place, 'lens': lens, 'lines': lines, 'shots': '../shots/', 'm': M}, open('data.json', 'w'), ensure_ascii=False)

# music-only time → this cut's time (None for a scene this cut leaves out, or before a scene's first knot)
BASE = sorted(TB, key=TB.get)
def at(tb):
    k = [s for s in BASE if TB[s] <= tb][-1] if tb >= 0 else 'hook'
    if k not in T: return None
    lb, kn = tb - TB[k], W.get(k)
    if not kn: return T[k] + lb
    if lb < kn[0][1]: return None if k == 'streak' else T[k] + kn[0][0] + (lb - kn[0][1])
    for (a0, b0), (a1, b1) in zip(kn, kn[1:]):
        if lb <= b1: return T[k] + a0 + (lb - b0) / (b1 - b0) * (a1 - a0)
    return T[k] + kn[-1][0] + (lb - kn[-1][1])
sp = score(T, DUR, at, seed=67)
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'scenes', T); print('markers', M)
