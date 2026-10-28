# k3's timeline: the voice's word times and scene starts (voice/build.py → voice/timing.json), plus where the NFP flag
# sat in each replay frame (marks.json, from capture/cap.mjs).   python3 data.py
import json
t = json.load(open('voice/timing.json')); m = json.load(open('marks.json'))
nfpx = [max(f['r'][0] for f in fr['flags']) for fr in m['f']]
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'nfpx': nfpx}, open('data.json', 'w'), ensure_ascii=False)
print(len(t['w']), 'words,', t['dur'], 's; NFP flag x', nfpx[0], '→', nfpx[-1])
