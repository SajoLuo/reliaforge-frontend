# Frontend Console Guidelines

These repository-local rules describe the public ReliaForge React console. They are intentionally
small and point to canonical source and tests instead of duplicating implementation documentation.

## Pre-Development Checklist

1. For API, fixture, parser, or lifecycle-action work, read [API and actions](api-and-actions.md).
2. For entrypoint, router, Vite mode, base path, or deployment work, read
   [Routing and build modes](routing-and-build-modes.md).
   This includes locale routes, language switches, and browser metadata.
3. For any behavior change, read [Testing](testing.md) and identify the smallest regression test.
4. Search for the existing symbol or contract before adding a new helper or mode.
5. Keep browser configuration public and keep lifecycle authorization owned by API data.

## Repository Shape

- `src/pages/` renders platform routes.
- `src/hooks/` owns async resource and action state.
- `src/api/` owns transport adapters, response parsing, and the hook-facing facade.
- `src/config/buildMode.ts` is the build-mode boundary.
- `src/i18n/` owns typed presentation messages and locale-path mapping; it never rewrites API data.
- `src/routing/AppRouter.tsx` owns router selection.
- `tests/` contains Playwright journeys; colocated `*.test.ts(x)` files contain unit tests.

## Complete Quality Gate

```text
npm ci --ignore-scripts
npm audit --audit-level=high
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run build:demo
npm run test:e2e
npm run test:e2e:demo
npm run check:hygiene
```

Also run `git diff --check`. Cross-repository contract checks use the optional command documented in
`README.md`; they are not replaced by static demo tests.
