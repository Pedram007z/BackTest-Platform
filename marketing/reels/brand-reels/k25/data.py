# k25's timeline: the user's take at its normal speed (voice/build.py → voice/timing.json).
#   python3 voice/build.py && python3 data.py
import json
t = json.load(open('voice/timing.json'))
json.dump({'w': t['w'], 'dur': t['dur'], 'end': t['T']['end']}, open('data.json', 'w'), separators=(',', ':'))
print(len(t['w']), 'words,', t['dur'], 's')
