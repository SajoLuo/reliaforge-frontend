# API and Action Boundaries

## Scenario: adapter-backed console data

### 1. Scope / Trigger

Apply this contract when changing API operations, runtime parsers, hooks, static fixtures,
localized plugin presentation, or lifecycle controls. The adapter seam lets the same console run
against HTTP or validated static data without changing pages or domain types.

### 2. Signatures

```ts
interface ReliaForgeApi {
  getPlatformStatus(signal?: AbortSignal): Promise<PlatformStatusResponse>
  listPlugins(signal?: AbortSignal): Promise<PluginListResponse>
  getPlugin(pluginId: string, signal?: AbortSignal): Promise<PluginView>
  runPluginAction(pluginId: string, action: PluginAction, signal?: AbortSignal): Promise<PluginView>
}
```

The data flow is `page -> feature hook -> src/api/plugins.ts -> ReliaForgeApi adapter`.
`src/api/plugins.ts` is the only API module imported by `src/hooks/usePlugins.ts`.

### 3. Contracts

- `src/api/httpAdapter.ts` preserves Axios endpoints, cancellation, runtime parsing, and the
  extended lifecycle timeout used by normal builds.
- `src/api/demoAdapter.ts` validates deterministic public fixtures through
  `src/api/contracts.ts`, returns independent objects, and exposes empty `available_actions`.
- `src/api/client.ts` is the sole HTTP client; its same-origin fallback remains `/api/v1`.
- A lost lifecycle response or server/gateway error is an unconfirmed outcome. Read state once,
  preserve the warning across automatic and manual status reads, and never automatically repeat
  the write. Keep authoritative successful
  POST responses as the primary result and preserve route/unmount guards.
- `PluginView.available_actions` is the sole source of lifecycle controls. State and health never
  imply authorization.
- Localization happens after parsing. Only the exact shipped neutral fixture values may receive
  translated labels. Arbitrary backend prose, identifiers, and schema values remain unchanged.

### 4. Validation & Error Matrix

| Condition | Required behavior |
| --- | --- |
| malformed HTTP payload | runtime parser rejects it before hooks receive data |
| malformed static fixture | demo adapter construction or request rejects it |
| aborted request | adapter surfaces cancellation without substituting fixture data |
| unknown demo plugin ID | return the same not-found behavior expected by the page |
| demo action call | reject loudly; do not mutate or simulate state |
| unknown backend plugin/category | preserve backend-provided presentation fields |

### 5. Good / Base / Bad Cases

- Good: both adapters return parser-validated `PluginView` values through the same facade.
- Base: an ordinary build continues to use HTTP and the existing `/api/v1` routes.
- Bad: importing Axios in a page, sharing mutable fixture objects, translating any category named
  `Examples`, or hiding writes with an `isDemo` conditional.

### 6. Tests Required

- Adapter unit tests cover parsing, independent results, missing IDs, aborts, and fail-loud writes.
- Presentation tests prove fixture localization does not mutate contract objects or rewrite an
  arbitrary backend plugin.
- API contract checks change with backend response models.
- Demo browser tests prove zero `/api/v1` requests and zero lifecycle controls.
- Run `npm run typecheck`, `npm run test:coverage`, and both Playwright suites.

### 7. Wrong vs Correct

```ts
// Wrong: action availability is guessed in the browser.
const actions = plugin.state === "running" ? ["stop", "restart"] : ["start"]

// Correct: the backend-owned contract is rendered directly.
const actions = plugin.available_actions
```

When a backend payload changes, update the TypeScript type, parser, adapter tests, public contract
checker, and rendered documentation together. Never add client-side management credentials or
manifest-level authorization overrides.
