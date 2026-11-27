export declare const SDK_VERSION: "1"

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
