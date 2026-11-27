export declare const SDK_VERSION: "1"

export declare const THEME_TOKEN_KEYS: readonly [
  "canvas",
  "panel",
  "ink",
  "muted",
  "line",
  "accent",
  "accent-ink",
  "accent-soft",
  "danger",
  "danger-button-ink",
  "danger-soft",
  "danger-ink",
  "success-soft",
  "success-ink",
  "warning-soft",
  "warning-ink",
  "neutral-soft",
  "neutral-ink",
  "inverse",
  "inverse-ink",
  "inverse-muted",
  "code-ink",
  "shadow",
]

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

export interface HostModuleDescriptor {
  readonly hasDefault: boolean
  readonly exports: readonly string[]
}

export declare const HOST_MODULE_EXPORTS: {
  readonly react: HostModuleDescriptor
  readonly "react/jsx-runtime": HostModuleDescriptor
  readonly "react-dom": HostModuleDescriptor
  readonly "react-router": HostModuleDescriptor
  readonly "react-router-dom": HostModuleDescriptor
  readonly "@reliaforge/plugin-sdk": HostModuleDescriptor
}

export type HostModuleName = keyof typeof HOST_MODULE_EXPORTS
