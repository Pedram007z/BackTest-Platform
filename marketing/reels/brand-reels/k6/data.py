# k6's timeline: the voice's word times and scene starts (voice/build.py → voice/timing.json), and the three strategies'
# real results from the platform (results.json, copied from k5: k5's capture/shots.mjs wrote it).   python3 data.py
import json
t = json.load(open('voice/timing.json'))
res = json.load(open('results.json'))
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'res': res}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's;', len(res['cards']), 'strategies')
