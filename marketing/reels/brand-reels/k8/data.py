# k8's timeline: the voice's word times and scene starts, shared with t1 (../t1/voice/build.py → ../t1/voice/timing.json).
#   python3 data.py
import json
t = json.load(open('../t1/voice/timing.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's')
