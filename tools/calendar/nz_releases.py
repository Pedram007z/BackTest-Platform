"""New Zealand releases from Stats NZ: each information release's page carries its publication time
("PublicationDate": "2018-06-21 10:45:00", NZ time). Pages are found by their address, one per period
("consumers-price-index-march-2018-quarter"). Stats NZ's current site has releases from about mid-2017;
its archived site (earlier releases) does not answer.

    python3 tools/calendar/nz_releases.py WORK_DIR [OUT.json] [--csv OUT.csv]

Pages are saved in WORK_DIR/statsnz/ (one request a second); a run fetches only pages it does not have
(and periods not published yet again).
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schedule import write  # noqa: E402

W = sys.argv[1]
UA = {'User-Agent': 'backtestlab-calendar (economic calendar dates; github.com/Pedram007z/BackTest-Platform)'}
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

# page address prefix, quarterly?, events (title, impact)
SERIES = [
    ('consumers-price-index', True, [('CPI q/q', 'high')]),
    ('gross-domestic-product', True, [('GDP q/q', 'high')]),
    ('labour-market-statistics', True, [('Employment Change q/q', 'high'), ('Unemployment Rate', 'high')]),
    ('retail-trade-survey', True, [('Retail Sales q/q', 'medium')]),
    ('overseas-merchandise-trade', False, [('Trade Balance', 'low')]),
]
_last = 0.0


def page(slug):
    """The publication time of a release page, or None; a period not published yet is asked again next run."""
    global _last
    path = os.path.join(W, 'statsnz', slug + '.txt')
    if os.path.exists(path):
        return open(path).read() or None
    for attempt in range(3):
        time.sleep(max(0, 1.0 - (time.time() - _last)) + 5 * attempt)
        _last = time.time()
        try:
            body = urllib.request.urlopen(urllib.request.Request(f'https://www.stats.govt.nz/information-releases/{slug}/', headers=UA), timeout=90).read().decode('utf-8', 'replace')
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == 2:
                raise
        except OSError:
            if attempt == 2:
                raise
    m = re.search(r'PublicationDate&quot;:&quot;(\d{4}-\d{2}-\d{2} \d{2}:\d{2})', body) or re.search(r'"PublicationDate":"(\d{4}-\d{2}-\d{2} \d{2}:\d{2})', body)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w').write(m.group(1) if m else '')
    return m.group(1) if m else None


today = dt.date.today()
events = []
for prefix, quarterly, items in SERIES:
    found = 0
    for y in range(2014, today.year + 1):
        for m in (3, 6, 9, 12) if quarterly else range(1, 13):
            if dt.date(y, m, 1) >= today.replace(day=1):
                continue
            when = page(f'{prefix}-{MONTHS[m - 1]}-{y}' + ('-quarter' if quarterly else ''))
            if not when:
                continue
            found += 1
            for title, impact in items:
                events.append({'ccy': 'NZD', 'tz': 'Pacific/Auckland', 'source': 'stats.govt.nz', 'title': title, 'date': when[:10], 'time': when[11:16], 'impact': impact})
    print(prefix, found, file=sys.stderr)

write(events, *sys.argv[2:])
