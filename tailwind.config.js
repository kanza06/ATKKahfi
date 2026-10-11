/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121A33',
        muted: '#55607A',
        line: '#E3E6F0',
        surface: '#F6F7FB',
        brand: { DEFAULT: '#2A3EB1', dark: '#1E2E8C', soft: '#E8ECFB' },
        accent: '#FFB703',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
