# Mouth-movement curves from a voice recording, for talkState() in char-kit.js.
#   python3 voicefeat.py voice.wav|mp3 out.json [--start 0] [--end dur] [--offset 0] [--fps 30]
# open: loudness per frame (RMS over 40 ms, in dB: the loudest syllables reach 1, 12 dB below them about 0.45), with a fast attack,
# a slower release and a short lead so the mouth moves just before the sound. wide: bright sounds (ee, s) push it up,
# dark ones (oo, o) down, from the 2–5 kHz vs 300–1000 Hz energy balance. --offset shifts the curves to where the
# voice sits in the reel.
import sys, json, subprocess, argparse
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--start', type=float, default=0); ap.add_argument('--end', type=float, default=None)
ap.add_argument('--offset', type=float, default=0); ap.add_argument('--fps', type=int, default=30)
a = ap.parse_args(); SR = 16000
cmd = ['ffmpeg', '-v', 'error', '-ss', str(a.start)] + (['-to', str(a.end)] if a.end else []) + ['-i', a.src, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-']
x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
hop = SR / a.fps; win = int(0.04 * SR); nf = int(len(x) / hop) + 1
db = np.full(nf, -90.0); tilt = np.zeros(nf)
fr = np.fft.rfftfreq(1024, 1 / SR); lo_b = (fr > 300) & (fr < 1000); hi_b = (fr > 2000) & (fr < 5000)
for i in range(nf):
    c = int(i * hop + hop / 2); seg = x[max(0, c - win // 2): c + win // 2]
    if len(seg) < 64: continue
    db[i] = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-6)
    sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), 1024)) ** 2
    tilt[i] = 10 * np.log10((sp[hi_b].sum() + 1e-9) / (sp[lo_b].sum() + 1e-9))
voiced = db > np.percentile(db, 30)
top = np.percentile(db[voiced], 95) if voiced.any() else -20
o = np.clip((db - (top - 30)) / 30, 0, 1) ** 1.5
# fast attack, slower release
sm = np.zeros(nf); v = 0.0
for i in range(nf): v = o[i] if o[i] > v else v + (o[i] - v) * 0.45; sm[i] = v
sm = np.concatenate([sm[1:], sm[-1:]])        # one frame of lead
w = np.zeros(nf)
if voiced.any():
    mu, sd = tilt[voiced].mean(), tilt[voiced].std() + 1e-6
    w = np.clip((tilt - mu) / sd * 0.45, -1, 1) * (sm > 0.08)
    w = np.convolve(w, np.ones(3) / 3, 'same')
pad = int(round(a.offset * a.fps))
sm = np.concatenate([np.zeros(max(0, pad)), sm]); w = np.concatenate([np.zeros(max(0, pad)), w])
json.dump({'fps': a.fps, 'open': [round(float(v), 3) for v in sm], 'wide': [round(float(v), 3) for v in w]}, open(a.out, 'w'), separators=(',', ':'))
print('ok', a.out, len(sm), 'frames; mean open', round(float(sm[sm > 0.05].mean()) if (sm > 0.05).any() else 0, 2))
