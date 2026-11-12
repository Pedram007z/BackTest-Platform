# k18's timeline: k16's voice cut of the user's take (×1.15; word times and scene starts, ../k16/data.json).
#   python3 data.py
import json
d = json.load(open('../k16/data.json'))
json.dump({'T': d['T'], 'w': d['w'], 'dur': d['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(d['w']), 'words,', d['dur'], 's')
