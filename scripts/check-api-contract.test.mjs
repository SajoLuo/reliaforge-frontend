import assert from "node:assert/strict"
import test from "node:test"
import { validateApiContract } from "./check-api-contract.mjs"

function contractDocument() {
  const pluginProperties = Object.fromEntries([
    "id",
    "name",
    "version",
    "description",
    "api_version",
    "state",
    "capabilities",
    "settings_schema",
    "health",
  ].map((field) => [field, { type: "string" }]))
  pluginProperties.available_actions = {
    type: "array",
    items: { $ref: "#/components/schemas/PluginAction" },
  }
  pluginProperties.dependencies = {
    type: "array",
    items: { $ref: "#/components/schemas/PluginDependency" },
  }
  pluginProperties.frontend = {
    $ref: "#/components/schemas/FrontendView",
  }
  const paths = Object.fromEntries([
    ["/api/v1/live", "get"],
    ["/api/v1/ready", "get"],
    ["/api/v1/status", "get"],
    ["/api/v1/plugins", "get"],
    ["/api/v1/plugins/{plugin_id}", "get"],
    ["/api/v1/plugins/{plugin_id}/start", "post"],
    ["/api/v1/plugins/{plugin_id}/stop", "post"],
    ["/api/v1/plugins/{plugin_id}/restart", "post"],
    ["/api/v1/plugins/{plugin_id}/ui/{asset_path}", "get"],
  ].map(([route, method]) => [route, { [method]: {} }]))
  return {
    paths,
    components: {
      schemas: {
        PluginAction: { type: "string", enum: ["start", "stop", "restart"] },
        PluginDependency: {
          properties: {
            id: { type: "string" },
            version: { type: "string" },
            optional: { type: "boolean" },
          },
        },
        FrontendNavItem: {
          properties: {
            label: { type: "string" },
            label_zh: { anyOf: [{ type: "string" }, { type: "null" }] },
            path: { type: "string" },
            icon: { anyOf: [{ type: "string" }, { type: "null" }] },
            order: { type: "integer" },
            section: { type: "string", enum: ["workspace", "operations", "platform"] },
          },
        },
        FrontendView: {
          properties: {
            category: { anyOf: [{ type: "string" }, { type: "null" }] },
            ui_mode: { type: "string", enum: ["none", "esm"] },
            nav: { type: "array", items: { $ref: "#/components/schemas/FrontendNavItem" } },
            provides_themes: { type: "array", items: { type: "string" } },
            entry_url: { anyOf: [{ type: "string" }, { type: "null" }] },
            style_url: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
        PluginView: {
          required: Object.keys(pluginProperties),
          properties: pluginProperties,
        },
      },
    },
  }
}

test("contract checker accepts the public management API", () => {
  assert.deepEqual(validateApiContract(contractDocument()), [])
})

test("contract checker reports endpoint, field, and action drift", () => {
  const document = contractDocument()
  delete document.paths["/api/v1/ready"]
  delete document.paths["/api/v1/plugins/{plugin_id}/restart"]
  delete document.paths["/api/v1/plugins/{plugin_id}/ui/{asset_path}"]
  delete document.components.schemas.PluginDependency.properties.optional
  delete document.components.schemas.FrontendView.properties.entry_url
  document.components.schemas.PluginView.required = ["id"]
  document.components.schemas.PluginAction.enum = ["start"]

  const errors = validateApiContract(document)
  assert.ok(errors.includes("missing endpoint: GET /api/v1/ready"))
  assert.ok(errors.includes("missing endpoint: POST /api/v1/plugins/{plugin_id}/restart"))
  assert.ok(errors.includes("missing endpoint: GET /api/v1/plugins/{plugin_id}/ui/{asset_path}"))
  assert.ok(errors.includes("PluginView field is not required: available_actions"))
  assert.ok(errors.includes("PluginAction enum must contain restart, start, and stop"))
  assert.ok(errors.includes("PluginDependency schema must declare optional"))
  assert.ok(errors.includes("FrontendView missing field: entry_url"))
})
