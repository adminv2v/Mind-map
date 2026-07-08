/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'stone-shadow': '#1c1917',
        'warm-gray': '#3D3A35',
        'amber-gold': '#E6B450',
        'accent-orange': '#DC6300',
        'accent-orange-light': '#ff8c3a',
      },
    },
  },
  plugins: [],
};
