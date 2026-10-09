# Economic calendar schedule

When economic events happened since 2015, from the official sources, with no values (no actual,
forecast or previous). The API server will fill past calendar weeks with them where it has no other
calendar data.

```bash
python3 tools/calendar/fetch.py /tmp/calendar-pages            # download the official pages (1 a second)
python3 tools/calendar/central_banks.py /tmp/calendar-pages server/src/news/schedule/central-banks.json
python3 tools/calendar/fetch.py /tmp/calendar-pages --refresh  # later: take new decisions and dates ahead

# US releases: dates from FRED (free API key: fred.stlouisfed.org → My Account → API Keys)
FRED_API_KEY=… python3 tools/calendar/us_releases.py /tmp/calendar-pages server/src/news/schedule/us-releases.json
```

`central_banks.py --csv FILE` also writes a table to read (UTC time, currency, impact, title, local time).

## US releases (`server/src/news/schedule/us-releases.json`)

Release dates from FRED (the St. Louis Fed): payrolls, unemployment rate and earnings, CPI, PPI, retail
sales, Core PCE with personal income and spending, GDP (advance, second and third estimates), JOLTS,
jobless claims, ADP, Empire State and Philadelphia surveys, housing starts and permits, new home sales,
durable goods and factory orders, trade balance, industrial production, and the University of Michigan's
final sentiment. GDP and housing starts use the days their headline series changed (FRED's release
lists also hold revision days), and the other monthly releases drop FRED's revision days
(`headline()` in `us_releases.py`). Times are the agencies' fixed release times (Eastern Time).

By rule (`basis` says which): ISM Manufacturing and Services PMIs, Conference Board consumer confidence,
EIA crude oil inventories, the University of Michigan's preliminary reading, and the Philadelphia survey
before June 2015.

## Central-bank decisions (`server/src/news/schedule/central-banks.json`)

| Currency | Bank | Events |
|---|---|---|
| USD | Federal Reserve | rate decision and statement, press conference, minutes |
| EUR | ECB | rate decision and statement, press conference, meeting accounts |
| GBP | Bank of England | Bank Rate, votes and summary, Inflation Report / Monetary Policy Report |
| CAD | Bank of Canada | rate decision and statement, Monetary Policy Report |
| JPY | Bank of Japan | rate decision and statement (no fixed time), press conference, Outlook Report, Summary of Opinions, minutes |
| CHF | Swiss National Bank | rate decision and assessment, press conference |
| AUD | Reserve Bank of Australia | rate decision and statement, press conference (from 2024), minutes |

Each event: `id`, `time` (UTC ms), `currency`, `title` (the usual calendar names, so the app shows its
Persian titles), `impact` (this platform's own classification: rate decisions high, accounts and
summaries medium, Bank of Japan minutes low), `tentative` when the exact time is not published or not
confirmed (placed at noon local time), `source`, and `basis` when a date follows the bank's rule
rather than a published list (RBA minutes: two weeks after the meeting).

Times and the exceptions handled (emergency cuts in March 2020, the ECB's later announcement from July
2022, the Bank of Canada's 09:45 from September 2024, the Bank of England's announcements after its votes
in early 2015, statements that were not rate decisions) are documented in `central_banks.py`.

Not covered yet: the Reserve Bank of New Zealand (its website refuses automated requests) and China's
Loan Prime Rate (the data service does not answer).
