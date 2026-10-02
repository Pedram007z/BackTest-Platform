import { useStore } from '../store/useStore';

/** Concrete colors for chart libraries (SVG/canvas attributes cannot read the CSS tokens). */
const PALETTES = {
  dark: {
    grid: '#3a3b43',
    axis: '#8b8e98',
    text: '#c9cbd2',
    surface: '#222328',
    tooltipBg: '#2b2c32',
    tooltipBorder: '#3a3b43',
    amber: '#f5b014',
    amberDeep: '#a86b00',
    blue: '#1f6bff',
    blueDeep: '#0b2f80',
    violet: '#c13fd9',
    violetDeep: '#6d1f8f',
    gain: '#22c08a',
    loss: '#f0525a',
    line: '#4a8bff',
    cursor: 'rgba(255,255,255,0.06)',
  },
  light: {
    grid: '#e3e5ea',
    axis: '#7b808c',
    text: '#3b3f48',
    surface: '#ffffff',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e4ea',
    amber: '#e8a100',
    amberDeep: '#ffd77a',
    blue: '#1a5ff0',
    blueDeep: '#9ab9ff',
    violet: '#b02fca',
    violetDeep: '#e3a6f0',
    gain: '#11a174',
    loss: '#e03e47',
    line: '#1a5ff0',
    cursor: 'rgba(0,0,0,0.04)',
  },
};

export type ChartPalette = (typeof PALETTES)['dark'];

export function useChartTheme(): ChartPalette {
  const theme = useStore((s) => s.theme);
  return PALETTES[theme];
}
