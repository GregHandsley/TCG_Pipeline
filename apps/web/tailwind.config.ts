import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // use CSS vars (RGB triplets recommended for alpha utilities)
        brand: "rgb(var(--brand) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted-ink) / <alpha-value>)",
      },
      ringColor: {
        brand: "rgb(var(--brand) / 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
