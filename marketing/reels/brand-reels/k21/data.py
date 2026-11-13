# k21's timeline: k16's take at its normal speed (voice/build.py → voice/timing.json) and the host's mouth curves from it
# (vo.json, from ../char/voicefeat.py).
#   python3 voice/build.py && python3 ../char/voicefeat.py voice/vo.wav vo.json --fps 30 && python3 data.py
import json
d = json.load(open('voice/timing.json')); vo = json.load(open('vo.json'))
json.dump({'T': d['T'], 'w': d['w'], 'dur': d['dur'], 'vo': vo}, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(d['w']), 'words,', d['dur'], 's,', len(vo['open']), 'mouth frames')
