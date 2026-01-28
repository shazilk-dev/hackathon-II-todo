import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* =========================================
         2026 UI DESIGN SYSTEM - TAILWIND TOKENS
         ========================================= */

      /* Semantic Colors */
      colors: {
        // Surface tokens
        surface: {
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
        },
        // Text tokens
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
        },
        // Action tokens
        action: {
          primary: 'var(--action-primary)',
          'primary-hover': 'var(--action-primary-hover)',
          secondary: 'var(--action-secondary)',
          'secondary-hover': 'var(--action-secondary-hover)',
          ghost: 'var(--action-ghost)',
          'ghost-hover': 'var(--action-ghost-hover)',
        },
        // State tokens
        state: {
          success: 'var(--state-success)',
          'success-light': 'var(--state-success-light)',
          warning: 'var(--state-warning)',
          'warning-light': 'var(--state-warning-light)',
          error: 'var(--state-error)',
          'error-light': 'var(--state-error-light)',
          info: 'var(--state-info)',
          'info-light': 'var(--state-info-light)',
        },
        // Border tokens
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)',
        },
      },

      /* Typography Scale (Major Third) */
      fontSize: {
        'hero': ['var(--font-hero)', { lineHeight: 'var(--line-tight)', letterSpacing: 'var(--tracking-tighter)' }],
        'h1': ['var(--font-h1)', { lineHeight: 'var(--line-tight)', letterSpacing: 'var(--tracking-tight)' }],
        'h2': ['var(--font-h2)', { lineHeight: 'var(--line-snug)', letterSpacing: 'var(--tracking-tight)' }],
        'h3': ['var(--font-h3)', { lineHeight: 'var(--line-snug)', letterSpacing: 'var(--tracking-normal)' }],
        'h4': ['var(--font-h4)', { lineHeight: 'var(--line-normal)', letterSpacing: 'var(--tracking-normal)' }],
        'body-lg': ['var(--font-body-lg)', { lineHeight: 'var(--line-relaxed)' }],
        'body': ['var(--font-body)', { lineHeight: 'var(--line-relaxed)' }],
        'body-sm': ['var(--font-body-sm)', { lineHeight: 'var(--line-normal)' }],
        'caption': ['var(--font-caption)', { lineHeight: 'var(--line-normal)', letterSpacing: 'var(--tracking-wide)' }],
        'tiny': ['var(--font-tiny)', { lineHeight: 'var(--line-normal)', letterSpacing: 'var(--tracking-wider)' }],
      },

      /* Spacing System (8pt Grid) */
      spacing: {
        '0': 'var(--space-0)',
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        'navbar': 'var(--navbar-height)',
        'sidebar': 'var(--sidebar-width)',
      },

      /* Border Radius (2026 Standard) */
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },

      /* Box Shadows (Colored, not gray) */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'none': 'none',
      },

      /* Max Widths */
      maxWidth: {
        'content': 'var(--content-max)',
        'container': 'var(--container-max)',
      },

      /* Height */
      height: {
        'navbar': 'var(--navbar-height)',
        'mobile-navbar': 'var(--mobile-navbar)',
      },

      /* Width */
      width: {
        'sidebar': 'var(--sidebar-width)',
      },

      /* Transitions */
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'spring': '500ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      /* Animations */
      animation: {
        'blob': 'blob 8s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fade-in 300ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'bounce': 'bounce 1s ease-in-out infinite',
        'skeleton': 'skeleton-shimmer 1.5s ease-in-out infinite',
      },

      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '50%': { transform: 'translate(-10px, 20px) scale(0.95)' },
          '75%': { transform: 'translate(-20px, -15px) scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      /* Backdrop Blur */
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
