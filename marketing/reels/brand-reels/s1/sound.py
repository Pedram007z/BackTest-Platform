# s1's sound: an original score from ../../reelkit/soundgen.py (C major, 120 BPM, bars on odd seconds), no voice.
# The users' request is a soft intro on Am–F (arp, filtered pad, the avatars popping in) rising into the drop on C
# exactly as «اندیکاتور سشن‌ها» lands (3.0 s, an impact and a bell); then the groove carries the desktop screens: a whoosh
# on every camera move, a click for each click of the cursor, a key tick for each letter of "Sessions", pops for the
# high and low tags, a rising run of ticks for the replay's candles, and the end card on a bell.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 110.0], 'F': [[220.0, 261.63, 349.23, 440.0], 87.31],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 98.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
LEAD = 0.32
for k, md in {'news': 0.7, 'add': 0.75, 'boxes': 0.75, 'set': 0.75, 'live': 0.75, 'end': 0.8}.items(): F('whoosh', T[k] - LEAD + md * 0.5, gain=0.3)
# the intro: seven users, each with a request
for i in range(7): F('pop', 0.25 + i * 0.16, f=600 + 60 * i, gain=0.22, pan=-0.6 + 0.2 * i); F('tick', 0.55 + i * 0.16, f=2600 + 80 * i, level=0.3, pan=-0.6 + 0.2 * i)
F('pop', 1.55, f=1000, gain=0.3); F('bell', 1.6, f=1318.51, d=1.0, gain=0.14)
F('riser', 1.9, d=1.1, gain=0.26, f0=250, f1=7000)
# the drop: the news
F('impact', T['news'], size=1.0, gain=0.55); F('bell', T['news'] + 0.05, f=1046.5, d=1.8, gain=0.3)
for j in range(3): F('pop', T['news'] + 0.15 + j * 0.3, f=800 + 150 * j, gain=0.26)
F('pop', 5.35, f=1200, gain=0.3); F('bell', 5.4, f=1567.98, d=1.2, gain=0.2)
# the desktop: Indicators, "Sessions", added
a = T['add']
F('tick', a + 0.75, f=3200, level=0.55); F('pop', a + 0.82, f=900, gain=0.2)
run(a + 1.15, 0.9, 8, 2400, 30, 0.22)
F('tick', a + 2.85, f=3200, level=0.55); F('pop', a + 2.92, f=1100, gain=0.28)
# the boxes: high and low
F('pop', T['boxes'] + 0.35, f=1300, gain=0.3); F('pop', T['boxes'] + 0.65, f=900, gain=0.3); F('tick', T['boxes'] + 1.0, f=2800, level=0.35)
# the settings
F('tick', T['set'] + 1.05, f=2400, level=0.4); F('pop', T['set'] + 1.5, f=1100, gain=0.26)
# the replay: 37 candles, rising
run(T['live'] - 0.25, 3.55, 37, 1600, 18, 0.14)
F('pop', T['live'] + 2.62, f=1250, gain=0.28)
# the end card
F('impact', T['end'], size=0.85, gain=0.42); F('bell', T['end'] + 0.45, f=1046.5, d=2.0, gain=0.3); F('pop', T['end'] + 0.75, f=1200, gain=0.28)
spec = {'seed': 61, 'dur': DUR, 'grid0': -1.0, 'bar': 2.0, 'fade_from': DUR - 1.6, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[T['news'], DUR - 0.4]], 'full': [[T['add'], T['end']]], 'clap': [[T['news'], DUR - 0.4]], 'dark': [[0, T['news'] - 0.1]],
        'arp': [[0, T['add']], [T['end'], DUR]], 'hats': [[T['news'], DUR - 0.8]], 'outro_bass': [0, 0],
        'rolls': [[2.3, 2.96]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'music.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'music.wav', '-af', af, '-ar', '48000', 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
