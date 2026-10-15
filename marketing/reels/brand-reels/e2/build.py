# e2 · «چند ثانیه تا خبر NFP…»: the excitement reel. The trader replays gold on the 1-minute chart on 1 Aug 2025,
# buys seconds before the US jobs report (12:30 UTC, 16:00 Tehran), the release candle runs through his target
# (+$399.64 at 2% risk, +2R; real prices from the platform's store), he celebrates; a fast replay and a second
# real target hit (9 Apr 2025, 1h); then the line and the logo. Music only, 120 BPM (a bar is 2 s).
#   python3 build.py && python3 ../mkpage_e.py e2 && python3 sound.py
import json
T = {'order': 2.4, 'c3': 4.0, 'c2': 4.6, 'c1': 5.2, 'black': 5.8, 'drop': 6.0, 'cheer': 6.9, 'mont': 9.6, 'win': 11.3, 'tp': 12.5,
     'line': 13.2, 'end': 15.8}
json.dump({'t': T, 'dur': 18.5, 'place': [], 'lens': [], 'lines': []}, open('data.json', 'w'))
print(T)
