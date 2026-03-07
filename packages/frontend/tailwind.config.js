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
        // Institutional Calm palette
        void: '#0A0B0D',
        surface: '#141517',
        'surface-hover': '#1A1B1F',
        border: '#2A2B2F',
        'text-primary': '#E8F0E8',
        'text-secondary': '#6B7280',
        'text-muted': '#4B5563',
        accent: '#059669',
        'accent-hover': '#047857',
        danger: '#DC2626',
        'danger-hover': '#B91C1C',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'price': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'price-lg': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
