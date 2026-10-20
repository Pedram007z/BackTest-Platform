# d1 · «۳ اشتباه»: the user's take (t1.mp3, cut with `python3 cut.py d1 t1 1.12 tight`). Places the lines (vo.wav),
# sets each scene's start and its warp knots from the spoken words, and writes the score (sound.json) at the same
# times. Run twice: the second run reads the words as heard in vo.wav.
#   python3 build.py && python3 ../transcribe.py vo.wav vo.words.json && python3 build.py && python3 ../mkpage_b.py d1
#   (then: soundgen sound.json → music.wav, python3 ../mix.py d1, render, sh ../encode.sh d1 <out.mp4>)
import json, sys
sys.path.insert(0, '..'); sys.path.insert(0, '../launch')
from bcommon import timeline, voice, markers
from score import chord
r = lambda x: round(x, 2)

# gaps after each line: a beat after line 3 for the target being hit
place, lens, DUR = timeline([0.35, 0.25, 0.9, 0.25, 0.3, 0.25, 0.35, 0.3, 0.35], lead=0.15, tail=2.2)
lines = json.load(open('lines.json'))
voice(place, DUR)
M = markers({
    'kheili': ('خیلی', 0), 'pul': ('پول', 0), 'yad': ('=یاد', 0), 'majbur': ('مجبور', 0),
    'vorud': ('ورود', 1),
    'position': ('پوزیشن', 2), 'migiri': ('گیری', 2), 'had': ('=حد', 2), 'hajm': ('حجم', 2),
    'moamele': ('معامله', 3),
    'taghvim': ('تقویم', 4), 'ghabl': ('قبل', 4),
    'etemad': ('اعتماد', 5), 'panj': ('پنج', 5),
    'candle': ('کندل', 6), 'ayande': ('اینده', 6), 'analyze': ('انالیز', 6),
    'na': ('=نه', 7),
    'launch': ('لانچ', 8), 'avalin': ('اولین', 8), 'darsad': ('درصد', 8),
    'link': ('لینک', 9), 'strat': ('بعدی', 9),
}, place, lens)
end = lambda k: place[k] + lens[k]

T = {'hook': 0.0, 'm1': place[1] - 0.12, 'pos': place[2] - 0.1, 'm2': place[3] - 0.12, 'news': min(place[4] - 0.1, M['taghvim'] - 0.25), 'm3': place[5] - 0.12,
     'replay': place[6] - 0.1, 'journal': M['analyze'] - 0.35, 'practice': place[7] - 0.1, 'offer': place[8] - 0.1, 'end': min(place[9] - 0.1, M['link'] - 0.25)}
rel = lambda k, x: x - T[k]
nxt = {'hook': 'm1', 'm1': 'pos', 'pos': 'm2', 'm2': 'news', 'news': 'm3', 'm3': 'replay', 'replay': 'journal', 'journal': 'practice', 'practice': 'offer', 'offer': 'end'}
span = lambda k: T[nxt[k]] - T[k]
W = {
    'hook': [[0, 0], [M['kheili'], 1.13], [M['pul'], 1.88], [M['yad'], 2.45], [M['majbur'] - 0.42, 3.75], [M['majbur'], 4.1], [span('hook'), 5.4]],
    'm1': [[0, 0], [rel('m1', M['vorud']), 0.25], [span('m1'), 2.4]],
    'pos': [[0, 0], [rel('pos', M['position']), 0.1], [rel('pos', M['migiri']), 0.68], [rel('pos', M['had']), 1.1], [rel('pos', M['hajm']), 2.1],
            [rel('pos', end(2)), 2.75], [rel('pos', end(2)) + 0.45, 3.45], [span('pos'), 4.5]],
    'm2': [[0, 0], [rel('m2', M['moamele']), 0.25], [span('m2'), 2.6]],
    'news': [[0, 0], [rel('news', M['taghvim']), 0.1], [rel('news', M['ghabl']), 1.6], [span('news'), 3.6]],
    'm3': [[0, 0], [rel('m3', M['etemad']), 0.25], [rel('m3', M['panj']), 1.4], [span('m3'), 3.6]],
    'replay': [[0, 0], [rel('replay', M['candle']), 1.75], [rel('replay', M['ayande']) - 0.1, 3.0], [span('replay'), 4.5]],
    'journal': [[0, 1.25], [0.35, 1.3], [span('journal'), 3.0]],
    'practice': [[0, 0], [rel('practice', M['na']), 1.4], [span('practice'), 3.2]],
    'offer': [[0, 0], [rel('offer', M['launch']), 0.35], [rel('offer', M['avalin']), 1.4], [rel('offer', M['darsad']) - 0.4, 2.3], [span('offer'), 4.0]],
    'end': [[0, 0], [rel('end', M['link']), 0.3], [rel('end', M['strat']), 1.6], [DUR - T['end'], 4.5]],
}
for k, kn in W.items():                         # a knot heard out of order is dropped rather than bending time backwards
    keep = [kn[0]]
    for a, b in kn[1:]:
        if a > keep[-1][0] + 0.05 and b > keep[-1][1]: keep.append([a, b])
        else: print('  dropped knot', k, (round(a, 2), b))
    W[k] = kn = keep
    assert all(kn[i][0] < kn[i + 1][0] and kn[i][1] < kn[i + 1][1] for i in range(len(kn) - 1)), (k, kn)
T = {k: r(v) for k, v in T.items()}; W = {k: [[r(a), r(b)] for a, b in kn] for k, kn in W.items()}
json.dump({'t': T, 'warp': W, 'dur': DUR, 'place': place, 'lens': lens, 'lines': lines, 'shots': '../launch/shots/', 'm': M}, open('data.json', 'w'), ensure_ascii=False)

# ---------- the score, at this cut's own times ----------
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
add('impact', 0.05, size=0.6, gain=0.45)
for i in range(3): add('pop', 0.15 + i * 0.16, f=650 + 90 * i, gain=0.32)                                # the three crosses
add('fail', M['pul'] + 0.35, gain=0.18)                                                                     # «با پول واقعی»
add('whoosh', M['majbur'] - 0.45, gain=0.45); add('impact', M['majbur'] - 0.05, size=0.9, gain=0.6); add('bell', M['majbur'], f=1318.5, d=1.8, gain=0.25)
for k in ('m1', 'm2', 'm3'):                                                                                # the red cards
    add('impact', T[k] + 0.02, size=0.8, gain=0.6); add('fail', T[k] + 0.25, gain=0.2)
add('pop', M['migiri'], f=1000, gain=0.38)                                                                  # buy
add('impact', end(2) + 0.45, size=0.8, gain=0.55); add('bell', end(2) + 0.5, f=1568.0, d=1.8, gain=0.32)  # target hit
add('whoosh', T['pos'], gain=0.35); add('whoosh', T['news'], gain=0.35); add('pop', M['taghvim'] + 0.2, f=900, gain=0.3)
for i in range(2): add('pop', M['ghabl'] - 0.25 + i * 0.15, f=1100 + 150 * i, gain=0.3)                    # the coming releases
for i in range(5): add('pop', M['panj'] + i * 0.09, f=800 + 70 * i, gain=0.25)                              # five ticks
add('pop', M['panj'] + 0.7, f=600, gain=0.3)                                                                # «کافیه؟»
add('whoosh', T['replay'], gain=0.4); add('pop', M['candle'], f=980, gain=0.35)                             # play
add('whoosh', T['journal'], gain=0.35)
add('downlifter', T['practice'] - 0.1, d=1.4, gain=0.35); add('pop', M['na'], f=760, gain=0.3); add('fail', M['na'] + 0.75, gain=0.22)
add('impact', T['offer'], size=1.0, gain=0.7); add('bell', T['offer'] + 0.1, f=1318.5, d=2.0, gain=0.25)
add('riser', T['offer'] + 0.3, d=r(M['avalin'] - T['offer'] - 0.45), f0=300, f1=7000, gain=0.32)
add('impact', M['avalin'] - 0.1, size=1.1, gain=0.7)                                                        # the coupon lands
add('bell', M['darsad'] + 0.15, f=1568.0, d=2.0, gain=0.3); add('pop', M['darsad'] + 0.6, f=1100, gain=0.3)  # 20%, the code chip
add('impact', T['end'], size=1.0, gain=0.65); add('bell', T['end'] + 0.1, f=1318.5, d=2.4, gain=0.3); add('pop', M['link'], f=900, gain=0.3)
ticks = [{'start': r(M['candle'] + 0.2), 'dur': r(max(0.6, M['ayande'] - M['candle'])), 'count': 16, 'f': 1300, 'step': 6, 'level': 0.08},
         {'start': r(M['darsad'] - 0.45), 'dur': 0.55, 'count': 20, 'f': 1500, 'step': 25, 'level': 0.12}]
out = r(DUR - 1.6)
spec = {'seed': 105, 'dur': DUR, 'grid0': r(T['m1'] % 2.0), 'bar': 2.0, 'fade_from': out, 'rolls': [[r(T['offer'] - 0.9), r(T['offer'])]], 'ticks': ticks,
        'chords': {'Am': chord('A3 C4 E4 A4', 'A1'), 'F': chord('A3 C4 F4 A4', 'F1'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')}, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['m1'], T['practice']], [T['offer'], out]], 'full': [[T['pos'], T['practice']], [T['offer'], out]], 'dark': [[0, T['m1']], [T['practice'], T['offer']]],
        'arp': [[0.3, r(DUR)]], 'hats': [[T['m1'], T['practice']], [T['offer'], out]], 'clap': [[T['pos'], T['practice']], [T['offer'], out]], 'outro_bass': [out, DUR], 'fx': fx}
json.dump(spec, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'scenes', T); print('markers', M)
