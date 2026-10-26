"""Swiss releases from the Federal Statistical Office: its publication database lists every press release
with the time its embargo lifted (consumer prices since 2008; retail trade turnover until November 2024).

    python3 tools/calendar/ch_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

The lists are saved in WORK_DIR/bfs/ (--refresh fetches them again).
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.request
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
API = 'https://dam-api.bfs.admin.ch/hub/api/dam/assets?language=en&limit=500&articleModel=900011&prodima={}'  # press releases on a topic
ZURICH = ZoneInfo('Europe/Zurich')

# topic id, pattern for the release's titles ("Swiss Consumer Price Index in May 2026"), events (title, impact)
TOPICS = [
    (900086, r'consumer price index in', [('CPI m/m', 'medium'), ('CPI y/y', 'low')]),
    # retail trade turnover ("Retail trade turnover growth in May 2015", "Retail trade turnover | Swiss retail trade
    # turnover rises in June 2018"); the office stopped these press releases after November 2024
    (901342, r'^(swiss )?retail trade turnover', [('Retail Sales y/y', 'low')]),
]

events = []
for topic, pattern, items in TOPICS:
    path = os.path.join(W, 'bfs', f'{topic}.json')
    if not os.path.exists(path) or '--refresh' in sys.argv:
        data = urllib.request.urlopen(urllib.request.Request(API.format(topic), headers=UA), timeout=90).read()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'wb').write(data)
        time.sleep(1)
    days = {}
    for asset in json.load(open(path))['data']:
        embargo = asset['bfs'].get('embargo')
        titles = asset['description']['titles']
        if embargo and (re.search(pattern, titles.get('super') or '', re.I) or re.search(pattern, titles.get('main') or '', re.I)):
            local = dt.datetime.strptime(embargo[:16], '%Y-%m-%dT%H:%M').replace(tzinfo=dt.timezone.utc).astimezone(ZURICH)
            days.setdefault(local.date().isoformat(), local.strftime('%H:%M'))
    for day, hhmm in sorted(days.items()):
        if day >= START:
            for title, impact in items:
                events.append({'ccy': 'CHF', 'tz': 'Europe/Zurich', 'source': 'bfs.admin.ch', 'title': title, 'date': day, 'time': hhmm, 'impact': impact})
    print(topic, len(days), file=sys.stderr)

write(events, *sys.argv[2:])
