import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#667085",
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2f80ed",
          600: "#1f6fd3",
          700: "#1959aa"
        },
        mint: "#15b8a6",
        coral: "#f97366"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)"
      }
    },
  },
  plugins: [],
} satisfies Config;
