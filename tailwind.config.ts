import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
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
        bg: '#FAFAF9',
        'bg-secondary': '#F5F5F4',
        'bg-tertiary': '#E7E5E4',
        surface: '#FFFFFF',
        'border-light': '#D6D3D1',
        'text-primary': '#1C1917',
        'text-secondary': '#57534E',
        'text-tertiary': '#A8A29E',
        'text-inverse': '#FAFAF9',
        'bg-dark': '#1C1917',
        'bg-secondary-dark': '#292524',
        'bg-tertiary-dark': '#44403C',
        'surface-dark': '#292524',
        'border-dark': '#FAFAF9',
        'border-light-dark': '#57534E',
        'text-primary-dark': '#FAFAF9',
        'text-secondary-dark': '#A8A29E',
        'text-tertiary-dark': '#78716C',
        'text-inverse-dark': '#1C1917',
        'accent-hover': 'var(--color-accent-hover, #E9C430)',
        'accent-light': 'var(--color-accent-light, #F3F0FF)',
        'accent-text': 'var(--color-accent-text, #111111)',
        success: {
          DEFAULT: '#16A34A',
          bg: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
        info: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
        },
        domain: {
          health: '#16A34A',
          career: '#2563EB',
          learning: '#7C3AED',
          relationships: '#EC4899',
          finance: '#D97706',
          creativity: '#F97316',
          home: '#84CC16',
          spirituality: '#06B6D4',
          adventure: '#E11D48',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neo-sm': '3px 3px 0px 0px #292524',
        'neo-md': '5px 5px 0px 0px #292524',
        'neo-lg': '8px 8px 0px 0px #292524',
        'neo-xl': '10px 10px 0px 0px #292524',
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
    },
  },
  plugins: [],
}

export default config
