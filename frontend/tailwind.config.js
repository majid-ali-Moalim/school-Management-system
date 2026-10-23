/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E7F3FF', // Light Blue accent
          200: '#C7E2FE',
          300: '#94C7FD',
          400: '#5BA5FB',
          500: '#1877F2', // Primary Blue
          600: '#166FE5', // Primary Hover
          700: '#1259B8',
          800: '#0E448C',
          900: '#0A3166',
          950: '#051C3B',
        },
      },
    },
  },
  plugins: [],
}
