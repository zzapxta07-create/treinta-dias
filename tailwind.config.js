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
        // ── Backgrounds: deep gothic obsidian ──────────────────
        void:       '#07060c',
        stone:      '#0c0a14',   // was #0a0806
        wood:       '#110e1c',   // was #110d0a
        panel:      '#171428',   // was #1a1410
        card:       '#1e1b2e',   // was #201a14
        mist:       '#252233',
        // ── Borders ────────────────────────────────────────────
        border:     '#2c2740',   // was #3a2e22 — violet-tinted
        rim:        '#3e3858',
        arc:        '#5a5278',
        // ── Text ───────────────────────────────────────────────
        parchment:  '#f0e6d0',   // keep — warm ivory primary
        warm:       '#9490aa',   // was #9a8470 — lavender grey
        dim:        '#4d4568',   // was #5a4838 — violet dim
        // ── Gold ───────────────────────────────────────────────
        gold:       '#d4a956',   // was #c9a254 — richer
        'gold-lit': '#eac070',
        'gold-dim': '#7a6030',   // keep
        'gold-deep':'#3a2d10',
        // ── Crimson ────────────────────────────────────────────
        crimson:    '#9b1f30',   // was #8b1a2a
        ruby:       '#c43040',
        scarlet:    '#280810',
        // ── Success ────────────────────────────────────────────
        forest:     '#1a3d28',   // was #2d5a3d
        emerald:    '#2a6040',
        // ── Night blue accents ──────────────────────────────────
        midnight:   '#0a1530',
        sapphire:   '#152048',
        azure:      '#253570',
      },
      boxShadow: {
        'gold':       '0 0 24px rgba(212,169,86,0.18), 0 0 48px rgba(212,169,86,0.06)',
        'gold-sm':    '0 0 12px rgba(212,169,86,0.25)',
        'crimson':    '0 0 24px rgba(155,31,48,0.25)',
        'deep':       '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'float':      '0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)',
        'inset-gold': 'inset 0 1px 0 rgba(212,169,86,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
        'panel':      '0 4px 20px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'radial-void':    'radial-gradient(ellipse at top, #1a1530 0%, #0c0a14 60%)',
        'radial-gold':    'radial-gradient(ellipse at center, rgba(212,169,86,0.08) 0%, transparent 70%)',
        'gradient-gold':  'linear-gradient(135deg, #d4a956 0%, #a07830 100%)',
        'gradient-slate': 'linear-gradient(180deg, #1a1530 0%, #0c0a14 100%)',
      },
    },
  },
  plugins: [],
};
