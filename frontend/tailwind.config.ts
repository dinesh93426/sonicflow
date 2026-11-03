import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: {
          DEFAULT: "#121216",
          elevated: "#18181f",
          card: "#1e1e26",
          hover: "#262632",
          border: "#2e2e3d",
        },
        primary: {
          DEFAULT: "#10b981", // vibrant emerald / electric green
          glow: "#059669",
          hover: "#34d399",
          muted: "rgba(16, 185, 129, 0.15)",
        },
        accent: {
          lime: "#22c55e",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
        muted: {
          DEFAULT: "#a1a1aa",
          dim: "#71717a",
          dark: "#52525b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "equalizer": "equalize 1.2s ease-in-out infinite",
      },
      keyframes: {
        equalize: {
          "0%, 100%": { height: "20%" },
          "50%": { height: "100%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
