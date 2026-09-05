# ReliaForge frontend

[简体中文](README_CN.md)

ReliaForge is a plugin-based operations platform for hosting Python services. This React console
connects to the [ReliaForge backend](https://github.com/SajoLuo/reliaforge-backend) to show plugin
status, health details, dependencies, configuration fields, and available start, stop, and restart
controls. Users access each plugin's service through its own API or author-provided interface.

- [Project documentation](https://reliaforge.dev/)
- [Read-only online demo](https://demo.reliaforge.dev/)

## Run locally

You need Node.js 20 or newer, npm 10 or newer, and a running ReliaForge backend for live data.

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://127.0.0.1:5530`. The example connects to the backend at
`http://127.0.0.1:8000`.

On the backend, use its `.env.example` or set `RELIAFORGE_CORS_ORIGINS` to
`["http://127.0.0.1:5530"]` before starting it so the browser can connect from this origin.

`VITE_RELIAFORGE_API_URL` sets the backend origin. If it is absent, the console uses same-origin
`/api/v1`. Never put an API key or shared secret in a `VITE_*` variable because browser build files
are public.

## Online demo

The [online demo](https://demo.reliaforge.dev/) uses the same pages and response validation as a
normal build, but reads saved data for the `demo` and `runbook` plugins. It has no backend, sends no
management requests, and shows no start, stop, or restart buttons.

Build and preview the demo locally:

```bash
npm run build:demo
npm run preview:demo
```

English routes have no language prefix. Simplified Chinese routes use `#/zh/` in the demo. The
language switch keeps the current page and query string.

## API endpoints

The console uses:

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

Each plugin response includes `available_actions`. The console displays only those actions, and the
backend authenticates and validates every request.

## Verification

```bash
npm ci
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run build:demo
npm run check:hygiene
npm audit --audit-level=high
```

Browser tests require Playwright Chromium:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:demo
```

To check a running backend against the frontend contract:

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

See [Development](docs/development.md) for the source layout and
[Plugin data](docs/plugin-contract.md) for fields shown by the console.

## License

MIT © 2026 Sajo Luo. See [LICENSE](LICENSE).
