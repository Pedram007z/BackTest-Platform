# k12's timeline: the voice's word times and scene starts (voice/build.py → voice/timing.json).
#   python3 data.py
import json
t = json.load(open('voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's')
