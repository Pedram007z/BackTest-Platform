import { useStore } from '../store/useStore';

/** Concrete colors for chart libraries (SVG/canvas attributes cannot read the CSS tokens). */
export const PALETTES = {
  dark: {
    bg: '#0d0b14',
    grid: '#2e2842',
    axis: '#8f88a8',
    text: '#d6d1e6',
    surface: '#181424',
    tooltipBg: '#221d32',
    tooltipBorder: '#3a3352',
    amber: '#f5b014',
    amberDeep: '#9a5d00',
    blue: '#6e8bff',
    blueDeep: '#2a2f8f',
    violet: '#d65cff',
    violetDeep: '#5b2a99',
    accent: '#7c5cff',
    accentDeep: '#3b2a8a',
    gain: '#26c281',
    loss: '#f25466',
    line: '#9b82ff',
    cursor: 'rgba(255,255,255,0.05)',
    candleUp: '#26c281',
    candleDown: '#f25466',
  },
  light: {
    bg: '#ffffff',
    grid: '#e6e1f0',
    axis: '#7a7393',
    text: '#2c2640',
    surface: '#ffffff',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2ddef',
    amber: '#e19a00',
    amberDeep: '#ffd77a',
    blue: '#3b66f0',
    blueDeep: '#b3c2ff',
    violet: '#b034de',
    violetDeep: '#e6b3f7',
    accent: '#6a45f5',
    accentDeep: '#cfc2ff',
    gain: '#0e9862',
    loss: '#dc384e',
    line: '#6a45f5',
    cursor: 'rgba(40,20,90,0.05)',
    candleUp: '#0e9862',
    candleDown: '#dc384e',
  },
};

export type ChartPalette = (typeof PALETTES)['dark'];

export function useChartTheme(): ChartPalette {
  const theme = useStore((s) => s.theme);
  return PALETTES[theme];
}
