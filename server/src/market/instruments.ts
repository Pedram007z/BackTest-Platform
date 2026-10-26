/**
 * The app's symbols (src/lib/market.ts) and where their real prices come from.
 * Dukascopy's datafeed files store prices as integers; `factor` is what they are divided by
 * (dukascopy-node's instrument metadata). Its data API sends the multiplier with the data.
 */

export type Group = 'forex' | 'metal' | 'energy' | 'index' | 'crypto';

export interface Instrument {
  id: string;
  group: Group;
  digits: number;
  /** Trades on weekends (crypto). */
  weekends: boolean;
  dukascopy?: { name: string; factor: number };
  binance?: string;
  /** First day with data at the source, when later than the history start (2015-01-01). */
  since?: string;
}

const FOREX = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'USDCAD',
  'AUDUSD',
  'NZDUSD',
  'EURGBP',
  'EURJPY',
  'EURCHF',
  'EURCAD',
  'EURAUD',
  'EURNZD',
  'GBPJPY',
  'GBPCHF',
  'GBPCAD',
  'GBPAUD',
  'GBPNZD',
  'AUDJPY',
  'AUDCHF',
  'AUDCAD',
  'AUDNZD',
  'NZDJPY',
  'NZDCHF',
  'NZDCAD',
  'CADJPY',
  'CADCHF',
  'CHFJPY',
  'USDTRY',
  'USDZAR',
  'USDMXN',
  'USDSEK',
  'USDNOK',
  'USDSGD',
  'USDHKD',
  'USDPLN',
  'USDCNH',
  'EURTRY',
  'EURNOK',
  'EURSEK',
  'EURPLN',
];

const list: Instrument[] = [
  ...FOREX.map((id): Instrument => {
    const jpy = id.endsWith('JPY');
    return { id, group: 'forex', digits: jpy ? 3 : 5, weekends: false, dukascopy: { name: id, factor: jpy ? 1e3 : 1e5 } };
  }),
  { id: 'XAUUSD', group: 'metal', digits: 2, weekends: false, dukascopy: { name: 'XAUUSD', factor: 1e3 } },
  { id: 'XAGUSD', group: 'metal', digits: 3, weekends: false, dukascopy: { name: 'XAGUSD', factor: 1e3 } },
  { id: 'XPTUSD', group: 'metal', digits: 2, weekends: false, dukascopy: { name: 'XPTCMDUSD', factor: 1e3 }, since: '2021-11-01' },
  { id: 'USOIL', group: 'energy', digits: 2, weekends: false, dukascopy: { name: 'LIGHTCMDUSD', factor: 1e3 } },
  { id: 'UKOIL', group: 'energy', digits: 2, weekends: false, dukascopy: { name: 'BRENTCMDUSD', factor: 1e3 } },
  { id: 'NGAS', group: 'energy', digits: 3, weekends: false, dukascopy: { name: 'GASCMDUSD', factor: 1e4 } },
  { id: 'US30', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'USA30IDXUSD', factor: 1e3 } },
  { id: 'NAS100', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'USATECHIDXUSD', factor: 1e3 } },
  { id: 'SPX500', group: 'index', digits: 2, weekends: false, dukascopy: { name: 'USA500IDXUSD', factor: 1e3 } },
  { id: 'US2000', group: 'index', digits: 2, weekends: false, dukascopy: { name: 'USSC2000IDXUSD', factor: 1e3 }, since: '2018-08-08' },
  { id: 'GER40', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'DEUIDXEUR', factor: 1e3 } },
  { id: 'UK100', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'GBRIDXGBP', factor: 1e3 } },
  { id: 'FRA40', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'FRAIDXEUR', factor: 1e3 } },
  { id: 'EU50', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'EUSIDXEUR', factor: 1e3 } },
  { id: 'JPN225', group: 'index', digits: 0, weekends: false, dukascopy: { name: 'JPNIDXJPY', factor: 1e3 } },
  { id: 'AUS200', group: 'index', digits: 1, weekends: false, dukascopy: { name: 'AUSIDXAUD', factor: 1e3 } },
  { id: 'HK50', group: 'index', digits: 0, weekends: false, dukascopy: { name: 'HKGIDXHKD', factor: 1e3 } },
  // NQ and ES: the index CFDs' prices in E-mini contract sizes (there is no free CME futures history;
  // futures trade at a premium to the index)
  { id: 'NQ', group: 'index', digits: 2, weekends: false, dukascopy: { name: 'USATECHIDXUSD', factor: 1e3 } },
  { id: 'ES', group: 'index', digits: 2, weekends: false, dukascopy: { name: 'USA500IDXUSD', factor: 1e3 } },
  { id: 'BTCUSD', group: 'crypto', digits: 1, weekends: true, binance: 'BTCUSDT', dukascopy: { name: 'BTCUSD', factor: 10 }, since: '2017-08-17' },
  { id: 'ETHUSD', group: 'crypto', digits: 2, weekends: true, binance: 'ETHUSDT', dukascopy: { name: 'ETHUSD', factor: 10 }, since: '2017-08-17' },
  { id: 'BNBUSD', group: 'crypto', digits: 2, weekends: true, binance: 'BNBUSDT', since: '2017-11-06' },
  { id: 'SOLUSD', group: 'crypto', digits: 3, weekends: true, binance: 'SOLUSDT', since: '2020-08-11' },
  { id: 'XRPUSD', group: 'crypto', digits: 5, weekends: true, binance: 'XRPUSDT', since: '2018-05-04' },
  { id: 'ADAUSD', group: 'crypto', digits: 5, weekends: true, binance: 'ADAUSDT', since: '2018-04-17' },
  { id: 'DOGEUSD', group: 'crypto', digits: 6, weekends: true, binance: 'DOGEUSDT', since: '2019-07-05' },
  { id: 'LTCUSD', group: 'crypto', digits: 2, weekends: true, binance: 'LTCUSDT', dukascopy: { name: 'LTCUSD', factor: 10 }, since: '2017-12-13' },
  { id: 'DOTUSD', group: 'crypto', digits: 4, weekends: true, binance: 'DOTUSDT', since: '2020-08-18' },
  { id: 'AVAXUSD', group: 'crypto', digits: 3, weekends: true, binance: 'AVAXUSDT', since: '2020-09-22' },
  { id: 'LINKUSD', group: 'crypto', digits: 4, weekends: true, binance: 'LINKUSDT', since: '2019-01-16' },
  { id: 'TRXUSD', group: 'crypto', digits: 5, weekends: true, binance: 'TRXUSDT', since: '2018-06-11' },
];

export const INSTRUMENTS: Record<string, Instrument> = Object.fromEntries(list.map((i) => [i.id, i]));
