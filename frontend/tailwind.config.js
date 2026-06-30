/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#f9f9ff',
        'surface-dim': '#cfdaf1',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f3ff',
        'surface-container': '#e7eeff',
        'surface-container-high': '#dee8ff',
        'surface-container-highest': '#d8e3fa',
        'on-surface': '#111c2c',
        'on-surface-variant': '#434653',
        'inverse-surface': '#263142',
        'inverse-on-surface': '#ebf1ff',
        outline: '#737784',
        'outline-variant': '#c3c6d5',
        'surface-tint': '#1d59c1',
        primary: {
          DEFAULT: '#003c90',
          container: '#0f52ba',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#bcceff',
        'inverse-primary': '#b0c6ff',
        secondary: {
          DEFAULT: '#006970',
          container: '#7af1fc',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#006e75',
        tertiary: {
          DEFAULT: '#3a4248',
          container: '#52595f',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#c8cfd7',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'primary-fixed': '#d9e2ff',
        'primary-fixed-dim': '#b0c6ff',
        'on-primary-fixed': '#001945',
        'on-primary-fixed-variant': '#00419c',
        'secondary-fixed': '#7df4ff',
        'secondary-fixed-dim': '#5dd8e2',
        'on-secondary-fixed': '#002022',
        'on-secondary-fixed-variant': '#004f54',
        'tertiary-fixed': '#dce3eb',
        'tertiary-fixed-dim': '#c0c7cf',
        'on-tertiary-fixed': '#151c22',
        'on-tertiary-fixed-variant': '#40484e',
        background: '#f9f9ff',
        'on-background': '#111c2c',
        'surface-variant': '#d8e3fa',
        
        warning: {
          DEFAULT: '#f59e0b',
        },
        stable: {
          DEFAULT: '#10b981',
        },
        danger: {
          DEFAULT: '#ef4444',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '20px',
        'margin-mobile': '16px',
        'margin-desktop': '40px',
      },
      boxShadow: {
        'level-1': '0 4px 4px 0 rgba(0, 0, 0, 0.05)',
        'level-2': '0 12px 12px 0 rgba(0, 0, 0, 0.10)',
      }
    },
  },
  plugins: [],
}
