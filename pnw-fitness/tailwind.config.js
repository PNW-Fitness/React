/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C9A84C',   // PNW Gold
          light:   '#E8D5A0',
          dark:    '#A07830',
        },
        navy: {
          DEFAULT: '#0E2340',   // PNW Navy
          mid:     '#1B3A5C',
          deep:    '#071829',
        },
        background: {
          light: '#FCFCFC',
          dark:  '#080C10',
        },
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
