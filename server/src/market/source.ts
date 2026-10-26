import { db } from '../db';
import type { DataSource } from '../shared';
import type { Instrument } from './instruments';
import { qverisConfigured, qverisSymbol } from './qveris';

/** Where a symbol's history is downloaded from (chosen per market in the admin panel). */
export function sourceFor(inst: Instrument): DataSource {
  const chosen = db().settings.marketData[inst.group];
  if (chosen === 'binance' && inst.binance) return 'binance';
  if (chosen === 'dukascopy' && inst.dukascopy) return 'dukascopy';
  if (chosen === 'qveris' && qverisSymbol(inst) && qverisConfigured()) return 'qveris';
  // fall back to whichever real source has the symbol
  return inst.dukascopy ? 'dukascopy' : inst.binance ? 'binance' : 'synthetic';
}
