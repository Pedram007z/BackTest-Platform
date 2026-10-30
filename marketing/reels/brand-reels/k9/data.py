# k9's timeline: the voice's word times and scene starts, shared with dg1 (../dg1/voice/build.py → ../dg1/voice/timing.json),
# plus three cuts of k9's own, each 0.05 s before its word:
#   - «نه با پول واقعی» (safe, word 43);
#   - «یا یه استراتژی داری» (know, word 66);
#   - «یا صد تا معامله‌ی بد» (bad, word 77).
#   python3 data.py
import json
t = json.load(open('../dg1/voice/timing.json'))
T = dict(t['T'])
for k, i in (('safe', 43), ('know', 66), ('bad', 77)): T[k] = round(t['w'][i][0] - 0.05, 3)
json.dump({'T': T, 'w': t['w'], 'dur': t['dur']}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's;', '  '.join(f'{k} {v:.2f}' for k, v in sorted(T.items(), key=lambda x: x[1])))
