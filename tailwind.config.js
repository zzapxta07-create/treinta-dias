/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        cinzel:  ['Cinzel', 'serif'],
        crimson: ['"Crimson Text"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        stone:      '#0a0806',
        wood:       '#110d0a',
        panel:      '#1a1410',
        card:       '#201a14',
        border:     '#3a2e22',
        parchment:  '#f0e6d0',
        gold:       '#c9a254',
        'gold-dim': '#7a6030',
        warm:       '#9a8470',
        dim:        '#5a4838',
        crimson:    '#8b1a2a',
        forest:     '#2d5a3d',
      },
    },
  },
  plugins: [],
};
