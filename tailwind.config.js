/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0f9d8a',
          sky: '#0b6f97',
          grass: '#188a3b',
          earth: '#8a4b2a',
          sand: '#f3c9a3',
          panel: '#eef7f4',
          orange: '#f97316',
        },
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
}

