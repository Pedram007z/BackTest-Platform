# Write <dir>/sound.json for each brand reel: the score follows the voice-driven timeline in data.json.
import json, sys
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def f(n, o): return round(NOTE[n] * 2 ** (o - 4), 2)
def chord(notes, root):  # notes like 'A3 C4 E4 A4', root like 'A2'
    v = [f(x[:-1], int(x[-1])) for x in notes.split()]; return [v, f(root[:-1], int(root[-1]))]
r = lambda x: round(x, 2)
def spec(d, **k):
    base = {'seed': 7, 'dur': d['dur'], 'grid0': 0.0, 'fade_from': r(d['dur'] - 1.6), 'rolls': [], 'ticks': [], 'clap': []}
    base.update(k); return base
which = sys.argv[1]
d = json.load(open(f'{which}/data.json')); PL, LN = d['place'], d['lens']; S = lambda k: PL[k]; E = lambda k: PL[k] + LN[k]; DUR = d['dur']
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
if which == 'c1':
    for k in (3, 9, 11, 12, 13, 14): add('whoosh', S(k) - 0.05, gain=0.3)
    add('riser', S(3) + 0.3, d=r(LN[3] * 0.55 - 0.3), f0=200, f1=5000, gain=0.3)
    add('bell', S(3) + LN[3] * 0.55, f=880.0, d=1.4, gain=0.25)
    add('downlifter', S(4) + 0.8, d=1.6, gain=0.45); add('impact', S(4) + LN[4] - 0.25, size=1.3, gain=0.85)
    add('fail', S(5) + LN[5] * 0.85, gain=0.28)
    add('pop', S(6) + 0.1, f=700, gain=0.3); add('pop', S(6) + LN[6] * 0.45, f=600, gain=0.25)
    add('riser', S(8), d=r(LN[8] * 0.55 + 0.4), f0=300, f1=7000, gain=0.35); add('bell', S(8) + 0.4 + LN[8] * 0.55, f=1318.5, d=1.6, gain=0.3)
    add('impact', S(9), size=1.1, gain=0.8); add('bell', S(9) + 0.05, f=659.25, d=2.2, gain=0.3); add('pop', S(10), f=820, gain=0.3)
    add('pop', S(12) + LN[12] * 0.22, f=700, gain=0.3); add('pop', S(12) + LN[12] * 0.5, f=880, gain=0.3); add('impact', S(12) + LN[12] * 0.8, size=0.6, gain=0.4)
    add('pop', S(13) + 0.2, f=760, gain=0.25); add('impact', S(14) - 0.1, size=0.6, gain=0.4); add('bell', S(14) + 0.5, f=880.0, d=1.8, gain=0.28)
    sp = spec(d, seed=21, bar=2.6, chords={'Am': chord('A3 C4 E4 A4', 'A2'), 'F': chord('A3 C4 F4 A4', 'F2'), 'Dm': chord('A3 D4 F4 A4', 'D2'), 'E': chord('G#3 B3 E4 G#4', 'E2')},
              prog=['Am', 'F', 'Dm', 'E'], groove=[[r(S(3)), r(S(11))], [r(S(12)), r(S(13))]], full=[[r(S(9)), r(S(11))]], dark=[[0, r(S(3))], [r(S(4)), r(S(9))], [r(S(11)), r(S(12))]],
              arp=[[0, r(S(3))], [r(S(9)), r(S(11))], [r(S(12)), r(DUR)]], hats=[[r(S(3)), r(S(11))]], clap=[[r(S(9)), r(S(11))]], outro_bass=[r(S(13)), r(DUR)],
              ticks=[{'start': r(S(1) + 0.2), 'dur': r(LN[1]), 'count': 18, 'f': 1500, 'step': 25, 'level': 0.1},
                     {'start': r(S(7)), 'dur': r(LN[7] + 0.2), 'count': 26, 'f': 1400, 'step': 12, 'level': 0.12}], fx=fx)
elif which == 'c2':
    for k in (2, 4, 6, 7, 10, 12, 13, 14): add('whoosh', S(k) - 0.05, gain=0.3)
    add('riser', S(1), d=r(LN[1]), f0=200, f1=4000, gain=0.25)
    add('pop', S(2), f=760, gain=0.3); add('pop', S(3), f=640, gain=0.3)
    add('bell', S(2) + LN[2] * 0.75, f=987.77, d=1.2, gain=0.22); add('tick', S(3) + LN[3] * 0.9, f=1200, level=0.4)
    add('bell', S(5) + LN[5] * 0.1 + 1.0, f=1318.5, d=1.6, gain=0.28)
    add('impact', S(6) + 0.4, size=0.8, gain=0.6)
    add('impact', S(7), size=0.5, gain=0.4); add('downlifter', S(8), d=2.0, gain=0.4); add('fail', S(8) + LN[8] * 0.55, gain=0.3)
    add('impact', S(9) + 0.6, size=1.2, gain=0.8)
    add('riser', S(10) - 0.2, d=1.6, f0=300, f1=6000, gain=0.3); add('bell', S(10) + 1.4, f=1318.5, d=1.6, gain=0.28)
    add('pop', S(13) + 0.6, f=760, gain=0.3); add('pop', S(13) + 0.8, f=640, gain=0.3); add('pop', S(13) + 1.4, f=900, gain=0.28)
    add('impact', S(14) - 0.1, size=0.6, gain=0.4); add('bell', S(14) + 0.5, f=880.0, d=1.8, gain=0.28)
    sp = spec(d, seed=33, bar=2.6, chords={'Em': chord('G3 B3 E4 G4', 'E2'), 'C': chord('G3 C4 E4 G4', 'C2'), 'Am': chord('A3 C4 E4 A4', 'A2'), 'B': chord('F#3 B3 D#4 F#4', 'B1')},
              prog=['Em', 'C', 'Am', 'B'], groove=[[r(S(2)), r(S(6))], [r(S(7)), r(S(11))]], full=[[r(S(4)), r(S(6))]], dark=[[0, r(S(2))], [r(S(7)), r(S(11))], [r(S(11)), r(S(12))]],
              arp=[[0, r(S(2))], [r(S(4)), r(S(6))], [r(S(12)), r(DUR)]], hats=[[r(S(2)), r(S(6))], [r(S(7)), r(S(11))]], clap=[[r(S(4)), r(S(6))]], outro_bass=[r(S(13)), r(DUR)],
              ticks=[{'start': r(S(4) + 0.3), 'dur': r(LN[4] * 0.8), 'count': 8, 'f': 1300, 'step': 40, 'level': 0.2}], fx=fx)
elif which == 'c3':
    for k in (1, 2, 4, 6, 7, 8, 10, 11, 12): add('whoosh', S(k) - 0.05, gain=0.28)
    add('downlifter', 0.3, d=2.8, gain=0.35)
    for i, fr in enumerate((0.25, 0.45, 0.62, 0.8)): add('pop', S(1) + LN[1] * fr, f=660 + 90 * i, gain=0.3)
    add('impact', S(2) + LN[2] * 0.4, size=0.5, gain=0.4)
    for i, fr in enumerate((0.02, 0.14, 0.26)): add('pop', S(4) + LN[4] * fr, f=720 + 80 * i, gain=0.3)
    add('pop', S(4) + LN[4] * 0.55, f=980, gain=0.28); add('pop', S(5) + 0.6, f=760, gain=0.25); add('pop', S(5) + LN[5] * 0.3, f=880, gain=0.3); add('bell', S(5) + LN[5] * 0.85, f=1174.66, d=1.2, gain=0.22)
    add('riser', S(8), d=r(LN[8] + 0.45), f0=250, f1=8000, gain=0.35)
    add('impact', S(9), size=1.2, gain=0.85); add('bell', S(9) + 0.05, f=1046.5, d=2.0, gain=0.3); add('bell', S(9) + LN[9] * 0.55, f=1318.5, d=2.0, gain=0.3)
    add('pop', S(10) + LN[10] * 0.75, f=900, gain=0.3)
    for i, fr in enumerate((0, 0.35, 0.7)): add('pop', S(11) + fr * LN[11], f=700 + 100 * i, gain=0.28)
    add('pop', S(12) + LN[12] * 0.75, f=900, gain=0.3); add('bell', DUR - 2.4, f=1046.5, d=2.0, gain=0.25)
    sp = spec(d, seed=45, bar=2.0, chords={'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1'), 'Am': chord('A3 C4 E4 A4', 'A2'), 'F': chord('A3 C4 F4 A4', 'F2')},
              prog=['Am', 'F', 'C', 'G'], groove=[[r(S(1)), r(S(8))], [r(S(9)), r(DUR - 1.8)]], full=[[r(S(9)), r(DUR - 1.8)]], dark=[[0, r(S(1))], [r(S(2)), r(S(3))]],
              arp=[[0, r(DUR)]], hats=[[r(S(1)), r(S(8))], [r(S(9)), r(DUR - 1.8)]], clap=[[r(S(3)), r(S(8))], [r(S(9)), r(DUR - 1.8)]], outro_bass=[r(DUR - 1.8), r(DUR)],
              rolls=[[r(S(9) - 1.0), r(S(9))]],
              ticks=[{'start': r(S(3) + 0.3), 'dur': r(LN[3] - 0.4), 'count': 24, 'f': 1600, 'step': 10, 'level': 0.1},
                     {'start': r(S(8)), 'dur': r(LN[8]), 'count': 40, 'f': 1500, 'step': 15, 'level': 0.1}], fx=fx)
elif which == 'c4':
    T = d['T']; RT = [[0, *T['r1']], T['r2'], T['r3']]; chg = [x['chg'] for x in d['rounds']]
    for k, (a0, c0, rv, e) in enumerate(RT):
        if k: add('whoosh', a0, gain=0.3)
        for j in range(3): add('tick', c0 + j, f=1700 if j < 2 else 2200, level=0.55)
        add('impact', rv, size=1.3 if k == 2 else 0.7, gain=0.9 if k == 2 else 0.6)
        if chg[k] > 0: add('bell', rv + 0.05, f=1318.5, d=1.6, gain=0.35)
        else: add('fail', rv + 0.1, gain=0.35)
        if k == 2: add('downlifter', rv, d=1.8, gain=0.5)
    for i in range(3): add('pop', T['score'][0] + 0.5 + i * 0.35, f=700 + 100 * i, gain=0.3)
    for t0 in (T['l1'][0], T['l2'][0], T['app'][0], T['cta'][0]): add('whoosh', t0, gain=0.28)
    for t0 in (T['app'][0] + 0.3, T['app'][0] + 2.2, T['app'][0] + 4.2): add('pop', t0, f=820, gain=0.28)
    add('impact', T['cta'][0], size=0.7, gain=0.5); add('pop', T['cta'][0] + 0.6, f=900, gain=0.3); add('bell', T['cta'][0] + 1.8, f=1046.5, d=2.0, gain=0.3)
    calm = [[T['l1'][0], T['app'][0]]]
    sp = spec(d, seed=58, bar=2.0, chords={'Em': chord('G3 B3 E4 G4', 'E2'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1'), 'D': chord('F#3 A3 D4 F#4', 'D2')},
              prog=['Em', 'C', 'G', 'D'], groove=[[0, T['score'][1]], [T['app'][0], r(DUR - 1.6)]], full=[[T['r3'][2], T['r3'][3]], [T['cta'][0], r(DUR - 1.6)]],
              dark=[[T['r3'][1], T['r3'][2]], *calm], arp=[[0, r(DUR)]], hats=[[0, T['score'][1]], [T['app'][0], r(DUR - 1.6)]],
              clap=[[T['r1'][1], T['score'][0]], [T['cta'][0], r(DUR - 1.6)]], outro_bass=[T['l1'][0], T['app'][0]], fx=fx)
json.dump(sp, open(f'{which}/sound.json', 'w'), indent=1); print(which, len(fx), 'fx')
