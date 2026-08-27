# Routing and Build Modes

## Scenario: normal console and hosted read-only demo

### 1. Scope / Trigger

Apply this contract when changing Vite modes, the application entry point, routing, locale paths,
browser metadata, or GitHub Pages deployment. The normal console and hosted demo share pages and
components but intentionally differ at the router, asset-base, and data-adapter boundaries.

### 2. Signatures

```text
npm run build        # base=/, BrowserRouter, HTTP adapter
npm run build:demo   # base=/reliaforge-frontend/, HashRouter, static demo adapter
npm run test:e2e
npm run test:e2e:demo
```

`src/config/buildMode.ts` is the only application module that interprets `import.meta.env.MODE`.
`vite.config.ts` owns the asset base, and `src/routing/AppRouter.tsx` owns router selection.

### 3. Contracts

| Build | Vite base | Router | Data source |
| --- | --- | --- | --- |
| normal | `/` | `BrowserRouter` | HTTP adapter |
| demo | `/reliaforge-frontend/` | `HashRouter` | static demo adapter |

- Only the exact `demo` mode selects demo behavior. Development, test, and production use the
  normal contract.
- English routes are unprefixed. Simplified Chinese mirrors the complete route tree under `/zh`.
- `#/plugins/runbook` and `#/zh/plugins/runbook` must both reload directly on GitHub Pages.
- Locale comes only from the URL, never browser detection or stored preference. The switch changes
  only the locale prefix, preserves the query string, and updates document language and metadata.
- API values, plugin IDs, capabilities, schema keys, versions, actions, and commands remain
  canonical in every locale.
- Presentation code may read `isDemo` only for the persistent read-only notice. It must not select
  adapters, infer permissions, or fork pages.

### 4. Validation & Error Matrix

| Condition | Required behavior |
| --- | --- |
| mode is `demo` | use the Pages base, hash router, and static adapter |
| mode is anything else | use root base, browser router, and HTTP adapter |
| path starts with `/zh` | render Chinese presentation and `lang=zh-CN` |
| unprefixed path with Chinese browser locale | remain on the English URL and render English |
| unknown route | redirect to the current locale's overview route |
| demo lifecycle call reaches the adapter | reject loudly; never simulate a write |

### 5. Good / Base / Bad Cases

- Good: switching `#/plugins/runbook?tab=contract` produces
  `#/zh/plugins/runbook?tab=contract`.
- Base: `npm run build` preserves the existing root-hosted production behavior.
- Bad: adding local storage that is written but never consumed, browser-language redirects, a
  Pages redirect file, or a second demo-only page tree.

### 6. Tests Required

- Build-mode and router unit tests must cover the exact `demo` selection and normal fallback.
- Locale tests must cover semantic path mapping and query preservation.
- `npm run test:e2e:demo` must cover both locale deep links, reload, document metadata, zero
  `/api/v1` traffic, and absent lifecycle controls.
- Browser smoke must prove a Chinese browser locale does not redirect an English shared URL.
- Run both builds and inspect generated asset paths after changing Vite or Pages configuration.

### 7. Wrong vs Correct

```ts
// Wrong: presentation code selects infrastructure and hides policy.
const api = isDemo ? demoApi : httpApi
const showActions = !isDemo

// Correct: the facade selects one adapter; UI renders server-owned available_actions.
const api = activeApi
const showActions = plugin.available_actions.length > 0
```

Keep `src/i18n/` as a small typed two-locale layer. Do not add runtime machine translation or a
general localization dependency without a demonstrated requirement.
