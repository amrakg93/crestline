import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#f1f5f9",
        accent: {
          DEFAULT: "#22d3ee",
          foreground: "#020617",
        },
        surface: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          border: "#1e293b",
        },
        muted: {
          DEFAULT: "#64748b",
          foreground: "#94a3b8",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "progress-fill": "progressFill 1s ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progressFill: {
          "0%": { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
