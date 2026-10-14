import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#faf6ee",
          deep: "#f3ecdd",
          card: "#fffdf8",
          line: "#e5dcc8",
        },
        ink: {
          DEFAULT: "#22301f",
          soft: "#4a5648",
          faint: "#7c8577",
        },
        forest: {
          DEFAULT: "#1d4a35",
          deep: "#143626",
          soft: "#2e6b4e",
          mist: "#e7efe8",
        },
        gold: {
          DEFAULT: "#b8862f",
          deep: "#8f6620",
          soft: "#d9b25f",
          mist: "#f6ecd4",
        },
        ledger: {
          red: "#a33327",
          amber: "#a86a14",
          green: "#2e6b4e",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        ledger: "0 1px 0 0 #e5dcc8, 0 8px 24px -12px rgba(34,48,31,0.18)",
        card: "0 2px 12px -4px rgba(34,48,31,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
