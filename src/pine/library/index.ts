import { LEVELS, SMC } from './levels';
import { MOMENTUM, TREND, VOLATILITY } from './oscillators';
import type { LibraryIndicator } from './types';

/**
 * The platform's ready-made indicators (the chart's Indicators dialog), written in Pine Script and run
 * by the same engine as the user's scripts: on the candles the replay has shown, never later ones.
 * Volume-based indicators are left out: the market data has no volume.
 */

export type { LibraryIndicator };

export const LIBRARY_GROUPS: { id: string; label: string; items: LibraryIndicator[] }[] = [
  { id: 'trend', label: 'روند و میانگین‌ها', items: TREND },
  { id: 'momentum', label: 'مومنتوم و اسیلاتورها', items: MOMENTUM },
  { id: 'volatility', label: 'نوسان', items: VOLATILITY },
  { id: 'levels', label: 'سطوح قیمتی و ساختار', items: LEVELS },
  { id: 'smc', label: 'اسمارت مانی و ICT', items: SMC },
];

export const LIBRARY: LibraryIndicator[] = LIBRARY_GROUPS.flatMap((g) => g.items);
export const LIBRARY_MAP: Record<string, LibraryIndicator> = Object.fromEntries(LIBRARY.map((x) => [x.id, x]));
