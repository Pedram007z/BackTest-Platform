# Writes index.html from template.html: the lucide icons (icons.json) and real BTC/USD 12-hour candles (candles.json,
# the same ones as reel m8) go in inline. usage: python3 build.py
import json, os
here = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(here, 'template.html')).read()
t = t.replace('/*ICONS*/', open(os.path.join(here, 'icons.json')).read().strip())
t = t.replace('/*CANDLES*/', json.dumps(json.load(open(os.path.join(here, 'candles.json')))['candles']))
open(os.path.join(here, 'index.html'), 'w').write(t)
print('ok')
