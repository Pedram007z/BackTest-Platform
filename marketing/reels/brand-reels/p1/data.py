# p1: data.json = the voice timing (voice/timing.json from voice/build.py) + the gold chart (chart.json from gold.py).
import json
t = json.load(open('voice/timing.json')); c = json.load(open('chart.json')); c['jalali'] = '۲۳ مرداد ۱۴۰۵'   # 2026-08-14
json.dump({'T': t['T'], 'w': t['w'], 'dur': t['dur'], 'chart': c}, open('data.json', 'w'), ensure_ascii=False); print('data.json', t['dur'], 's')
