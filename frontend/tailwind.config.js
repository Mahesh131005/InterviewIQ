export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── CSS variable bridge (used everywhere via var()) ──────────────
        background:    'var(--background)',
        foreground:    'var(--foreground)',
        surface:       'var(--surface)',
        'surface-light':'var(--surface-light)',
        border:        'var(--border)',
        primary:       'var(--primary)',
        'primary-dark':'var(--primary-dark)',
        secondary:     'var(--secondary)',
        accent:        'var(--accent)',
        success:       'var(--success)',
        warning:       'var(--warning)',
        danger:        'var(--danger)',

        // ── CSS variable bridge extras ───────────────────────────────────
        'surface-hover':  'var(--surface-hover)',
        'border-subtle':  'var(--border-subtle)',
        'primary-dark':   'var(--primary-dark)',

        // ── Coutts dark palette (plum-maroon) ──────────────────────────
        coutts: {
          void:        '#0D0610',
          plum:        '#1A0D20',
          'plum-mid':  '#2A1535',
          'plum-light':'#33193F',
          gold:        '#C8963C',
          'gold-light':'#E8C87A',
          'gold-dark': '#A87830',
          maroon:      '#9B4D6E',
          cream:       '#F5ECD7',
        },

        // ── Harness light palette ───────────────────────────────────────
        harness: {
          sky:        '#EFFBFF',
          mist:       '#CDF4FE',
          'blue-100': '#A3E9FF',
          'blue-400': '#3DC7F6',
          'blue-500': '#00ADE4',
          'blue-600': '#0092E4',
          'blue-700': '#0278D5',
          'blue-800': '#004BA4',
          navy:       '#0A3364',
          'navy-dark':'#07182B',
        },
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },

      backdropBlur: {
        xs: '2px',
      },

      boxShadow: {
        glass:  '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        gold:   '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)',
        blue:   '0 0 20px rgba(0, 173, 228, 0.35), 0 0 40px rgba(0, 173, 228, 0.1)',
      },

      borderRadius: {
        theme: 'var(--radius)',
      },
    },
  },
  plugins: [],
}
