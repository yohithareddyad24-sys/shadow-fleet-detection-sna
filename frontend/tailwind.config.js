/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'navy-bg': 'var(--color-bg)',
        'navy-sidebar': 'var(--color-sidebar)',
        'navy-card': 'var(--color-card)',
        'navy-elevated': 'var(--color-elevated)',
        'navy-border': 'var(--color-border)',
        'accent-cyan': 'var(--color-accent-cyan)',
        'accent-blue': 'var(--color-accent-blue)',
        'risk-warning': 'var(--color-warning)',
        'risk-alert': 'var(--color-high-alert)',
        'risk-success': 'var(--color-success)',
        'text-primary': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
      },
      boxShadow: {
        'radar': '0 0 15px rgba(32, 213, 232, 0.15)',
        'alert': '0 0 15px rgba(255, 92, 101, 0.25)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 4s linear infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
