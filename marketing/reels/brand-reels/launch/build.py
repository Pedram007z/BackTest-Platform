# Launch reel, version 1 (music only): scene times (data.json) and the score (sound.json).
# The scenes are cut on a 120 bpm grid (a beat every 0.5 s, bars from 0.5 s).
import json
r = lambda x: round(x, 2)

T = {'hook': 0.0, 'problem': 3.0, 'brand': 5.0, 'stack': 6.5, 'replay': 8.5, 'tools': 13.0, 'pos': 16.0, 'journal': 20.5,
     'hours': 23.5, 'count': 25.5, 'layout': 27.0, 'pills': 28.5, 'streak': 31.5, 'end': 35.0}
DUR = 39.0
json.dump({'t': T, 'dur': DUR, 'place': [], 'lens': [], 'lines': []}, open('data.json', 'w'), ensure_ascii=False)

# ---- score: A minor, soft and filtered for the question, the groove lands on the brand, full on the desktop ----
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]
fx = []
def add(type_, t, **k): fx.append({'type': type_, 't': r(t), **k})
QUERY = 'استراتژیم واقعاً جواب می‌ده؟'
for i in range(len(QUERY)):                                    # typing (sHook types from 0.95 s over 1.05 s)
    add('tick', 0.95 + 1.05 * (i + 1) / len(QUERY), f=2400 + 40 * (i % 5), level=0.35)
add('pop', 0.88, f=900, gain=0.3); add('pop', 2.6, f=760, gain=0.35)                       # clicks
add('whoosh', T['problem'], gain=0.35)
add('impact', T['problem'] + 0.75 + 0.13, size=0.5, gain=0.35); add('fail', T['problem'] + 1.0, gain=0.2)
add('riser', T['problem'] + 0.6, d=r(T['brand'] - T['problem'] - 0.6), f0=200, f1=6000, gain=0.32)
add('impact', T['brand'], size=1.0, gain=0.75); add('bell', T['brand'] + 0.05, f=1318.5, d=2.0, gain=0.25)
add('whoosh', T['stack'] - 0.05, gain=0.45)
for i in range(6): add('pop', T['stack'] + 0.12 + i * 0.06, f=700 + 60 * i, gain=0.12)
add('whoosh', T['replay'] + 0.1, gain=0.4)
add('pop', T['replay'] + 1.75, f=980, gain=0.35)                                           # play
add('whoosh', T['tools'], gain=0.3); add('pop', T['tools'] + 0.55, f=880, gain=0.3)
add('whoosh', T['tools'] + 2.0, gain=0.3)
add('whoosh', T['pos'], gain=0.3); add('pop', T['pos'] + 0.68, f=1000, gain=0.38)
add('impact', T['pos'] + 3.45, size=0.8, gain=0.55); add('bell', T['pos'] + 3.5, f=1568.0, d=1.8, gain=0.32)
add('whoosh', T['journal'], gain=0.3); add('whoosh', T['journal'] + 1.3, gain=0.35)
add('whoosh', T['hours'], gain=0.3)
add('impact', T['count'], size=0.7, gain=0.5)
add('whoosh', T['layout'], gain=0.35)
add('riser', T['layout'] - 0.2, d=1.7, f0=300, f1=8000, gain=0.35)
add('impact', T['pills'], size=1.0, gain=0.7)
add('downlifter', T['streak'] - 0.1, d=1.4, gain=0.35)
for k, a in enumerate([0.0, 0.42, 0.84]): add('pop', T['streak'] + a, f=760 + 120 * k, gain=0.25)
add('riser', T['streak'] + 2.0, d=1.2, f0=300, f1=7000, gain=0.3)
add('impact', T['end'], size=1.0, gain=0.7); add('bell', T['end'] + 0.1, f=1318.5, d=2.4, gain=0.3)
add('pop', T['end'] + 1.0, f=900, gain=0.3)
sp = {'seed': 61, 'dur': DUR, 'grid0': 0.5, 'bar': 2.0, 'fade_from': r(DUR - 1.6),
      'rolls': [[r(T['pills'] - 0.9), r(T['pills'])]],
      'ticks': [{'start': r(T['count'] + 0.1), 'dur': 0.9, 'count': 11, 'f': 1500, 'step': 25, 'level': 0.14},
                {'start': r(T['replay'] + 1.95), 'dur': 2.5, 'count': 16, 'f': 1300, 'step': 6, 'level': 0.08}],
      'chords': {'Am': chord('A3 C4 E4 A4', 'A1'), 'F': chord('A3 C4 F4 A4', 'F1'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')},
      'prog': ['Am', 'F', 'C', 'G'],
      'groove': [[T['brand'], T['streak']], [T['end'], r(DUR - 1.6)]], 'full': [[T['replay'], T['streak']], [T['end'], r(DUR - 1.6)]],
      'dark': [[0, T['brand']]], 'arp': [[0.5, r(DUR)]],
      'hats': [[T['stack'], T['streak']], [T['end'], r(DUR - 1.6)]], 'clap': [[T['replay'], T['streak']], [T['end'], r(DUR - 1.6)]],
      'outro_bass': [r(DUR - 1.6), DUR], 'fx': fx}
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'fx', len(fx))
