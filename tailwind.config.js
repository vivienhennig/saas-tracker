/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        k5: {
          digitalBlue: '#092AFF',
          digitalBlueLight: '#00a5e5',
          deepBlue: '#052364',
          lime: '#E9FF86',
          limeLight: '#F3FCCF',
          sand: '#C5B8AE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'k5-glow-blue': 'linear-gradient(135deg, #092AFF 0%, #00a5e5 100%)',
        'k5-glow-deep': 'linear-gradient(135deg, #052364 0%, #092AFF 100%)',
      },
    },
  },
  plugins: [],
};
