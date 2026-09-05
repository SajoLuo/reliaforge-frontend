# Plugin data shown by the console

[简体中文](zh/plugin-contract.md)

The plugin list and detail page use the same backend response.

| Field | What the console shows |
| --- | --- |
| `id` | Plugin ID and detail URL |
| `name` | Display name |
| `version` | Plugin version |
| `description` | Plugin description |
| `api_version` | ReliaForge plugin API version |
| `state` | Current run state |
| `available_actions` | Start, stop, or restart buttons currently allowed by the backend |
| `dependencies` | Required plugin IDs and accepted SemVer ranges |
| `capabilities` | Shared Python services available to other plugins |
| `settings_schema` | Configuration fields from the plugin's Python settings class |
| `frontend` | Optional category for grouping the plugin |
| `health` | Reported health status and diagnostic details |

Health can be degraded while the plugin remains running. Summary counts place each plugin in one of
four groups: running, degraded, stopped, or error.

The console never calculates `available_actions` from plugin state. An action list can be empty when
a plugin failed to load, a dependency is unavailable, or a running plugin depends on it. The
read-only demo uses empty action lists for every saved plugin.

Client-generated labels and errors are translated. Data returned by the backend remains unchanged,
including plugin IDs, names, descriptions, capabilities, dependency ranges, versions, schema keys,
action values, and backend error details.
