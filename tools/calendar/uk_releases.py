"""UK releases from the Office for National Statistics' release calendar (its API has every published
release since February 2016, with the exact time; earlier ones are not in it).

    python3 tools/calendar/uk_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

Searches are saved in WORK_DIR/ons/ (--refresh searches again). A release's titles changed over the
years ("UK consumer price inflation" until January 2018, "Consumer price inflation, UK" since), so each
series is a list of title patterns. The ONS moved its market releases from 09:30 to 07:00 UK time; the
calendar's timestamps (UTC) say which applied.
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}

# series: title patterns (lower case, before the ":") → events (title, impact)
SERIES = [
    (r'(uk )?consumer price inflation(, uk)?', [('CPI y/y', 'high'), ('Core CPI y/y', 'medium'), ('CPI m/m', 'low')]),
    (r'(uk )?producer price inflation(, uk)?', [('PPI Input m/m', 'low'), ('PPI Output m/m', 'low')]),
    # the labour market release, and its regional companion published with it (the only one listed for some months)
    (r'uk labour market( statistics)?|regional labour market statistics|labour market in the regions of the uk', [('Claimant Count Change', 'medium'), ('Average Earnings Index 3m/y', 'high'), ('Unemployment Rate', 'medium')]),
    (r'gdp monthly estimate, uk', [('GDP m/m', 'medium')]),
    (r'gross domestic product, preliminary estimate|uk gdp, preliminary estimate|gdp first quarterly estimate, uk', [('Prelim GDP q/q', 'high')]),
    (r'uk gdp, second estimate', [('Second Estimate GDP q/q', 'medium')]),
    (r'(uk )?quarterly national accounts|gdp quarterly national accounts, uk', [('Final GDP q/q', 'low')]),
    (r'retail sales(,| in) great britain', [('Retail Sales m/m', 'medium')]),
]
QUERIES = ['consumer price inflation', 'producer price inflation', 'labour market', 'regional labour market statistics',
           'GDP monthly estimate', 'GDP preliminary estimate', 'GDP first quarterly estimate', 'GDP second estimate',
           'quarterly national accounts', 'retail sales Great Britain']


def search(query):
    path = os.path.join(W, 'ons', re.sub(r'\W+', '-', query.lower()) + '.json')
    if os.path.exists(path) and '--refresh' not in sys.argv:
        return json.load(open(path))
    out, offset = [], 0
    while True:
        url = 'https://api.beta.ons.gov.uk/v1/search/releases?' + urllib.parse.urlencode({'query': query, 'limit': 100, 'offset': offset, 'release-type': 'type-published'})
        d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90))
        page = d.get('releases', [])
        out += [{'title': r['description']['title'], 'date': r['description']['release_date']} for r in page]
        offset += 100
        time.sleep(0.5)
        if not page or offset >= min(d['breakdown']['published'], 3000):
            break
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, 'w'))
    return out


releases = {}
for q in QUERIES:
    for r in search(q):
        releases[(r['title'], r['date'])] = r

events = []
for pattern, items in SERIES:
    times = set()
    for r in releases.values():
        # "Retail Sales; Great Britain", "UK Labour Market April 2024": one name for each release
        name = r['title'].split(':')[0].strip().lower().replace(';', ',')
        name = re.sub(r'\s+', ' ', re.sub(r',? (january|february|march|april|may|june|july|august|september|october|november|december) \d{4}$', '', name))
        if 'time series' not in name and re.fullmatch(pattern, name):
            times.add(r['date'][:16])  # "YYYY-MM-DDTHH:MM", UTC
    for t in sorted(times):
        utc = dt.datetime.strptime(t, '%Y-%m-%dT%H:%M').replace(tzinfo=dt.timezone.utc)
        local = utc.astimezone(ZoneInfo('Europe/London'))
        for title, impact in items:
            events.append({'ccy': 'GBP', 'tz': 'Europe/London', 'source': 'ons.gov.uk', 'title': title,
                           'date': local.date().isoformat(), 'time': local.strftime('%H:%M'), 'impact': impact})

write(events, *sys.argv[2:])
