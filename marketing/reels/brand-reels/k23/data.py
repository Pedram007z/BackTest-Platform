# k23's timeline: k1's take at its normal speed (voice/build.py → voice/timing.json), the whisper words (for the
# subtitles, corrected in reel.js) and the mascot's mouth curves (vo.json, from ../char/voicefeat.py).
#   python3 voice/build.py && python3 ../char/voicefeat.py voice/vo.wav vo.json --fps 30 && python3 data.py
import json
t = json.load(open('voice/timing.json')); vo = json.load(open('vo.json')); raw = json.load(open('../k1/voice/t1.words.json'))
json.dump({'w': t['w'], 'dur': t['dur'], 'end': t['T']['end'], 'words': [x[2] for x in raw], 'vo': vo}, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(t['w']), 'words,', t['dur'], 's')
