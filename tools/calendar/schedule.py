"""Shared by the calendar collectors: events in local time → the schedule file (UTC) and a table to read.

An event: {'ccy', 'tz', 'source', 'title', 'date' (local YYYY-MM-DD), 'time' (local HH:MM, or None when
not fixed), 'impact', optional 'basis'}.
"""
import datetime as dt
import hashlib
import json
import sys
from zoneinfo import ZoneInfo

START = '2015-01-01'
TODAY = dt.date.today().isoformat()


def write(events, *args):
    """Write the events (deduplicated, in time order) to the .json in `args`, and to --csv FILE."""
    out = {}
    for e in events:
        y, m, d = map(int, e['date'].split('-'))
        hh, mm = map(int, (e['time'] or '12:00').split(':'))  # no fixed time: local noon, marked tentative
        utc = dt.datetime(y, m, d, hh, mm, tzinfo=ZoneInfo(e['tz'])).astimezone(dt.timezone.utc)
        rec = {
            'id': 'sch-' + hashlib.sha1(f"{e['ccy']}|{e['title']}|{e['date']}".encode()).hexdigest()[:12],
            'time': int(utc.timestamp() * 1000),
            'currency': e['ccy'],
            'title': e['title'],
            'impact': e['impact'],
        }
        if not e['time']:
            rec['tentative'] = True
        rec['source'] = e['source']
        if e.get('basis'):
            rec['basis'] = e['basis']
        rec['_utc'], rec['_local'] = utc.strftime('%Y-%m-%d %H:%M'), f"{e['date']} {e['time'] or '--:--'} {e['tz']}"
        out[rec['id']] = rec
    rows = sorted(out.values(), key=lambda r: (r['time'], r['currency'], r['title']))
    args = list(args)
    target = next((a for a in args if a.endswith('.json')), None)
    if target:
        with open(target, 'w') as f:
            f.write('[\n' + ',\n'.join(json.dumps({k: v for k, v in r.items() if not k.startswith('_')}, ensure_ascii=False) for r in rows) + '\n]\n')
    if '--csv' in args:
        with open(args[args.index('--csv') + 1], 'w') as f:
            f.write('utc,currency,impact,title,local_time,time_fixed,source,basis\n')
            for r in rows:
                f.write(f"{r['_utc']},{r['currency']},{r['impact']},\"{r['title']}\",{r['_local']},{'no' if r.get('tentative') else 'yes'},{r['source']},\"{r.get('basis', '')}\"\n")
    counts = {}
    for r in rows:
        counts[r['currency']] = counts.get(r['currency'], 0) + 1
    print(f"{len(rows)} events ({sum(1 for r in rows if r.get('tentative'))} without a fixed time, {sum(1 for r in rows if r.get('basis'))} by rule), "
          f"{rows[0]['_utc']} to {rows[-1]['_utc']}: {counts}", file=sys.stderr)
    return rows
