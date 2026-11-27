import autoprefixer from "autoprefixer"
import tailwindcss from "tailwindcss"
import { reliaforgeBreakpointLayers } from "./packages/plugin-sdk/postcss-layers.mjs"

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    reliaforgeBreakpointLayers(),
  ],
}
