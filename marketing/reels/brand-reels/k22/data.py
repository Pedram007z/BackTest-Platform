# k22's timeline: the user's take at its normal speed (k21's voice cut: ../k21/voice/timing.json, no speed-up, the
# natural pauses kept).
#   python3 data.py
import json
d = json.load(open('../k21/voice/timing.json'))
json.dump({'T': d['T'], 'w': d['w'], 'dur': d['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(d['w']), 'words,', d['dur'], 's')
