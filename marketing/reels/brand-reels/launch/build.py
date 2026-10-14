# Launch reel, version 1 (music only): scene times (data.json) and the score (sound.json).
# The scenes are cut on a 120 bpm grid (a beat every 0.5 s, bars from 0.5 s).
import json
from score import TB, score

DUR = 39.0
json.dump({'t': TB, 'dur': DUR, 'place': [], 'lens': [], 'lines': []}, open('data.json', 'w'), ensure_ascii=False)
sp = score(TB, DUR)
json.dump(sp, open('sound.json', 'w'), indent=1)
print('dur', DUR, 'fx', len(sp['fx']))
