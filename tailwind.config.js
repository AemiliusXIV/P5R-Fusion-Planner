/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        p5red:   '#e60012',
        p5black: '#0d0d0d',
        p5white: '#f5f5f5',
        p5gold:  '#c8a84b',
        p5gray:  '#1e1e1e',
        p5card:  '#252525',
        p5border:'#3a3a3a',
        elem: {
          wk:  '#ff4444',
          rs:  '#4488ff',
          nu:  '#888888',
          ab:  '#44cc88',
          rp:  '#ffaa00',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
