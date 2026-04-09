import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        crimson: {
          DEFAULT: '#DC143C',
          50: '#FDE8EC',
          100: '#FAC5CE',
          200: '#F58B9D',
          300: '#F0516C',
          400: '#EB173B',
          500: '#DC143C',
          600: '#B01030',
          700: '#840C24',
          800: '#580818',
          900: '#2C040C',
        },
        'electric-red': '#FF2020',
        'dark-red': '#8B0000',
        gold: {
          DEFAULT: '#FFD700',
          50: '#FFF9E0',
          300: '#FFE44D',
          500: '#FFD700',
          700: '#B89B00',
        },
        blue: {
          50: '#DFDFF0',
          75: '#dfdff2',
          100: '#F0F2FA',
          200: '#010101',
          300: '#4FB7DD',
        },
        violet: {
          300: '#c4b5fd',
        },
        yellow: {
          100: '#8e983f',
          300: '#edff66',
        },
        'off-white': '#DFDFF0',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        zentry: ['zentry', 'sans-serif'],
        general: ['general', 'sans-serif'],
        'circular-web': ['circular-web', 'sans-serif'],
        'robert-medium': ['robert-medium', 'sans-serif'],
        'robert-regular': ['robert-regular', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'red-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(220, 20, 60, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(220, 20, 60, 0.6)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glitch': {
          '0%': { 'clip-path': 'inset(20% 0 50% 0)' },
          '5%': { 'clip-path': 'inset(10% 0 60% 0)' },
          '10%': { 'clip-path': 'inset(15% 0 55% 0)' },
          '15%': { 'clip-path': 'inset(25% 0 35% 0)' },
          '20%': { 'clip-path': 'inset(30% 0 40% 0)' },
          '25%': { 'clip-path': 'inset(40% 0 20% 0)' },
          '30%': { 'clip-path': 'inset(10% 0 60% 0)' },
          '35%': { 'clip-path': 'inset(15% 0 55% 0)' },
          '40%': { 'clip-path': 'inset(25% 0 35% 0)' },
          '45%': { 'clip-path': 'inset(30% 0 40% 0)' },
          '50%': { 'clip-path': 'inset(20% 0 50% 0)' },
          '55%': { 'clip-path': 'inset(10% 0 60% 0)' },
          '60%': { 'clip-path': 'inset(15% 0 55% 0)' },
          '65%': { 'clip-path': 'inset(25% 0 35% 0)' },
          '70%': { 'clip-path': 'inset(30% 0 40% 0)' },
          '75%': { 'clip-path': 'inset(40% 0 20% 0)' },
          '80%': { 'clip-path': 'inset(20% 0 50% 0)' },
          '85%': { 'clip-path': 'inset(10% 0 60% 0)' },
          '90%': { 'clip-path': 'inset(15% 0 55% 0)' },
          '95%': { 'clip-path': 'inset(25% 0 35% 0)' },
          '100%': { 'clip-path': 'inset(30% 0 40% 0)' },
        },
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'red-glow': 'red-glow 2s ease-in-out infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'glitch-after': 'glitch 1.5s infinite linear alternate-reverse',
        'glitch-before': 'glitch 1s infinite linear alternate-reverse',
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
        'scan-line': 'scan-line 4s linear infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
