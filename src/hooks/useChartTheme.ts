import { PALETTES, type ChartPalette } from '../lib/palettes';
import { useStore } from '../store/useStore';

export { PALETTES, type ChartPalette };

export function useChartTheme(): ChartPalette {
  const theme = useStore((s) => s.theme);
  return PALETTES[theme];
}
