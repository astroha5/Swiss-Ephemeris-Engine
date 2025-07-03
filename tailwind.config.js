/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary': '#F4B942', // golden-yellow
        'primary-50': '#FFFBEB', // amber-50
        'primary-100': '#FEF3C7', // amber-100
        'primary-200': '#FDE68A', // amber-200
        'primary-300': '#FCD34D', // amber-300
        'primary-400': '#FBBF24', // amber-400
        'primary-500': '#F4B942', // golden-yellow
        'primary-600': '#D97706', // amber-600
        'primary-700': '#B45309', // amber-700
        'primary-800': '#92400E', // amber-800
        'primary-900': '#78350F', // amber-900
        'primary-foreground': '#2D2D2D', // charcoal

        // Secondary Colors
        'secondary': '#1E3A5F', // slate-800
        'secondary-50': '#F8FAFC', // slate-50
        'secondary-100': '#F1F5F9', // slate-100
        'secondary-200': '#E2E8F0', // slate-200
        'secondary-300': '#CBD5E1', // slate-300
        'secondary-400': '#94A3B8', // slate-400
        'secondary-500': '#64748B', // slate-500
        'secondary-600': '#475569', // slate-600
        'secondary-700': '#334155', // slate-700
        'secondary-800': '#1E3A5F', // slate-800
        'secondary-900': '#0F172A', // slate-900
        'secondary-foreground': '#FFFFFF', // white

        // Accent Colors
        'accent': '#E8935A', // orange-400
        'accent-50': '#FFF7ED', // orange-50
        'accent-100': '#FFEDD5', // orange-100
        'accent-200': '#FED7AA', // orange-200
        'accent-300': '#FDBA74', // orange-300
        'accent-400': '#E8935A', // orange-400
        'accent-500': '#F97316', // orange-500
        'accent-600': '#EA580C', // orange-600
        'accent-700': '#C2410C', // orange-700
        'accent-800': '#9A3412', // orange-800
        'accent-900': '#7C2D12', // orange-900
        'accent-foreground': '#FFFFFF', // white

        // Background Colors
        'background': '#FEFCF8', // stone-50
        'background-secondary': '#FFFFFF', // white
        'surface': '#FFFFFF', // white
        'surface-secondary': '#F9FAFB', // gray-50

        // Text Colors
        'text-primary': '#2D2D2D', // gray-800
        'text-secondary': '#6B7280', // gray-500
        'text-muted': '#9CA3AF', // gray-400
        'text-inverse': '#FFFFFF', // white

        // Status Colors
        'success': '#10B981', // emerald-500
        'success-50': '#ECFDF5', // emerald-50
        'success-100': '#D1FAE5', // emerald-100
        'success-500': '#10B981', // emerald-500
        'success-600': '#059669', // emerald-600
        'success-foreground': '#FFFFFF', // white

        'warning': '#F59E0B', // amber-500
        'warning-50': '#FFFBEB', // amber-50
        'warning-100': '#FEF3C7', // amber-100
        'warning-500': '#F59E0B', // amber-500
        'warning-600': '#D97706', // amber-600
        'warning-foreground': '#FFFFFF', // white

        'error': '#DC2626', // red-600
        'error-50': '#FEF2F2', // red-50
        'error-100': '#FEE2E2', // red-100
        'error-500': '#EF4444', // red-500
        'error-600': '#DC2626', // red-600
        'error-foreground': '#FFFFFF', // white

        // Border Colors
        'border': 'rgba(244, 185, 66, 0.2)', // primary with opacity
        'border-light': 'rgba(244, 185, 66, 0.1)', // primary with light opacity
        'border-strong': 'rgba(244, 185, 66, 0.4)', // primary with strong opacity
      },
      fontFamily: {
        'heading': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
        'caption': ['Source Sans Pro', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.25rem', // 4px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'xl': '1rem', // 16px
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(244, 185, 66, 0.15)',
        'medium': '0 4px 16px rgba(244, 185, 66, 0.15)',
        'strong': '0 8px 32px rgba(244, 185, 66, 0.15)',
        'celestial': '0 4px 20px rgba(244, 185, 66, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'orbit': 'orbit 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'out': 'ease-out',
        'celestial': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '900': '900',
        '1000': '1000',
        '1100': '1100',
        '1200': '1200',
        '1300': '1300',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}