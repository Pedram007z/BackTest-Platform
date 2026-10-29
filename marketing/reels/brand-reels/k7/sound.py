# k7's sound: an original score from ../../reelkit/soundgen.py under the user's voice (F# minor, 104 BPM, F#m–D–A–E,
# with a bar landing on «بک‌تست‌لب»). The life story is soft (pads and a pluck, no drums); the beat comes in on «بازارای
# مالی» and plays in full from «بک‌تست‌لب». The effects:
#   - rain and thunder on «دردسر بزرگ»;
#   - a pop for each comforting bubble, a falling tone as they drop;
#   - a click and a bell as the two pieces fit;
#   - a riser along the easy way, a bell for the sun;
#   - ticks on «باهوش» and «پویا», a fail on «بدون درکش»;
#   - the magnifier's ticks and a bell when it finds the one;
#   - a bell on «گذشته»;
#   - a hit on «بک‌تست‌لب», ticks on the data range and the replay;
#   - pops for the winners and losers;
#   - a riser along the repeat;
#   - a bell on «تو»;
#   - the follow click, the year counter's ticks, «نهایت استفاده», the end card.
#   python3 sound.py → music.json, music.wav, mix.wav (−14 LUFS)
import json, subprocess, wave
import numpy as np
D = json.load(open('data.json')); T = D['T']; DUR = D['dur']; Wd = D['w']; ws = lambda i: Wd[i][0]; we = lambda i: Wd[i][1]
CH = {'F#m': [[185.0, 220.0, 277.18, 369.99], 46.25], 'D': [[220.0, 293.66, 369.99, 440.0], 73.42],
      'A': [[220.0, 277.18, 329.63, 440.0], 55.0], 'E': [[207.65, 246.94, 329.63, 415.3], 41.2]}
fx, ticks = [], []
F = lambda kind, t, **k: fx.append({'type': kind, 't': round(t, 3), **k})
run = lambda t0, d, n, f=2200, step=0, level=0.15: ticks.append({'start': round(t0, 3), 'dur': round(d, 3), 'count': int(n), 'f': f, 'step': step, 'level': level})
for k in ('console', 'alone', 'truly', 'help', 'markets', 'smart', 'seek', 'past', 'brand', 'repeat', 'you', 'cta', 'use', 'end'): F('whoosh', T[k], gain=0.22)
# the storm
F('impact', ws(4), size=0.5, gain=0.35); F('impact', ws(6), size=0.8, gain=0.45); F('downlifter', ws(6) + 0.1, d=1.2, gain=0.12)
# the comforts, then they fall
for i in range(4): F('pop', T['console'] + 0.15 + i * 0.32, f=900 + 120 * i, gain=0.26)
F('downlifter', T['alone'], d=1.0, gain=0.2); F('pop', ws(16), f=700, gain=0.26)
# two pieces fit
F('tick', ws(23), f=3200, level=0.55); F('bell', ws(23) + 0.05, f=1108.73, d=1.4, gain=0.28); F('bell', ws(27), f=1479.98, d=1.4, gain=0.22)
# the easy way to the sun
F('riser', ws(34) - 0.1, d=ws(40) - ws(34), gain=0.14, f0=400, f1=2600); F('bell', ws(40), f=1760.0, d=1.6, gain=0.26); F('pop', ws(30), f=1100, gain=0.24)
# the market: clever, restless, no way without understanding it
F('impact', T['markets'], size=0.6, gain=0.35); run(T['markets'], 1.4, 12, 1800, 10, 0.08)
F('tick', ws(51), f=2600, level=0.45); F('tick', ws(53), f=3000, level=0.45); F('downlifter', ws(57), d=0.8, gain=0.18); F('fail', ws(59), gain=0.24)
# the magnifier finds the one
run(T['seek'], ws(69) - T['seek'] - 0.1, 10, 2000, 20, 0.08); F('bell', ws(69), f=1479.98, d=1.4, gain=0.28); F('pop', ws(70), f=1200, gain=0.26)
# the market's past
F('bell', ws(80), f=1108.73, d=1.6, gain=0.24); F('pop', ws(78), f=900, gain=0.24)
# BacktestLab: the replay, the data range, winners and losers
F('impact', ws(83), size=1.0, gain=0.5); F('bell', ws(83) + 0.1, f=1760.0, d=1.6, gain=0.24); F('tick', ws(86), f=2800, level=0.45)
run(ws(86), ws(91) - ws(86) - 0.1, 10, 1900, 10, 0.08); F('pop', ws(91), f=1300, gain=0.3); F('pop', ws(92), f=900, gain=0.28)
# the repeat
F('riser', ws(95) - 0.1, d=ws(99) - ws(95) + 0.3, gain=0.14, f0=500, f1=3000); F('tick', ws(98), f=3000, level=0.45)
# this time it's you
F('pop', ws(104), f=1100, gain=0.28); F('impact', ws(106), size=0.7, gain=0.4); F('bell', ws(106) + 0.05, f=1479.98, d=1.6, gain=0.28)
# follow
F('pop', ws(109), f=1200, gain=0.28); F('tick', ws(114), f=3400, level=0.6); F('bell', ws(114) + 0.12, f=1760.0, d=1.0, gain=0.22)
# years of the market
F('pop', ws(121), f=1000, gain=0.26); run(ws(122) - 0.1, ws(125) - ws(122) + 0.5, 11, 2200, 30, 0.14); F('pop', ws(127), f=1400, gain=0.3)
F('impact', T['end'], size=0.8, gain=0.4); F('bell', T['end'] + 0.45, f=1479.98, d=2.0, gain=0.3)
BAR = round(60 / 104 * 4, 4); G0 = round(T['brand'] % BAR, 4)
spec = {'seed': 73, 'dur': DUR, 'grid0': G0, 'bar': BAR, 'fade_from': DUR - 1.4, 'chords': CH, 'prog': ['F#m', 'D', 'A', 'E'],
        'groove': [[T['markets'], T['seek'] - 0.2], [T['brand'], DUR - 0.6]],
        'full': [[T['brand'], T['repeat']], [T['you'], T['end']]],
        'clap': [[T['brand'], DUR - 0.6]], 'dark': [[T['markets'], T['seek'] - 0.2]],
        'arp': [[0, T['markets']], [T['seek'], T['brand']], [T['repeat'], T['you']], [T['end'], DUR]], 'hats': [[T['markets'], DUR - 1.0]],
        'outro_bass': [T['seek'], T['brand'] - 0.1], 'rolls': [[T['brand'] - 0.7, T['brand'] - 0.03]], 'fx': fx, 'ticks': ticks}
json.dump(spec, open('music.json', 'w'), indent=1)
subprocess.run(['python3', '../../reelkit/soundgen.py', 'music.json', 'music.wav'], check=True)
SR = 48000; N = int(DUR * SR)
w = wave.open('music.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32768.0; w.close()
out = np.zeros((N, 2)); out[:min(N, len(mus))] = mus[:N]
vw = wave.open('voice/vo.wav'); vo = np.frombuffer(vw.readframes(vw.getnframes()), np.int16) / 32768.0; vw.close()
v = np.zeros(N); m_ = min(N, len(vo)); v[:m_] = vo[:m_]
env = np.convolve(np.abs(v), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); act = (env > 0.01).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); out *= (1 - 0.5 * np.clip(act, 0, 1))[:, None]
out /= np.abs(out).max() + 1e-9; out *= 0.4
out += np.stack([v, v], 1) / (np.abs(v).max() + 1e-9) * 0.85
out = np.tanh(out * 1.2) / np.tanh(1.2)
w = wave.open('mix-raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out * 0.97, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'mix-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,alimiter=limit=0.8:attack=2:release=40:level=0")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'mix-raw.wav', '-af', af, '-ar', str(SR), 'mix.wav'], check=True)
print('mix.wav', DUR, 's; input', j['input_i'], 'LUFS')
