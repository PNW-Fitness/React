/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',   // PNW Blue
          light:   '#93C5FD',
          dark:    '#1D4ED8',
        },
        navy: {
          DEFAULT: '#141414',   // Near-black
          mid:     '#222222',
          deep:    '#0d0d0d',
        },
        background: {
          light: '#FCFCFC',
          dark:  '#0a0a0a',
        },
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
