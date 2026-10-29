# h1's timeline: the voice's word times and scene starts, shared with k7 (../k7/voice/build.py → ../k7/voice/timing.json).
#   python3 data.py
import json
t = json.load(open('../k7/voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's')
