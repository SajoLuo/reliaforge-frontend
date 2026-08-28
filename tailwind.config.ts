import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--danger-soft) / <alpha-value>)",
        "danger-ink": "rgb(var(--danger-ink) / <alpha-value>)",
        "success-soft": "rgb(var(--success-soft) / <alpha-value>)",
        "success-ink": "rgb(var(--success-ink) / <alpha-value>)",
        "warning-soft": "rgb(var(--warning-soft) / <alpha-value>)",
        "warning-ink": "rgb(var(--warning-ink) / <alpha-value>)",
        "neutral-soft": "rgb(var(--neutral-soft) / <alpha-value>)",
        "neutral-ink": "rgb(var(--neutral-ink) / <alpha-value>)",
        inverse: "rgb(var(--inverse) / <alpha-value>)",
        "inverse-ink": "rgb(var(--inverse-ink) / <alpha-value>)",
        "inverse-muted": "rgb(var(--inverse-muted) / <alpha-value>)",
        "code-ink": "rgb(var(--code-ink) / <alpha-value>)",
      },
      boxShadow: {
        lift: "0 12px 32px -24px rgb(var(--shadow) / 0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config
