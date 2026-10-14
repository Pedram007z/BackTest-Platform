# The launch reel's score, shared by both cuts. Effects are placed in the music-only version's times (TB) and
# mapped to a cut's own times by at(base_time) (None drops one that falls in a scene the cut leaves out).
r = lambda x: round(x, 2)
TB = {'hook': 0.0, 'problem': 3.0, 'brand': 5.0, 'stack': 6.5, 'replay': 8.5, 'tools': 13.0, 'pos': 16.0, 'journal': 20.5,
      'hours': 23.5, 'count': 25.5, 'layout': 27.0, 'pills': 28.5, 'streak': 31.5, 'end': 35.0}
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]


def score(T, DUR, at=lambda x: x, seed=61):
    """T: the cut's scene starts (actual s). Returns the soundgen spec."""
    fx = []
    def add(type_, tb, **k):
        t = at(tb)
        if t is not None: fx.append({'type': type_, 't': r(t), **k})
    B = TB
    QUERY = 'استراتژیم واقعاً جواب می‌ده؟'
    for i in range(len(QUERY)):                                    # typing (sHook types from 0.95 s over 1.05 s)
        add('tick', 0.95 + 1.05 * (i + 1) / len(QUERY), f=2400 + 40 * (i % 5), level=0.35)
    add('pop', 0.88, f=900, gain=0.3); add('pop', 2.6, f=760, gain=0.35)                       # clicks
    add('whoosh', B['problem'], gain=0.35)
    add('impact', B['problem'] + 0.75 + 0.13, size=0.5, gain=0.35); add('fail', B['problem'] + 1.0, gain=0.2)
    add('impact', B['brand'], size=1.0, gain=0.75); add('bell', B['brand'] + 0.05, f=1318.5, d=2.0, gain=0.25)
    add('whoosh', B['stack'] - 0.05, gain=0.45)
    for i in range(6): add('pop', B['stack'] + 0.12 + i * 0.06, f=700 + 60 * i, gain=0.12)
    add('whoosh', B['replay'] + 0.1, gain=0.4)
    add('pop', B['replay'] + 1.75, f=980, gain=0.35)                                           # play
    add('whoosh', B['tools'], gain=0.3); add('pop', B['tools'] + 0.55, f=880, gain=0.3)
    add('whoosh', B['tools'] + 2.0, gain=0.3)
    add('whoosh', B['pos'], gain=0.3); add('pop', B['pos'] + 0.68, f=1000, gain=0.38)
    add('impact', B['pos'] + 3.45, size=0.8, gain=0.55); add('bell', B['pos'] + 3.5, f=1568.0, d=1.8, gain=0.32)
    add('whoosh', B['journal'], gain=0.3); add('whoosh', B['journal'] + 1.3, gain=0.35)
    add('whoosh', B['hours'], gain=0.3)
    add('impact', B['count'], size=0.7, gain=0.5)
    add('whoosh', B['layout'], gain=0.35)
    add('impact', B['pills'], size=1.0, gain=0.7)
    add('downlifter', B['streak'] - 0.1, d=1.4, gain=0.35)
    for k, a in enumerate([0.0, 0.42, 0.84]): add('pop', B['streak'] + a, f=760 + 120 * k, gain=0.25)
    add('impact', B['end'], size=1.0, gain=0.7); add('bell', B['end'] + 0.1, f=1318.5, d=2.4, gain=0.3)
    add('pop', B['end'] + 1.0, f=900, gain=0.3)
    # risers end on the cut's own scene starts
    def riser(t_end, d, **k):
        fx.append({'type': 'riser', 't': r(t_end - d), 'd': r(d), **k})
    riser(T['brand'], min(1.4, T['brand'] - T['problem'] - 0.4), f0=200, f1=6000, gain=0.32)
    riser(T['pills'], 1.7, f0=300, f1=8000, gain=0.35)
    riser(T['end'] - 0.3, 1.2, f0=300, f1=7000, gain=0.3)
    ticks = [{'start': r(at(B['replay'] + 1.95)), 'dur': r(at(B['replay'] + 4.45) - at(B['replay'] + 1.95)), 'count': 16, 'f': 1300, 'step': 6, 'level': 0.08}]
    if 'count' in T: ticks.append({'start': r(T['count'] + 0.1), 'dur': 0.9, 'count': 11, 'f': 1500, 'step': 25, 'level': 0.14})
    stop = T['streak']; out = r(DUR - 1.6)
    return {'seed': seed, 'dur': DUR, 'grid0': 0.5, 'bar': 2.0, 'fade_from': out,
            'rolls': [[r(T['pills'] - 0.9), r(T['pills'])]], 'ticks': ticks,
            'chords': {'Am': chord('A3 C4 E4 A4', 'A1'), 'F': chord('A3 C4 F4 A4', 'F1'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')},
            'prog': ['Am', 'F', 'C', 'G'],
            'groove': [[T['brand'], stop], [T['end'], out]], 'full': [[T['replay'], stop], [T['end'], out]],
            'dark': [[0, T['brand']]], 'arp': [[0.5, r(DUR)]],
            'hats': [[T['stack'], stop], [T['end'], out]], 'clap': [[T['replay'], stop], [T['end'], out]],
            'outro_bass': [out, DUR], 'fx': fx}
