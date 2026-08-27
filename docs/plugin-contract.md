# Plugin Contract Rendered by the UI

The catalog and detail pages consume the same plugin representation.

| Field | Purpose |
| --- | --- |
| `id` | Stable URL-safe plugin identifier |
| `name` | Human-readable name |
| `version` | Plugin version |
| `description` | Short public description |
| `api_version` | Framework contract version |
| `state` | Current lifecycle state; degraded is not a lifecycle value |
| `available_actions` | Ordered lifecycle actions currently authorized by the backend |
| `dependencies` | Required plugin objects with `id` and a SemVer `version` range |
| `capabilities` | Public capability identifiers |
| `settings_schema` | Public JSON schema derived from the plugin's Python Settings class |
| `frontend` | Metadata object with an optional nullable category hint for the generic catalog |
| `health` | Side-effect-free health snapshot |

The UI treats unknown settings fields as data for inspection. It does not edit secrets or execute arbitrary plugin code.
Detail links are always derived from the plugin ID. Health can be degraded while lifecycle remains
running. Platform counts are mutually exclusive: running, degraded, stopped, and error.
The UI never derives start, stop, or restart availability from lifecycle state. A failed record,
an unresolved dependency, or active dependents can legitimately produce an empty action list.
