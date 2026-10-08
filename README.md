# BacktestLab market history

1-minute candles from 2015 in the API server's own storage format (`store/<SYMBOL>/<YYYY>-<MM>.m1`), ready to import: admin panel → نمادها و داده‌ی بازار → تاریخچه‌ی آماده از GitHub, or on the server:

```bash
sudo bash /opt/backtestlab/import-market-data.sh
```

The import copies the months the server lacks (or has fewer days of) into the server's storage; the server's own download then fills what is missing here and adds each new day.

## Sources

All prices are bid prices; times are UTC.

- **Binance** (data.binance.vision archives): the 12 coins, from each listing.
- **Dukascopy**: EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD, EURGBP, EURJPY, most of EURCHF and EURCAD, and the other forex pairs, gold, silver, oil and indices in early 2015–2016.
- **HistData.com** (1-minute bars in New York time, converted to UTC): the other forex pairs, gold, silver, oil and indices. Its clock follows New York's daylight-saving dates until 2018 and Europe's from 2019; both are converted (checked against OANDA for every year). Two of its files hold another index, replaced with OANDA's: GER40 from 15 June 2020 to 1 December 2023 (Euro Stoxx 50 prices) and EU50 from 17 December 2018 (IBEX 35 prices).
- **OANDA** (v20 API, 1-minute bid candles): USDCNH, XPTUSD, NGAS, US30 and US2000 from 2015; EU50 from December 2018; GER40 June 2020 – November 2023; USOIL December 2023 – June 2026; HistData's outage of 19–24 February 2017 and 2–7 October 2026 for most forex pairs, metals and indices. OANDA's index and oil prices are CFD prices: they differ from the futures-based HistData ones by up to ~0.2% (indices) and ~1% (oil, at the June 2026 join). XPTUSD and US2000 go back to 2015 here, before the app's own start for them.

Not here (the server's Dukascopy download fills them): XPTUSD 4–22 November 2021 (missing at OANDA too); USOIL 19–24 February 2017 and 2–7 October 2026, UKOIL and AUS200 2–7 October 2026, UK100 19–26 February 2017 (OANDA's prices there are too far from the neighbouring days); days after 2026-10-07.

## Coverage (days stored or closed, of the days from the symbol's start in the app to 2026-10-07)

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
| forex | EURCAD | 100.0% | 2015-01-01 | 2026-10-07 | 16.2 MB | Dukascopy + HistData |
| forex | EURAUD | 100.0% | 2015-01-01 | 2026-10-07 | 17.1 MB | HistData |
| forex | EURNZD | 100.0% | 2015-01-01 | 2026-10-07 | 17.7 MB | HistData |
| forex | GBPJPY | 100.0% | 2015-01-01 | 2026-10-07 | 17.6 MB | HistData |
| forex | GBPCHF | 100.0% | 2015-01-01 | 2026-10-07 | 15.9 MB | HistData |
| forex | GBPCAD | 100.0% | 2015-01-01 | 2026-10-07 | 17.3 MB | HistData |
| forex | GBPAUD | 100.0% | 2015-01-01 | 2026-10-07 | 18.2 MB | HistData |
| forex | GBPNZD | 100.0% | 2015-01-01 | 2026-10-07 | 18.6 MB | HistData |
| forex | AUDJPY | 100.0% | 2015-01-01 | 2026-10-07 | 15.4 MB | HistData |
| forex | AUDCHF | 100.0% | 2015-01-01 | 2026-10-07 | 14.1 MB | HistData |
| forex | AUDCAD | 100.0% | 2015-01-01 | 2026-10-07 | 14.9 MB | HistData |
| forex | AUDNZD | 100.0% | 2015-01-01 | 2026-10-07 | 14.6 MB | HistData |
| forex | NZDJPY | 100.0% | 2015-01-01 | 2026-10-07 | 15.2 MB | HistData |
| forex | NZDCHF | 100.0% | 2015-01-01 | 2026-10-07 | 13.7 MB | HistData |
| forex | NZDCAD | 100.0% | 2015-01-01 | 2026-10-07 | 14.7 MB | HistData |
| forex | CADJPY | 100.0% | 2015-01-01 | 2026-10-07 | 15.2 MB | HistData |
| forex | CADCHF | 100.0% | 2015-01-01 | 2026-10-07 | 13.8 MB | HistData |
| forex | CHFJPY | 100.0% | 2015-01-01 | 2026-10-07 | 16.3 MB | HistData |
| forex | USDTRY | 100.0% | 2015-01-01 | 2026-10-07 | 17.3 MB | HistData |
| forex | USDZAR | 100.0% | 2015-01-01 | 2026-10-07 | 24.0 MB | HistData |
| forex | USDMXN | 100.0% | 2015-01-01 | 2026-10-07 | 24.3 MB | HistData |
| forex | USDSEK | 100.0% | 2015-01-01 | 2026-10-07 | 23.7 MB | HistData |
| forex | USDNOK | 100.0% | 2015-01-01 | 2026-10-07 | 24.2 MB | HistData |
| forex | USDSGD | 100.0% | 2015-01-01 | 2026-10-07 | 13.3 MB | HistData |
| forex | USDHKD | 100.0% | 2015-01-01 | 2026-10-07 | 9.6 MB | HistData |
| forex | USDPLN | 100.0% | 2015-01-01 | 2026-10-07 | 19.5 MB | HistData |
| forex | USDCNH | 100.0% | 2015-01-01 | 2026-10-07 | 18.6 MB | OANDA |
| forex | EURTRY | 100.0% | 2015-01-01 | 2026-10-07 | 21.1 MB | HistData |
| forex | EURNOK | 100.0% | 2015-01-01 | 2026-10-07 | 22.3 MB | HistData |
| forex | EURSEK | 100.0% | 2015-01-01 | 2026-10-07 | 21.4 MB | HistData |
| forex | EURPLN | 100.0% | 2015-01-01 | 2026-10-07 | 15.7 MB | HistData |
| metal | XAUUSD | 100.0% | 2015-01-01 | 2026-10-07 | 21.2 MB | HistData |
| metal | XAGUSD | 100.0% | 2015-01-01 | 2026-10-07 | 13.5 MB | HistData |
| metal | XPTUSD | 98.9% | 2015-01-01 | 2026-10-07 | 16.4 MB | OANDA |
| energy | USOIL | 99.7% | 2015-01-01 | 2026-10-01 | 10.8 MB | HistData; OANDA Dec 2023 – Jun 2026 |
| energy | UKOIL | 99.9% | 2015-01-02 | 2026-10-01 | 10.7 MB | HistData |
| energy | NGAS | 100.0% | 2015-01-01 | 2026-10-07 | 6.0 MB | OANDA |
| index | US30 | 100.0% | 2015-01-01 | 2026-10-07 | 15.1 MB | OANDA |
| index | NAS100 | 100.0% | 2015-01-01 | 2026-10-07 | 25.5 MB | HistData |
| index | SPX500 | 100.0% | 2015-01-01 | 2026-10-07 | 18.3 MB | HistData |
| index | US2000 | 100.0% | 2015-01-02 | 2026-10-07 | 17.0 MB | OANDA |
| index | GER40 | 100.0% | 2015-01-02 | 2026-10-07 | 16.4 MB | HistData; OANDA Jun 2020 – Nov 2023 |
| index | UK100 | 99.8% | 2015-01-02 | 2026-10-07 | 20.9 MB | HistData |
| index | FRA40 | 100.0% | 2015-01-02 | 2026-10-07 | 14.4 MB | HistData |
| index | EU50 | 100.0% | 2015-01-02 | 2026-10-07 | 4.7 MB | HistData to Dec 2018; OANDA after |
| index | JPN225 | 100.0% | 2015-01-01 | 2026-10-07 | 16.2 MB | HistData |
| index | AUS200 | 99.9% | 2015-01-01 | 2026-10-01 | 13.6 MB | HistData |
| index | HK50 | 100.0% | 2015-01-02 | 2026-10-07 | 14.8 MB | HistData |
| index | NQ | 100.0% | 2015-01-01 | 2026-10-07 | 25.5 MB | HistData |
| index | ES | 100.0% | 2015-01-01 | 2026-10-07 | 18.3 MB | HistData |
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

Total: 288564 of 288614 days (99.98%), 1158 MB.
