# k17's timeline: k16's voice cut (the same take at ×1.15: word times and scene starts, ../k16/data.json) and the
# mouth curves from that cut (vo.json, from ../char/voicefeat.py).
#   python3 ../char/voicefeat.py ../k16/voice/vo.wav vo.json --fps 30 && python3 data.py
import json
d = json.load(open('../k16/data.json')); vo = json.load(open('vo.json'))
json.dump({'T': d['T'], 'w': d['w'], 'dur': d['dur'], 'vo': vo}, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(d['w']), 'words,', d['dur'], 's,', len(vo['open']), 'mouth frames')
