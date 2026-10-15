# g1, voiced: the user's take (t1.mp3, cut with `python3 cut.py g1/voice t1 1.0 tight`). Places the lines (vo.wav),
# sets each scene's start and warp knots from the spoken words, and maps g1's score onto the new times.
#   python3 build.py && python3 ../../transcribe.py vo.wav vo.words.json && python3 build.py
import json, sys
sys.path.insert(0, '../..'); sys.path.insert(0, '..')
from bcommon import timeline, voice, markers
from score import TB, score
r = lambda x: round(x, 2)

# a beat after «۵۵۰ تا معامله» for the 61% win rate on screen before «ولی…»
place, lens, DUR = timeline([0.25, 0.2, 0.95, 0.35, 0.3, 0.2], lead=0.1, tail=1.6)
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'bokhar': ('بخر', 0), 'forush': ('فروش', 0), 'maroof': ('معروف', 1), 'yazdah': ('یازده', 1),
    'hesab': ('حساب', 3), 'panj': ('پنج', 3),
    'negah': ('نگه', 4), 'devist': ('ویست', 4),
    'yani': ('یعنی', 5), 'strategy': ('استرا', 6), 'befrest': ('بفرست', 6),
}, place, lens)
end = lambda k: place[k] + lens[k]

T = {'hook': 0.0}
T['run'] = end(1) + 0.05
T['tease'] = end(2) + 0.05
T['reveal'] = M['hesab'] - 0.15
T['compare'] = place[4] - 0.1
T['cta'] = place[5] - 0.1
W = {
    'hook': [[0, 0], [M['bokhar'], 0.45], [M['forush'], 1.05], [M['maroof'], 1.3], [M['yazdah'], 1.6], [T['run'], 2.2]],
    'run': [[0, 0], [end(2) - T['run'], 3.9], [T['tease'] - T['run'], 4.2]],
    'tease': [[0, 0], [place[3] - T['tease'], 0.95], [T['reveal'] - T['tease'], 1.6]],
    'reveal': [[0, 0], [M['panj'] - T['reveal'], 1.4], [T['compare'] - T['reveal'], 3.6]],
    'compare': [[0, 0], [M['negah'] - T['compare'], 0.75], [M['devist'] - T['compare'], 1.65], [T['cta'] - T['compare'], 2.6]],
    'cta': [[0, 0], [M['yani'] - T['cta'], 0.45], [M['strategy'] - T['cta'], 1.25], [M['befrest'] - T['cta'], 2.0], [DUR - T['cta'], 3.8]],
}
for k, kn in W.items():
    assert all(kn[i][0] < kn[i + 1][0] and kn[i][1] < kn[i + 1][1] for i in range(len(kn) - 1)), (k, kn)
T = {k: r(v) for k, v in T.items()}; W = {k: [[r(a), r(b)] for a, b in kn] for k, kn in W.items()}
g = json.load(open('../gold.json')); g['buy_hold_pct'] = json.load(open('../results.json'))['buy_hold_pct']
json.dump({'t': T, 'warp': W, 'dur': DUR, 'place': place, 'lens': lens, 'lines': lines, 'm': M, 'sub_at': 1.6, **g}, open('data.json', 'w'), ensure_ascii=False)

BASE = sorted(TB, key=TB.get)
def at(tb):
    k = [s for s in BASE if TB[s] <= tb][-1]
    lb, kn = tb - TB[k], W[k]
    for (a0, b0), (a1, b1) in zip(kn, kn[1:]):
        if lb <= b1: return T[k] + a0 + (lb - b0) / (b1 - b0) * (a1 - a0)
    return T[k] + kn[-1][0] + (lb - kn[-1][1])
sp = score(T, DUR, at, seed=73)
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'scenes', T); print('markers', M)
