import { createRequire } from "node:module"
import type { Config } from "tailwindcss"

const require = createRequire(import.meta.url)
const sdkPreset = require("./packages/plugin-sdk/tailwind-preset.cjs") as Config

export default {
  presets: [sdkPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  plugins: [],
} satisfies Config
