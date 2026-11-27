import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import * as sdk from "@reliaforge/plugin-sdk"
import { HOST_MODULE_EXPORTS, SDK_VERSION, type HostModuleName } from "@reliaforge/plugin-sdk"
import { buildHostBridge, installHostBridge } from "@/runtime/hostBridge"

afterEach(() => {
  cleanup()
  delete window.__RELIAFORGE_HOST__
})

describe("hostBridge and @reliaforge/plugin-sdk", () => {
  it("exposes every export listed in HOST_MODULE_EXPORTS as a frozen bridge", () => {
    const bridge = installHostBridge()
    expect(bridge.sdkVersion).toBe(SDK_VERSION)
    expect(Object.isFrozen(bridge)).toBe(true)
    expect(Object.isFrozen(bridge.modules)).toBe(true)
    expect(window.__RELIAFORGE_HOST__).toBe(bridge)

    for (const moduleName of Object.keys(HOST_MODULE_EXPORTS) as HostModuleName[]) {
      const descriptor = HOST_MODULE_EXPORTS[moduleName]
      const registered = bridge.modules[moduleName]
      expect(registered, `missing host module ${moduleName}`).toBeDefined()
      expect(Object.isFrozen(registered)).toBe(true)
      for (const exportName of descriptor.exports) {
        expect(registered[exportName], `missing ${moduleName}.${exportName}`).toBeDefined()
      }
      if (descriptor.hasDefault) {
        expect(registered.default, `missing default export on ${moduleName}`).toBeDefined()
      }
    }
  })

  it("renders SDK components through the mounted host bridge", () => {
    installHostBridge()
    render(
      <MemoryRouter>
        <sdk.Card>
          <sdk.CardHeader>Header</sdk.CardHeader>
          <sdk.CardContent>
            <sdk.PageHeader title="Ops" description="Ready" />
            <sdk.Badge tone="success">OK</sdk.Badge>
            <sdk.Button type="button">Action</sdk.Button>
          </sdk.CardContent>
        </sdk.Card>
      </MemoryRouter>,
    )

    expect(screen.getByText("Header")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Ops" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
  })

  it("throws a clear error when the host bridge is missing", () => {
    expect(() => sdk.useLocale()).toThrow("window.__RELIAFORGE_HOST__")
    const bridge = buildHostBridge()
    expect(bridge.modules["@reliaforge/plugin-sdk"]).toBeDefined()
  })
})
