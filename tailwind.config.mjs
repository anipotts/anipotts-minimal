/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: {
          DEFAULT: "#a78bfa", // lavender-400
          400: "#a78bfa",
        },
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
      },
      fontFamily: {
        sans: ["var(--font-mono)", "monospace"], // Override sans to use mono
        mono: ["var(--font-mono)", "monospace"],
        heading: ["var(--font-mono)", "monospace"], // Override heading too
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
