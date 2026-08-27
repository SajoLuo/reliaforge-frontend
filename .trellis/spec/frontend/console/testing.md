# Frontend Testing

## Trusted Test Layers

- Colocated Vitest tests cover response parsers, adapter behavior, hooks, routing, and components.
- `playwright.config.ts` runs the normal HTTP UI contract with mocked responses and an optional live
  backend smoke.
- `playwright.demo.config.ts` builds and previews the Pages artifact, then runs only
  `tests/demo.spec.ts` on desktop and mobile Chromium profiles.
- Node tests cover the public API contract checker and repository hygiene scanner.

Tests should use accessible roles or stable `data-testid` attributes. Do not use fixed delays,
shared mutable state, or selectors based on styling classes.

## Required Demo Coverage

The demo journey must cover overview, catalog, runbook detail, a reloaded hash deep link, refresh,
the persistent read-only notice, missing lifecycle controls, mobile navigation, and zero `/api/v1`
requests. It must exercise English and Chinese deep links, equivalent-route switching, explicit
URL locale persistence, correct `lang` metadata, translated mobile controls, and unchanged plugin
IDs/capabilities/schema keys. Adapter unit tests must cover fixture validation, independent results,
missing IDs, aborted requests, and fail-loud writes.

Locale routing unit tests must prove that `/zh` is the only locale prefix. Browser smoke must prove
that browser language never redirects an English link. Fixture presentation tests must prove that
translation does not mutate the parsed contract object or rewrite arbitrary backend-provided
presentation fields.

## CI and Deployment

The Pages artifact is produced only after the complete unit/build gate and both normal and demo
browser suites. The deploy job may run only for `main`, must depend on the browser job, and receives
only `pages: write` and `id-token: write`. Pull requests and tags never deploy. Outer workflow
concurrency may cancel stale non-main checks, but it must not cancel an in-progress `main`
deployment.

Do not weaken coverage thresholds or skip existing normal/live-backend contracts to make demo tests
pass. Generated `dist`, coverage, Playwright report, and test result directories remain untracked.
