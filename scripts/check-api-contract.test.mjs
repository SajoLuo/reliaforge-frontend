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
    "dependencies",
    "capabilities",
    "settings_schema",
    "frontend",
    "health",
  ].map((field) => [field, { type: "string" }]))
  pluginProperties.available_actions = {
    type: "array",
    items: { $ref: "#/components/schemas/PluginAction" },
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
  ].map(([route, method]) => [route, { [method]: {} }]))
  return {
    paths,
    components: {
      schemas: {
        PluginAction: { type: "string", enum: ["start", "stop", "restart"] },
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
  document.components.schemas.PluginView.required = ["id"]
  document.components.schemas.PluginAction.enum = ["start"]

  const errors = validateApiContract(document)
  assert.ok(errors.includes("missing endpoint: GET /api/v1/ready"))
  assert.ok(errors.includes("missing endpoint: POST /api/v1/plugins/{plugin_id}/restart"))
  assert.ok(errors.includes("PluginView field is not required: available_actions"))
  assert.ok(errors.includes("PluginAction enum must contain restart, start, and stop"))
})
