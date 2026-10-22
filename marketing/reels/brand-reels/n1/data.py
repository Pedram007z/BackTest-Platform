# n1: data.json = the voice timing (voice/timing.json from voice/build.py) + the real gold daily candles that q1 also
# uses (XAUUSD, 29 Aug – 16 Sep 2025, days closing at 17:00 New York; built by ../q1/data.py from the stored 1-minute data).
import json
t = json.load(open('voice/timing.json')); gold = json.load(open('../q1/data.json'))['gold']
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'gold': gold}, open('data.json', 'w'), ensure_ascii=False); print('data.json', t['dur'], 's')
