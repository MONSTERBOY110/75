import type { Config } from 'tailwindcss'

/**
 * RETRO ARCADE theme — black canvas, arcade-BLUE accent, white text.
 * Hard edges (no rounding), chunky borders, and hard offset shadows give the
 * "pixel box / raised console button" look. Components only ever reference the
 * semantic token names, so the whole app re-skins by editing this file.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: {
          DEFAULT: '#0a0a0a',
          dim: '#0a0a0a',
          bright: '#383838',
          'container-lowest': '#050505',
          'container-low': '#121212',
          container: '#161616',
          'container-high': '#202020',
          'container-highest': '#2a2a2a',
          variant: '#202020',
        },
        'on-surface': '#f5f5f5',
        'on-surface-variant': '#9a9a9a',
        outline: {
          DEFAULT: '#3a3a3a',
          variant: '#262626',
        },
        primary: {
          DEFAULT: '#38bdf8', // arcade light blue
          container: '#1b7fa8', // the darker shade used as the accent's hard shadow
          fixed: '#5fcefa',
          'fixed-dim': '#2a9bd0',
        },
        'on-primary': '#04121a',
        secondary: {
          DEFAULT: '#ff3b22', // arcade danger / absent
          container: '#7a1a10',
        },
        'on-secondary': '#0a0a0a',
        // 65–74% band: above the danger line but not yet safe.
        warning: {
          DEFAULT: '#ffb020',
          container: '#8a5a00',
        },
        'on-warning': '#0a0a0a',
        error: {
          DEFAULT: '#ff3b22',
          container: '#7a1a10',
        },
        'on-error': '#0a0a0a',
      },
      fontFamily: {
        // Default body font: VT323 — a compact, highly readable pixel/terminal face.
        sans: ['VT323', 'ui-monospace', 'monospace'],
        // Display/accent: Press Start 2P — chunky 8-bit lettering (use at small sizes).
        pixel: ['"Press Start 2P"', 'VT323', 'monospace'],
      },
      fontSize: {
        // VT323 reads small for its px size, so the scale runs a bit larger than usual.
        'display-lg': ['56px', { lineHeight: '56px' }],
        'headline-lg': ['40px', { lineHeight: '44px' }],
        'headline-mobile': ['34px', { lineHeight: '36px' }],
        'title-md': ['26px', { lineHeight: '30px' }],
        'body-lg': ['20px', { lineHeight: '26px' }],
        'body-sm': ['18px', { lineHeight: '22px' }],
        'label-caps': ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        full: '0',
      },
      spacing: {
        gutter: '16px',
        margin: '20px',
        nav: '80px',
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        // Hard, blur-less offset shadows = pixel/console depth.
        pixel: '4px 4px 0 0 #000000',
        'pixel-sm': '3px 3px 0 0 #000000',
        'pixel-primary': '4px 4px 0 0 #1b7fa8',
        modal: '8px 8px 0 0 #000000',
      },
      backdropBlur: {
        nav: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
