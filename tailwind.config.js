/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)'],
        display: ['var(--font-display)'],
      },
      colors: {
        bg: token('bg'),
        side: token('side'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        faint: token('faint'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        gain: token('gain'),
        loss: token('loss'),
        amber: token('amber'),
        violet: token('violet'),
        sky: token('sky'),
      },
      boxShadow: {
        pop: '0 16px 48px -12px rgb(0 0 0 / 0.5)',
        glow: '0 0 0 4px rgb(var(--accent) / 0.16)',
      },
    },
  },
  plugins: [],
};
