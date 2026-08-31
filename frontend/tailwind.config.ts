import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables in globals.css.
        // Use these for surfaces/text so light/dark switch automatically.
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        ring: "rgb(var(--ring) / <alpha-value>)",
        // Uptime status scale - see globals.css.
        ok: {
          DEFAULT: "rgb(var(--ok) / <alpha-value>)",
          strong: "rgb(var(--ok-strong) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
          strong: "rgb(var(--warn-strong) / <alpha-value>)",
        },
        down: {
          DEFAULT: "rgb(var(--down) / <alpha-value>)",
          strong: "rgb(var(--down-strong) / <alpha-value>)",
        },
        nodata: "rgb(var(--nodata) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
