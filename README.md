# ReliaForge Frontend

ReliaForge is a lightweight workspace for lifecycle-managed operations plugins. This repository contains the neutral React management interface. It discovers plugins through the backend API and does not ship a built-in business module catalog.

The Python plugin runtime and management API live in
[`reliaforge-backend`](https://github.com/SajoLuo/reliaforge-backend).

## What the interface shows

- platform status and version;
- discovered plugins and lifecycle state;
- manifest capabilities/dependencies, Python-derived settings schema, and health;
- authorized start, stop, and restart controls;
- project principles and plugin development entry points.

The backend manifest is the source of plugin identity, dependency, capability, and category metadata;
the backend derives settings schema from each plugin's Python Settings class. Adding a backend plugin
does not require adding a frontend route: detail URLs are always `/plugins/{plugin_id}`.

## Requirements

- Node.js 20 or newer;
- npm 10 or newer;
- a running ReliaForge backend for live data.

## Local development

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://127.0.0.1:5530`. The example configuration connects to the backend at `http://127.0.0.1:8000`.

The browser stores no API secret and does not send cross-origin credentials. A production reverse
proxy injects identity only on the server side; the backend verifies both its direct-peer network
and shared secret and fails management requests closed when that trust boundary is incomplete.
When `VITE_RELIAFORGE_API_URL` is unset, the client uses the same-origin `/api/v1` path so a
deployment does not inherit a development-only localhost endpoint.
The v0.1 web shell assumes it is served from the origin root. Subpath hosting is not part of the
current deployment contract.

## Verification

```bash
npm ci
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run check:hygiene
npm audit --audit-level=high
```

The optional browser smoke requires a locally installed Playwright browser:

```bash
npx playwright install chromium
npm run test:e2e
```

For a cross-repository smoke, start the backend with the frontend origin in its CORS list, then run:

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

## API contract

The UI consumes these versioned endpoints:

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

Each plugin response includes `available_actions`; the UI renders only those backend-authorized
controls and never infers a lifecycle transition from state alone. Restart stops, reinitializes,
and starts the already loaded plugin. It does not imply that the backend reloads Python source or
a manifest from disk.

GitHub Actions repeats the quality gate on Node.js 20 and 24, then runs the Chromium desktop and
mobile browser contracts. Coverage is enforced globally at 80% statements/functions/lines and 75%
branches; current coverage can exceed the gate without weakening it on later changes.

See [Development](docs/development.md) for the frontend structure and [Plugin contract](docs/plugin-contract.md) for the fields rendered by the UI.

## Security and community

Please read the [Changelog](CHANGELOG.md), [Security](SECURITY.md), [Contributing](CONTRIBUTING.md), and the [Code of Conduct](CODE_OF_CONDUCT.md) before reporting issues or proposing changes.

## License

MIT © 2026 Sajo Luo. See [LICENSE](LICENSE).
