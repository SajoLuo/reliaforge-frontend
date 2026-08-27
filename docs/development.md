# Frontend Development

## Layering

```text
Page → feature hook → typed API function → shared HTTP client → backend
```

Pages never create HTTP clients or duplicate request state. `useAsyncResource` owns loading, data, error, retry, and unmount cancellation. API functions return response data rather than transport objects.

## Routes

The application has four platform routes:

- `/` for platform summary;
- `/plugins` for the manifest-backed catalog;
- `/plugins/{plugin_id}` for dynamic plugin detail;
- `/about` for project guidance.

Plugin identifiers create detail links dynamically. Plugin-specific React bundles are intentionally outside the first release.

## Configuration

Only `VITE_RELIAFORGE_API_URL` is supported. Use `.env.example` for cross-origin local development
and keep real environment files untracked. When the variable is absent, the client uses the
same-origin `/api/v1` path expected behind a production reverse proxy. Build variables are public
browser data and must never contain secrets.

## Adding UI behavior

1. Add or update an interface in `src/types`.
2. Add a typed function in `src/api`.
3. Expose it through a feature hook.
4. Render loading, error, empty, and success states.
5. Add unit coverage and, for key journeys, a browser smoke.

Lifecycle buttons must come from `available_actions`; neither a page nor a hook may guess them from
the current state. Async hooks abort superseded requests and ignore stale or post-unmount results.
