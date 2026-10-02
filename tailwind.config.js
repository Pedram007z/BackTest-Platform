/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
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
        gain: token('gain'),
        loss: token('loss'),
        amber: token('amber'),
        violet: token('violet'),
      },
      boxShadow: {
        pop: '0 12px 40px -8px rgb(0 0 0 / 0.45)',
      },
    },
  },
  plugins: [],
};
