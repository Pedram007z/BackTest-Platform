"""Canadian releases from Statistics Canada: for every weekday since 2015, the data tables published that
day and when (its Web Data Service, getChangedCubeList). A table changing on a day is the release.

    python3 tools/calendar/ca_releases.py WORK_DIR [OUT.json] [--csv OUT.csv]

The days are saved in WORK_DIR/statcan/days.jsonl as they are fetched (about 3,000 requests, 3 a second);
a run continues where the last one stopped, and the days since are fetched on the next run.
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import START, TODAY, write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
TZ = 'America/Toronto'

# table → events (title, impact)
TABLES = {
    14100287: [('Employment Change', 'high'), ('Unemployment Rate', 'high')],  # Labour Force Survey
    18100004: [('CPI m/m', 'high'), ('CPI y/y', 'medium')],  # Consumer Price Index
    36100434: [('GDP m/m', 'medium')],  # GDP by industry, monthly
    20100008: [('Retail Sales m/m', 'medium'), ('Core Retail Sales m/m', 'medium')],  # Retail trade
    12100011: [('Trade Balance', 'low')],  # International merchandise trade
}


def fetch_days():
    path = os.path.join(W, 'statcan', 'days.jsonl')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    have = {}
    if os.path.exists(path):
        for line in open(path):
            rec = json.loads(line)
            have[rec['date']] = rec['tables']
    d = dt.date.fromisoformat(START)
    end = dt.date.fromisoformat(TODAY) - dt.timedelta(days=1)
    with open(path, 'a') as out:
        while d <= end:
            key = d.isoformat()
            if d.weekday() < 5 and key not in have:
                for attempt in range(3):
                    try:
                        url = f'https://www150.statcan.gc.ca/t1/wds/rest/getChangedCubeList/{key}'
                        r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
                        break
                    except OSError:
                        if attempt == 2:
                            raise
                        time.sleep(5 * (attempt + 1))
                tables = {str(o['productId']): o['releaseTime'] for o in r.get('object', []) if r.get('status') == 'SUCCESS'}
                have[key] = tables
                out.write(json.dumps({'date': key, 'tables': tables}) + '\n')
                out.flush()
                time.sleep(0.33)
            d += dt.timedelta(days=1)
    return have


days = fetch_days()
released = {}  # table → {date: 'HH:MM'}
for key, tables in days.items():
    for pid, when in tables.items():
        if int(pid) in TABLES:
            released.setdefault(int(pid), {})[when[:10]] = when[11:16]

events = []
for pid, items in TABLES.items():
    for date, hhmm in sorted(released.get(pid, {}).items()):
        for title, impact in items:
            events.append({'ccy': 'CAD', 'tz': TZ, 'source': 'statcan.gc.ca', 'title': title, 'date': date, 'time': hhmm, 'impact': impact})

write(events, *sys.argv[2:])
