/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core semantic colors mapped to CSS variables
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        
        // Semantic text
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },

        // Primary Brand Colors (Agricultural Green)
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },

        // Legacy compatibility (to not break everything at once)
        agriGreen: '#16a34a',
        agriDark: '#14532d',
        agriLight: '#dcfce7',
        agriBg: '#f0fdf4',

        // Secondary Accents (e.g., Market, Community)
        accent: {
          purple: '#9333ea', // Community
          blue: '#2563eb',   // Info/Market
          orange: '#ea580c', // Schemes/Alerts
          yellow: '#ca8a04', // Warnings
        }
      }
    },
  },
  plugins: [],
}