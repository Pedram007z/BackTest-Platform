# k5's timeline: the voice's word times and scene starts (voice/build.py → voice/timing.json), and the three strategies'
# real results from the platform (results.json, written by capture/shots.mjs).   python3 data.py
import json, os
t = json.load(open('voice/timing.json'))
res = json.load(open('results.json')) if os.path.exists('results.json') else []
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'res': res}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's;', len(res), 'strategies')
