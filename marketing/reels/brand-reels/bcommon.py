# Shared steps for the backtesting reels b1–b3 (voiced by the user): the timeline from the cut voice lines,
# the voice track (vo.wav), and timing markers on spoken words.
#
#   python3 cut.py bN t1 1.0 tight          # t1.mp3 + t1.words.json → line01..wav, lens.json
#   cd bN && python3 build.py && cd ..       # data.json + vo.wav (markers estimated)
#   python3 transcribe.py bN/vo.wav bN/vo.words.json
#   cd bN && python3 build.py && cd ..       # markers from the words as heard in vo.wav
import json, os, re, subprocess

def norm(s):
    s = re.sub(r'[ً-ْ‌‍.،,؛؟?!…:«»\-—]', '', s)
    for a, b in [('ي', 'ی'), ('ك', 'ک'), ('ة', 'ه'), ('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ؤ', 'و'), ('ئ', 'ی'), ('ٔ', '')]: s = s.replace(a, b)
    return re.sub(r'\s+', '', s)

def timeline(gaps, lead=0.15, tail=1.5):
    """Places of the voice lines: each line after the previous one plus its gap; the reel ends `tail` s after the last."""
    lens = json.load(open('lens.json'))
    place, t = [], lead
    for k, L in enumerate(lens):
        place.append(round(t, 3)); t += L + (gaps[k] if k < len(gaps) else 0.22)
    return place, lens, round(place[-1] + lens[-1] + tail, 2)

def voice(place, dur):
    """The voice lines laid at their places (vo.wav), for the markers and the mix."""
    ins, flt = [], []
    for k, t in enumerate(place):
        ins += ['-i', f'line{k + 1:02d}.wav']; flt.append(f'[{k}]adelay={int(t * 1000)}:all=1[a{k}]')
    flt.append(''.join(f'[a{k}]' for k in range(len(place))) + f'amix=inputs={len(place)}:normalize=0,apad=whole_dur={dur}[vo]')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(flt), '-map', '[vo]', '-ar', '48000', '-ac', '1', '-t', str(dur), 'vo.wav'], check=True)

def markers(spec, place, lens):
    """spec: {name: (word, line index)} → the time the word starts in the reel.
    From vo.words.json (whisper on vo.wav) when it exists, else estimated from the take's own timings."""
    out = {}
    heard = json.load(open('vo.words.json')) if os.path.exists('vo.words.json') else None
    lines = json.load(open('lines.json'))
    for name, (word, k) in spec.items():
        # '=word' matches the whole word only (so «پنج» does not find «پنجاه»)
        exact = word.startswith('='); w = norm(word.lstrip('='))
        if heard:
            lo, hi = place[k] - 0.4, place[k] + lens[k] + 0.4
            hit = [x for x in heard if lo <= x[0] <= hi and (w == norm(x[2]) if exact else w in norm(x[2]))]
            if hit: out[name] = round(hit[0][0], 2); continue
            print('  marker not heard, estimated:', name, word)
        # estimate: where the word starts in the line, by characters
        pos, at = 0, 0
        for wd in lines[k][0].split():
            nw = norm(wd)
            if (nw == w if exact else w in nw): at = pos; break
            pos += len(nw)
        out[name] = round(place[k] + lens[k] * at / max(1, len(norm(lines[k][0]))), 2)
    return out
