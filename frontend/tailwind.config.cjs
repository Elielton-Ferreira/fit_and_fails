module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#54f0c3',
        secondary: '#ffd166',
        night: '#0f172a',
        mist: '#64748b',
      },
    },
  },
  plugins: [],
}
