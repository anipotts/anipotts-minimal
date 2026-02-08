/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
          darker: "var(--card-darker)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          400: "var(--accent-400)",
        },
        signal: {
          green: "#4ade80", // green-400
          red: "#ef4444",   // red-500
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
        },
        ring: {
          DEFAULT: "var(--ring)",
        },
        input: "var(--input-bg)",
        heading: "var(--text-heading)",
        body: "var(--text-body)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-faint)",
        },
        faint: "var(--text-faint)",
        overlay: {
          5: "rgba(var(--overlay-base), 0.05)",
          10: "rgba(var(--overlay-base), 0.10)",
          20: "rgba(var(--overlay-base), 0.20)",
          30: "rgba(var(--overlay-base), 0.30)",
        },
      },
      fontFamily: {
        sans: ["var(--font-mono)", "monospace"],
        mono: ["var(--font-mono)", "monospace"],
        heading: ["var(--font-mono)", "monospace"],
      },
      animation: {
        'signal-pulse': 'signal-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'signal-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
