# BacktestLab market history

1-minute candles from 2015 in the API server's own storage format (`store/<SYMBOL>/<YYYY>-<MM>.m1`), ready to import:

```bash
sudo GITHUB_TOKEN=YOUR_READ_ONLY_TOKEN bash /opt/backtestlab/import-market-data.sh
```

The import copies the months the server lacks (or has fewer days of) into `/var/lib/backtestlab/market/store` and restarts the server; its own download then fills what is missing here and adds each new day.

## Sources

- **Binance** (data.binance.vision archives): the 12 coins, from each listing.
- **Dukascopy** (bid prices): EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD, EURGBP, EURJPY, and most of EURCHF and EURCAD.
- **HistData.com** (1-minute bid bars, New York time converted to UTC): the other forex pairs, gold, silver, oil and indices. Where both exist, its candles match Dukascopy's minute for minute (2019–2026; within ~0.2 pip in 2016).

Not here yet (the server's Dukascopy download fills them): USDCNH, XPTUSD, NGAS, US30, US2000; USOIL January 2024 – June 2026; EU50 from 2020; the HistData outage of 19–24 February 2017; days after 1 October 2026.

## Coverage (days stored or closed, of the days from the symbol's start to 2026-10-07)

| Market | Symbol | Coverage | First | Last | Size | Source |
|---|---|---|---|---|---|---|
| forex | EURUSD | 100.0% | 2015-01-01 | 2026-10-07 | 14.5 MB | Dukascopy |
| forex | GBPUSD | 100.0% | 2015-01-01 | 2026-10-07 | 15.7 MB | Dukascopy |
| forex | USDJPY | 100.0% | 2015-01-01 | 2026-10-07 | 15.2 MB | Dukascopy |
| forex | USDCHF | 100.0% | 2015-01-01 | 2026-10-07 | 13.9 MB | Dukascopy |
| forex | USDCAD | 100.0% | 2015-01-01 | 2026-10-07 | 14.9 MB | Dukascopy |
| forex | AUDUSD | 100.0% | 2015-01-01 | 2026-10-07 | 14.0 MB | Dukascopy |
| forex | NZDUSD | 100.0% | 2015-01-01 | 2026-10-07 | 13.8 MB | Dukascopy |
| forex | EURGBP | 100.0% | 2015-01-01 | 2026-10-07 | 13.6 MB | Dukascopy |
| forex | EURJPY | 100.0% | 2015-01-01 | 2026-10-07 | 16.3 MB | Dukascopy |
| forex | EURCHF | 100.0% | 2015-01-01 | 2026-10-07 | 13.4 MB | Dukascopy + HistData |
| forex | EURCAD | 99.9% | 2015-01-01 | 2026-10-01 | 16.1 MB | Dukascopy + HistData |
| forex | EURAUD | 99.9% | 2015-01-01 | 2026-10-01 | 17.1 MB | HistData |
| forex | EURNZD | 99.9% | 2015-01-01 | 2026-10-01 | 17.7 MB | HistData |
| forex | GBPJPY | 99.9% | 2015-01-01 | 2026-10-01 | 17.6 MB | HistData |
| forex | GBPCHF | 99.9% | 2015-01-01 | 2026-10-01 | 15.9 MB | HistData |
| forex | GBPCAD | 99.9% | 2015-01-01 | 2026-10-01 | 17.3 MB | HistData |
| forex | GBPAUD | 99.9% | 2015-01-01 | 2026-10-01 | 18.2 MB | HistData |
| forex | GBPNZD | 99.9% | 2015-01-01 | 2026-10-01 | 18.6 MB | HistData |
| forex | AUDJPY | 99.9% | 2015-01-01 | 2026-10-01 | 15.4 MB | HistData |
| forex | AUDCHF | 99.9% | 2015-01-01 | 2026-10-01 | 14.1 MB | HistData |
| forex | AUDCAD | 99.9% | 2015-01-01 | 2026-10-01 | 14.9 MB | HistData |
| forex | AUDNZD | 99.9% | 2015-01-01 | 2026-10-01 | 14.6 MB | HistData |
| forex | NZDJPY | 99.9% | 2015-01-01 | 2026-10-01 | 15.2 MB | HistData |
| forex | NZDCHF | 99.9% | 2015-01-01 | 2026-10-01 | 13.7 MB | HistData |
| forex | NZDCAD | 99.9% | 2015-01-01 | 2026-10-01 | 14.7 MB | HistData |
| forex | CADJPY | 99.9% | 2015-01-01 | 2026-10-01 | 15.2 MB | HistData |
| forex | CADCHF | 99.9% | 2015-01-01 | 2026-10-01 | 13.7 MB | HistData |
| forex | CHFJPY | 99.9% | 2015-01-01 | 2026-10-01 | 16.3 MB | HistData |
| forex | USDTRY | 99.7% | 2015-01-01 | 2026-10-01 | 17.3 MB | HistData |
| forex | USDZAR | 99.7% | 2015-01-01 | 2026-10-01 | 24.0 MB | HistData |
| forex | USDMXN | 99.7% | 2015-01-01 | 2026-10-01 | 24.2 MB | HistData |
| forex | USDSEK | 99.9% | 2015-01-01 | 2026-10-01 | 23.7 MB | HistData |
| forex | USDNOK | 99.9% | 2015-01-01 | 2026-10-01 | 24.2 MB | HistData |
| forex | USDSGD | 99.9% | 2015-01-01 | 2026-10-01 | 13.3 MB | HistData |
| forex | USDHKD | 99.9% | 2015-01-01 | 2026-10-01 | 9.6 MB | HistData |
| forex | USDPLN | 99.7% | 2015-01-01 | 2026-10-01 | 19.4 MB | HistData |
| forex | USDCNH | 0.7% | 2019-06-02 | 2019-06-30 | 0.1 MB | Dukascopy |
| forex | EURTRY | 99.7% | 2015-01-01 | 2026-10-01 | 21.1 MB | HistData |
| forex | EURNOK | 99.9% | 2015-01-01 | 2026-10-01 | 22.3 MB | HistData |
| forex | EURSEK | 99.9% | 2015-01-01 | 2026-10-01 | 21.4 MB | HistData |
| forex | EURPLN | 99.7% | 2015-01-01 | 2026-10-01 | 15.6 MB | HistData |
| metal | XAUUSD | 99.9% | 2015-01-01 | 2026-10-01 | 21.2 MB | HistData |
| metal | XAGUSD | 99.9% | 2015-01-01 | 2026-10-01 | 13.5 MB | HistData |
| metal | XPTUSD | 0.0% | - | - | 0.0 MB | Dukascopy |
| energy | USOIL | 78.1% | 2015-01-01 | 2026-10-01 | 8.5 MB | HistData |
| energy | UKOIL | 99.9% | 2015-01-02 | 2026-10-01 | 10.7 MB | HistData |
| energy | NGAS | 0.7% | 2019-06-02 | 2019-06-30 | 0.0 MB | Dukascopy |
| index | US30 | 0.7% | 2019-06-02 | 2019-06-30 | 0.1 MB | Dukascopy |
| index | NAS100 | 99.7% | 2015-01-01 | 2026-10-01 | 25.4 MB | HistData |
| index | SPX500 | 99.7% | 2015-01-01 | 2026-10-01 | 18.3 MB | HistData |
| index | US2000 | 1.0% | 2019-06-02 | 2019-06-30 | 0.1 MB | Dukascopy |
| index | GER40 | 99.7% | 2015-01-02 | 2026-10-01 | 15.5 MB | HistData |
| index | UK100 | 99.7% | 2015-01-02 | 2026-10-01 | 20.9 MB | HistData |
| index | FRA40 | 99.7% | 2015-01-02 | 2026-10-01 | 14.4 MB | HistData |
| index | EU50 | 35.5% | 2015-01-02 | 2019-06-28 | 1.2 MB | HistData |
| index | JPN225 | 99.7% | 2015-01-01 | 2026-10-01 | 16.2 MB | HistData |
| index | AUS200 | 99.9% | 2015-01-01 | 2026-10-01 | 13.6 MB | HistData |
| index | HK50 | 99.5% | 2015-01-02 | 2026-09-30 | 14.7 MB | HistData |
| index | NQ | 99.7% | 2015-01-01 | 2026-10-01 | 25.4 MB | HistData |
| index | ES | 99.7% | 2015-01-01 | 2026-10-01 | 18.3 MB | HistData |
| crypto | BTCUSD | 100.0% | 2017-08-17 | 2026-10-07 | 32.8 MB | Binance |
| crypto | ETHUSD | 100.0% | 2017-08-17 | 2026-10-07 | 22.5 MB | Binance |
| crypto | BNBUSD | 100.0% | 2017-11-06 | 2026-10-07 | 18.5 MB | Binance |
| crypto | SOLUSD | 100.0% | 2020-08-11 | 2026-10-07 | 10.6 MB | Binance |
| crypto | XRPUSD | 100.0% | 2018-05-04 | 2026-10-07 | 14.7 MB | Binance |
| crypto | ADAUSD | 100.0% | 2018-04-17 | 2026-10-07 | 11.8 MB | Binance |
| crypto | DOGEUSD | 100.0% | 2019-07-05 | 2026-10-07 | 11.5 MB | Binance |
| crypto | LTCUSD | 100.0% | 2017-12-13 | 2026-10-07 | 12.7 MB | Binance |
| crypto | DOTUSD | 100.0% | 2020-08-18 | 2026-10-07 | 8.4 MB | Binance |
| crypto | AVAXUSD | 100.0% | 2020-09-22 | 2026-10-07 | 8.0 MB | Binance |
| crypto | LINKUSD | 100.0% | 2019-01-16 | 2026-10-07 | 12.3 MB | Binance |
| crypto | TRXUSD | 100.0% | 2018-06-11 | 2026-10-07 | 8.4 MB | Binance |

Total: 266983 288614 92.5% 1078MB (days covered, days expected, coverage, size).
