# k24's timeline: the user's take at its normal speed (voice/build.py → voice/timing.json), and the 100 simulated trades
# for the «۱۰۰ تا معامله» grid: a fair coin (win rate 50%), seeded, picked so that its longest losing streak is exactly
# five, happens once, and sits inside one row of the grid (the voice: «به احتمال زیاد یه جا پنج تا ضرر پشت‌سرهم می‌خوری»). On screen it
# is labelled as a simulation.
#   python3 voice/build.py && python3 data.py
import json, random
t = json.load(open('voice/timing.json'))
def runs(s):
    best, cur, at = 0, 0, 0
    for i, c in enumerate(s):
        cur = cur + 1 if c == 'L' else 0
        if cur > best: best, at = cur, i - cur + 1
    return best, at
for seed in range(1, 100000):
    r = random.Random(seed); s = ''.join('W' if r.random() < 0.5 else 'L' for _ in range(100)); best, at = runs(s)
    if best == 5 and s.count('LLLLL') == 1 and at // 10 == (at + 4) // 10 and 47 <= s.count('W') <= 53 and 3 <= at // 10 <= 6: break
json.dump({'w': t['w'], 'dur': t['dur'], 'end': t['T']['end'], 'sim': s, 'run': at, 'seed': seed}, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(t['w']), 'words,', t['dur'], 's; sim seed', seed, 'wins', s.count('W'), 'run at', at, s)
