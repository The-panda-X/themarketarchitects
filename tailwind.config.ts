import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
        },
        accent: {
          primary: 'var(--color-accent-primary)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
          gold: 'var(--color-accent-gold)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        glass: {
          DEFAULT: 'var(--color-glass)',
          border: 'var(--color-glass-border)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        heading: ['var(--font-space-grotesk)'],
        mono: ['var(--font-jetbrains-mono)'],
        display: ['var(--font-playfair)'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(230, 57, 70, 0.4)',
        'glow-sm': '0 0 15px rgba(230, 57, 70, 0.3)',
        'glow-lg': '0 0 50px rgba(230, 57, 70, 0.5)',
        'glow-gold': '0 0 30px rgba(212, 175, 55, 0.4)',
        'glow-success': '0 0 20px rgba(0, 200, 83, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, rgba(230,57,70,0.08) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(230,57,70,0.05) 0px, transparent 50%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
