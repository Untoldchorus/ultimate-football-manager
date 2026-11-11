/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070a12',
          900: '#0b0f19',
          800: '#111827',
          700: '#1e293b',
        },
        pitch: {
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
        },
        gold: {
          500: '#f59e0b',
          400: '#fbbf24',
        },
      },
    },
  },
  plugins: [],
};
