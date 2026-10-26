"""US economic releases since 2015: release dates from FRED (the St. Louis Fed), times from the agencies'
fixed release times. No values.

    FRED_API_KEY=… python3 tools/calendar/us_releases.py WORK_DIR [OUT.json] [--csv OUT.csv] [--refresh]

The release dates are downloaded once into WORK_DIR/fred/ (--refresh downloads them again for new
dates). FRED lists each release on the day it came out (and the dates scheduled ahead); a past date
FRED only had scheduled (a release moved by the 2018-19 or 2025 government shutdowns) is left out.

Releases FRED does not carry are placed by their publisher's fixed rule and marked with `basis`:
ISM Manufacturing PMI (1st business day, 10:00), ISM Services PMI (3rd business day, 10:00), the
Conference Board's Consumer Confidence (last Tuesday, 10:00), the EIA's crude oil inventories
(Wednesday 10:30; Thursday 11:00 after a Monday holiday) and the University of Michigan's preliminary
sentiment (two weeks before the final reading, which FRED has).
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
KEY = os.environ.get('FRED_API_KEY', '')
NY = 'America/New_York'

# FRED release id → events (title, impact, time ET); impacts as in the app's sample calendar
RELEASES = {
    50: [('Non-Farm Employment Change', 'high', '08:30'), ('Unemployment Rate', 'high', '08:30'), ('Average Hourly Earnings m/m', 'high', '08:30')],
    10: [('CPI m/m', 'high', '08:30'), ('Core CPI m/m', 'high', '08:30'), ('CPI y/y', 'high', '08:30')],
    46: [('PPI m/m', 'medium', '08:30'), ('Core PPI m/m', 'medium', '08:30')],
    9: [('Retail Sales m/m', 'high', '08:30'), ('Core Retail Sales m/m', 'high', '08:30')],
    54: [('Core PCE Price Index m/m', 'high', '08:30'), ('Personal Spending m/m', 'medium', '08:30'), ('Personal Income m/m', 'low', '08:30')],
    192: [('JOLTS Job Openings', 'high', '10:00')],
    180: [('Unemployment Claims', 'medium', '08:30')],
    194: [('ADP Non-Farm Employment Change', 'high', '08:15')],
    321: [('Empire State Manufacturing Index', 'medium', '08:30')],
    351: [('Philly Fed Manufacturing Index', 'medium', '08:30')],
    97: [('New Home Sales', 'medium', '10:00')],
    51: [('Trade Balance', 'low', '08:30')],
    13: [('Industrial Production m/m', 'low', '09:15'), ('Capacity Utilization Rate', 'low', '09:15')],
}
GDP, M3, UMICH = 53, 95, 91


def release_dates(rid):
    """(dates it came out, dates scheduled ahead) of a FRED release."""
    out = []
    for with_no_data in ('false', 'true'):
        path = os.path.join(W, 'fred', f'r{rid}-{with_no_data}.json')
        if not os.path.exists(path) or '--refresh' in sys.argv:
            if not KEY:
                sys.exit('FRED_API_KEY is not set (fred.stlouisfed.org → My Account → API Keys)')
            os.makedirs(os.path.dirname(path), exist_ok=True)
            url = (f'https://api.stlouisfed.org/fred/release/dates?release_id={rid}&api_key={KEY}&file_type=json'
                   f'&realtime_start=2014-12-01&realtime_end=9999-12-31&include_release_dates_with_no_data={with_no_data}&sort_order=asc&limit=10000')
            open(path, 'wb').write(urllib.request.urlopen(url, timeout=90).read())
            time.sleep(0.6)
        out.append([d['date'] for d in json.load(open(path))['release_dates']])
    came_out, all_dates = set(out[0]), set(out[1])
    return came_out, {d for d in all_dates - came_out if d >= TODAY}


def json_dates(rid):
    """All the dates of a release FRED has, with data or only scheduled."""
    return {d['date'] for d in json.load(open(os.path.join(W, 'fred', f'r{rid}-true.json')))['release_dates']}


def vintage_dates(series):
    """The days a FRED series changed: its headline release dates (revisions in other tables don't count)."""
    path = os.path.join(W, 'fred', f'v-{series}.json')
    if not os.path.exists(path) or '--refresh' in sys.argv:
        if not KEY:
            sys.exit('FRED_API_KEY is not set (fred.stlouisfed.org → My Account → API Keys)')
        url = (f'https://api.stlouisfed.org/fred/series/vintagedates?series_id={series}&api_key={KEY}&file_type=json'
               f'&realtime_start=2014-12-01&realtime_end=9999-12-31&limit=10000')
        open(path, 'wb').write(urllib.request.urlopen(url, timeout=90).read())
        time.sleep(0.6)
    return set(json.load(open(path))['vintage_dates'])


events = []


def ev(title, impact, date, time_, basis=None):
    if date >= START:
        events.append({'ccy': 'USD', 'tz': NY, 'source': 'fred.stlouisfed.org' if not basis else 'rule', 'title': title, 'date': date, 'time': time_, 'impact': impact, **({'basis': basis} if basis else {})})


def headline(rid, dates):
    """Drop the dates FRED lists for revisions rather than the monthly release: seasonal-factor revisions in
    early February (CPI, PPI), annual revisions late in the month (retail sales, industrial production),
    January's revision a week before the Philadelphia survey, two corrections to payrolls (May 2020,
    January 2024). Months with two real releases (catch-ups after the shutdowns) keep both."""
    by_month = {}
    for d in sorted(dates):
        by_month.setdefault(d[:7], []).append(d)
    keep = set()
    for month, ds in by_month.items():
        days = [int(d[8:]) for d in ds]
        if len(ds) == 1:
            keep |= set(ds)
        elif rid in (10, 46) and month.endswith('-02') or rid == 351 and month.endswith('-01'):
            keep.add(ds[-1])
        elif rid == 50:
            keep.add(ds[0])
        elif rid in (9, 13) and any(12 <= x <= 19 for x in days):
            keep |= {d for d, x in zip(ds, days) if 12 <= x <= 19 or (rid == 9 and x < 23)}
        else:
            keep |= set(ds)
    return keep


# ---------- releases with their dates on FRED ----------
for rid, items in RELEASES.items():
    past, ahead = release_dates(rid)
    dates = headline(rid, past) | ahead
    for d in sorted(dates):
        for title, impact, t in items:
            ev(title, impact, d, t)

# Housing starts and building permits: the days housing starts (HOUST) changed, and the release's dates
# ahead (FRED lists the construction release also on days its series change with new home sales)
_, ahead = release_dates(27)
for d in sorted(vintage_dates('HOUST') | (ahead - set().union(*release_dates(97)))):
    ev('Building Permits', 'medium', d, '08:30')
    ev('Housing Starts', 'medium', d, '08:30')

# GDP: the days real GDP (GDPC1) changed, and the dates ahead: advance (Jan, Apr, Jul, Oct), second and
# third estimates; the shutdowns moved some (BEA's notices: initial Q4 2018 estimate 28 Feb 2019, initial
# Q3 2025 estimate 23 Dec 2025 and its third-estimate equivalent 22 Jan 2026, Q4 2025 second estimate
# 13 Mar 2026 and third 9 Apr 2026)
_, ahead = release_dates(GDP)
GDP_KIND = {'2019-02-28': 'Advance', '2025-12-23': 'Advance', '2026-01-22': 'Final', '2026-02-20': 'Advance',
            '2026-03-13': 'Prelim', '2026-04-09': 'Final'}
for d in sorted(vintage_dates('GDPC1') | ahead):
    kind = GDP_KIND.get(d) or {1: 'Advance', 2: 'Prelim', 0: 'Final'}[int(d[5:7]) % 3]
    ev(f'{kind} GDP q/q', {'Advance': 'high', 'Prelim': 'medium', 'Final': 'low'}[kind], d, '08:30')
    if kind == 'Advance':
        ev('Advance GDP Price Index q/q', 'medium', d, '08:30')

# Manufacturers' shipments, inventories and orders: the advance durable goods report (around the 25th,
# 08:30) and the full report with factory orders (first days of the month, 10:00)
past, ahead = release_dates(M3)
for d in sorted(past | ahead):
    if 10 <= int(d[8:]) <= 17:
        continue  # annual revisions (mid-May)
    if int(d[8:]) >= 18:
        ev('Durable Goods Orders m/m', 'medium', d, '08:30')
        ev('Core Durable Goods Orders m/m', 'medium', d, '08:30')
    else:
        ev('Factory Orders m/m', 'low', d, '10:00')

# University of Michigan: FRED has the final reading (its dates without data in FRED too: the survey's
# data comes later); the preliminary one comes out two weeks before
past, ahead = release_dates(UMICH)
past |= {d for d in json_dates(UMICH) if d < TODAY}
for d in sorted(past | ahead):
    ev('Revised UoM Consumer Sentiment', 'low', d, '10:00')
    ev('Prelim UoM Consumer Sentiment', 'medium', (dt.date.fromisoformat(d) - dt.timedelta(days=14)).isoformat(), '10:00', 'two weeks before the final reading')


# ---------- by rule ----------
# Philadelphia Fed: FRED's dates start in June 2015; before that the third Thursday of the month
for m in range(1, 6):
    first = dt.date(2015, m, 1)
    ev('Philly Fed Manufacturing Index', 'medium', (first + dt.timedelta(days=(3 - first.weekday()) % 7 + 14)).isoformat(), '08:30', 'third Thursday of the month')

def holidays(y):
    """US federal holidays (observed) of year y."""
    def nth(month, weekday, n):
        d = dt.date(y, month, 1)
        d += dt.timedelta(days=(weekday - d.weekday()) % 7)
        return d + dt.timedelta(weeks=n - 1)

    def last(month, weekday):
        d = dt.date(y + (month == 12), month % 12 + 1, 1) - dt.timedelta(days=1)
        return d - dt.timedelta(days=(d.weekday() - weekday) % 7)

    def observed(d):
        return d + dt.timedelta(days=1) if d.weekday() == 6 else d - dt.timedelta(days=1) if d.weekday() == 5 else d
    days = {observed(dt.date(y, 1, 1)), nth(1, 0, 3), nth(2, 0, 3), last(5, 0), observed(dt.date(y, 7, 4)), nth(9, 0, 1),
            nth(10, 0, 2), observed(dt.date(y, 11, 11)), nth(11, 3, 4), observed(dt.date(y, 12, 25))}
    if y >= 2022:
        days.add(observed(dt.date(y, 6, 19)))
    return days


HOLIDAYS = set().union(*(holidays(y) for y in range(2014, 2030)))
business = lambda d: d.weekday() < 5 and d not in HOLIDAYS
last_day = dt.date(int(TODAY[:4]) + 1, 12, 31)
for y in range(2015, last_day.year + 1):
    for m in range(1, 13):
        days = [dt.date(y, m, 1) + dt.timedelta(days=i) for i in range(31) if (dt.date(y, m, 1) + dt.timedelta(days=i)).month == m]
        work = [d for d in days if business(d)]
        ev('ISM Manufacturing PMI', 'high', work[0].isoformat(), '10:00', 'first business day of the month')
        ev('ISM Services PMI', 'high', work[2].isoformat(), '10:00', 'third business day of the month')
        tuesday = [d for d in days if d.weekday() == 1][-1]
        ev('CB Consumer Confidence', 'high', tuesday.isoformat(), '10:00', 'last Tuesday of the month')
d = dt.date(2015, 1, 7)  # a Wednesday
while d <= last_day:
    if (d - dt.timedelta(days=2)) in HOLIDAYS or d in HOLIDAYS:
        ev('Crude Oil Inventories', 'low', (d + dt.timedelta(days=1)).isoformat(), '11:00', 'Thursday 11:00 after a Monday or Wednesday holiday')
    else:
        ev('Crude Oil Inventories', 'low', d.isoformat(), '10:30', 'Wednesday 10:30')
    d += dt.timedelta(days=7)

# rule-based events only up to the end of next year; FRED's only as far as scheduled
write(events, *sys.argv[2:])
