module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#5b8dff',
        secondary: '#93c5fd',
        night: '#0f172a',
        mist: '#64748b',
      },
    },
  },
  plugins: [],
}
