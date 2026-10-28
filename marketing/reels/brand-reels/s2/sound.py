# s2's sound: an original score from ../../reelkit/soundgen.py (A minor, 120 BPM, bars from 0.5 s), no voice. A riser
# into the «۲۰» slam (an impact, a bell, a burst of pops), the groove from there; clock ticks as the ring sweeps
# through «۴۸ ساعت»; a whoosh on every wipe; a key tick for each letter of DISCOUNT20 on the coupon and again on the
# billing page; a click on «اعمال»; the end card on an impact and a bell.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']
CH = {'Am': [[220.0, 261.63, 329.63, 440.0], 110.0], 'F': [[220.0, 261.63, 349.23, 440.0], 87.31],
      'C': [[196.0, 261.63, 329.63, 392.0], 65.41], 'G': [[196.0, 246.94, 293.66, 392.0], 98.0]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('time', 'code', 'how', 'end'): F('whoosh', T[k] - 0.1, gain=0.3)
# the slam
F('riser', 0.0, d=0.5, gain=0.2, f0=400, f1=4000); F('impact', 0.5, size=1.2, gain=0.65); F('bell', 0.55, f=1760.0, d=1.6, gain=0.3)
for j in range(6): F('pop', 0.6 + j * 0.07, f=900 + 140 * j, gain=0.2, pan=-0.5 + 0.2 * j)
F('pop', 1.0, f=1200, gain=0.32)
# the clock: a tick each half second, «۴۸» and «ساعت»
run(3.2, 2.6, 6, 3000, 0, 0.3); F('impact', 4.0, size=0.6, gain=0.4); F('pop', 4.5, f=1300, gain=0.3)
# the coupon: ten keys, a bell when it's complete, «کپی کن»
run(6.7, 1.2, 10, 2600, 6, 0.32); F('bell', 7.95, f=1318.51, d=1.4, gain=0.3); F('pop', 8.3, f=1100, gain=0.3)
# the billing page: ten keys, the cursor to «اعمال», the click
run(10.2, 1.1, 10, 2400, 6, 0.3); F('tick', 12.4, f=3200, level=0.55); F('pop', 12.45, f=900, gain=0.3)
# the end card
F('impact', T['end'], size=0.85, gain=0.45); F('bell', T['end'] + 0.45, f=1318.51, d=2.0, gain=0.3); F('pop', T['end'] + 0.65, f=1200, gain=0.28); F('pop', T['end'] + 0.95, f=1500, gain=0.28)
spec = {'seed': 37, 'dur': DUR, 'grid0': 0.5, 'bar': 2.0, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['Am', 'F', 'C', 'G'],
        'groove': [[0.5, DUR - 0.4]], 'full': [[0.5, T['end']]], 'clap': [[0.5, DUR - 0.4]], 'dark': [[0, 0.45]],
        'arp': [[T['code'], T['how']], [T['end'], DUR]], 'hats': [[0.5, DUR - 0.8]], 'outro_bass': [0, 0], 'rolls': [], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'music.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'music.wav', '-af', af, '-ar', '48000', 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
