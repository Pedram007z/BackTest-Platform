# k11's timeline: the voice's word times and scene starts (voice/build.py → voice/timing.json), plus two cuts used by
# the colour-block look (blocks.js), each 0.05 s before its word: «حداقل یه بار» (run, word 47) and «با حدس» (guess, 111).
#   python3 data.py
import json
t = json.load(open('voice/timing.json'))
T = dict(t['T'])
for k, i in (('run', 47), ('guess', 111)): T[k] = round(t['w'][i][0] - 0.05, 3)
json.dump({'T': T, 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's')
