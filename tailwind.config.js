/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        serenity: {
          50:  '#EDF2F9',
          100: '#D4E1F0',
          200: '#B8CBE4',
          300: '#92A8D1',
          400: '#7B96C4',
          500: '#6480B3',
          600: '#4A6FA5',
          700: '#3A5A8A',
          800: '#2C4670',
          900: '#1E3255',
        },
      },
    },
  },
  plugins: [],
}