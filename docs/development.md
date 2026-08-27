# Frontend Development

[简体中文](zh/development.md)

## Layering

```text
Page → feature hook → typed API function → shared HTTP client → backend
```

Pages never create HTTP clients or duplicate request state. `useAsyncResource` owns loading, data, error, retry, and unmount cancellation. API functions return response data rather than transport objects.

The hook-facing functions in `src/api/plugins.ts` delegate to one typed `ReliaForgeApi` adapter.
Normal builds select the Axios adapter; the public demo selects a validated static adapter. Pages
and hooks do not branch on that choice.

## Routes

The application has four platform routes:

- `/` for platform summary;
- `/plugins` for the manifest-backed catalog;
- `/plugins/{plugin_id}` for dynamic plugin detail;
- `/about` for project guidance.

English owns these unprefixed routes. Simplified Chinese mirrors them under `/zh`, for example
`/zh/plugins/{plugin_id}`. In the Pages demo these become `#/plugins/{plugin_id}` and
`#/zh/plugins/{plugin_id}`. `src/i18n/LocaleProvider.tsx` derives locale only from the URL, while the
repository-owned typed catalog under `src/i18n/` localizes presentation copy without changing API
data. The language switch preserves the semantic route and query string by changing only the URL
locale prefix. The URL is the sole persisted locale state; browser language never auto-redirects a
shared English link.

Plugin identifiers create detail links dynamically. Plugin-specific React bundles are intentionally outside the first release.

Normal builds use `BrowserRouter` and the `/` Vite base. The explicit demo build uses `HashRouter`
and `/reliaforge-frontend/`, so GitHub Pages detail links can be opened and reloaded without a
redirect shim. Build-mode interpretation stays in `src/config/buildMode.ts`.

## Configuration

Only `VITE_RELIAFORGE_API_URL` is supported. Use `.env.example` for cross-origin local development
and keep real environment files untracked. When the variable is absent, the client uses the
same-origin `/api/v1` path expected behind a production reverse proxy. Build variables are public
browser data and must never contain secrets.

## Static demo

```bash
npm run build:demo
npm run preview:demo
npm run test:e2e:demo
```

The [online demo](https://sajoluo.github.io/reliaforge-frontend/) uses the same response parsers and
UI as a normal build. Its fixtures contain only the public `demo` and `runbook` examples, return
independent values, expose no lifecycle actions, and perform no API request. See the
[project quick start](https://sajoluo.github.io/reliaforge/guide/getting-started.html) to run the complete
backend-managed lifecycle locally.

## Adding UI behavior

1. Add or update an interface in `src/types`.
2. Add a typed function in `src/api`.
3. Expose it through a feature hook.
4. Render loading, error, empty, and success states.
5. Add unit coverage and, for key journeys, a browser smoke.

Add every new user-facing string to both typed locale catalogs. Keep plugin IDs, capabilities,
schema keys, versions, API values, and commands canonical. Backend-provided arbitrary plugin prose
is data and must not be rewritten; only the shipped neutral demo fixture has optional localized
presentation labels.

Lifecycle buttons must come from `available_actions`; neither a page nor a hook may guess them from
the current state. Async hooks abort superseded requests and ignore stale or post-unmount results.
