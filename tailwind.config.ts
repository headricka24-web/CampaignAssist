import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0A1628', 700: '#0d1e38', 600: '#122349', 500: '#1a3260', 400: '#264d8c', 300: '#3d6eb5', 100: '#dce8f7' },
        red:    { DEFAULT: '#B22234', 700: '#8b1a28', 600: '#9e1e2e', 500: '#B22234', 400: '#d0374b', 300: '#e05a6b', 100: '#fde8eb' },
        gold:   { DEFAULT: '#D4A017', 700: '#a67c10', 600: '#b98a13', 500: '#D4A017', 400: '#e8b820', 300: '#f5cd4d', 100: '#fdf5d9' },
        star:   '#FFFFFF',
        brand:  { 50: '#f0f4ff', 100: '#dbe4ff', 500: '#1a3260', 600: '#122349', 700: '#0d1e38' },
      },
      fontFamily: {
        display: ['"Georgia"', '"Times New Roman"', 'serif'],
        sans:    ['system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':   'linear-gradient(135deg, #0A1628 0%, #1a3260 50%, #0A1628 100%)',
        'red-gradient':    'linear-gradient(135deg, #B22234 0%, #8b1a28 100%)',
        'gold-gradient':   'linear-gradient(135deg, #D4A017 0%, #f5cd4d 100%)',
        'stripe-pattern':  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 6px)',
      },
      boxShadow: {
        'patriot': '0 4px 24px rgba(10,22,40,0.18)',
        'glow-red': '0 0 20px rgba(178,34,52,0.25)',
        'glow-gold': '0 0 20px rgba(212,160,23,0.3)',
      },
      keyframes: {
        'ping-slow': {
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(212,160,23,0.25)' },
          '50%':       { boxShadow: '0 0 24px 6px rgba(212,160,23,0.55)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':  'ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
