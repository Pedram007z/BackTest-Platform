# g1's score, shared by both cuts: effects placed in the music-only times (TB) and mapped by at(base time).
r = lambda x: round(x, 2)
TB = {'hook': 0.0, 'run': 2.2, 'tease': 6.4, 'reveal': 8.0, 'compare': 11.6, 'cta': 14.2}
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
f = lambda n, o: round(NOTE[n] * 2 ** (o - 4), 2)
chord = lambda notes, root: [[f(x[:-1], int(x[-1])) for x in notes.split()], f(root[:-1], int(root[-1]))]


def score(T, DUR, at=lambda x: x, seed=71):
    """T: the cut's scene starts. Returns the soundgen spec."""
    fx = []
    def add(type_, tb, **k):
        t = at(tb)
        if t is not None: fx.append({'type': type_, 't': r(t), **k})
    B = TB
    add('impact', 0.02, size=0.6, gain=0.5)
    for k, t in enumerate([0.45, 1.05]): add('pop', t, f=760 + 200 * k, gain=0.3)        # the buy / sell marks
    add('whoosh', B['run'], gain=0.4)
    add('impact', B['tease'], size=0.7, gain=0.55); add('bell', B['tease'] + 0.05, f=1318.5, d=1.2, gain=0.3)
    add('impact', B['reveal'] + 1.42, size=1.0, gain=0.8); add('fail', B['reveal'] + 1.6, gain=0.35)
    add('whoosh', B['compare'], gain=0.35); add('bell', B['compare'] + 1.65, f=1568.0, d=1.6, gain=0.3)
    add('whoosh', B['cta'], gain=0.35); add('pop', B['cta'] + 1.3, f=980, gain=0.35); add('pop', B['cta'] + 2.05, f=1100, gain=0.3)
    fx.append({'type': 'riser', 't': r(T['reveal'] - 1.0), 'd': 1.0, 'f0': 300, 'f1': 5000, 'gain': 0.28})
    run0, run1 = at(B['run'] + 0.3), at(B['run'] + 3.9)
    return {'seed': seed, 'dur': DUR, 'grid0': 0.0, 'bar': 2.0, 'fade_from': r(DUR - 0.5),
            'ticks': [{'start': r(run0), 'dur': r(run1 - run0), 'count': 40, 'f': 1400, 'step': 6, 'level': 0.07}],
            'chords': {'Am': chord('A3 C4 E4 A4', 'A1'), 'F': chord('A3 C4 F4 A4', 'F1'), 'C': chord('G3 C4 E4 G4', 'C2'), 'G': chord('G3 B3 D4 G4', 'G1')},
            'prog': ['Am', 'F', 'C', 'G'],
            'groove': [[0.0, T['reveal']], [T['compare'], DUR]], 'full': [[T['run'], T['tease']], [T['cta'], DUR]],
            'dark': [[T['reveal'], T['compare']]], 'arp': [[0, DUR]],
            'hats': [[T['run'], T['reveal']], [T['compare'], DUR]], 'clap': [[T['run'], T['tease']], [T['cta'], DUR]],
            'outro_bass': [DUR, DUR], 'fx': fx}
