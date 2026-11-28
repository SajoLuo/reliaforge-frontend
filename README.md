# ReliaForge frontend

[简体中文](README_CN.md)

React web console and `@reliaforge/plugin-sdk` for [`reliaforge-backend`](https://github.com/ReliaForge/reliaforge-backend). It renders the shared navigation shell, loads runtime ESM plugin bundles, and manages plugin start/stop/restart actions.

- [Documentation](https://docs.reliaforge.dev/)
- [Interactive online demo](https://demo.reliaforge.dev/)

## Run locally

Requires Node.js 20+, npm 10+, and a running `reliaforge-backend` instance on `127.0.0.1:8000`.

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://127.0.0.1:5530`. Make sure `RELIAFORGE_CORS_ORIGINS` on the backend includes `http://127.0.0.1:5530` (already set in the backend `.env.example`).

`VITE_RELIAFORGE_API_URL` overrides the backend origin; when unset, the console calls same-origin `/api/v1`. Do not place secrets in `VITE_*` variables.

## Online demo build

[demo.reliaforge.dev](https://demo.reliaforge.dev/) runs in the browser with static plugin metadata and built-in mock views for `infra_overview`, `proxmox`, `kubernetes`, `gitops_argocd`, `observability`, and `ops_audit`, without calling `/api/v1`.

```bash
npm run build:demo
npm run preview:demo
```

UI language follows the browser locale automatically (`?lang=zh` or `?lang=en` overrides it).

## Management endpoints used by the shell

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

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
npx playwright install chromium
npm run test:e2e
npm run test:e2e:demo
```

Contract check against a live backend:

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

See [Development](docs/development.md) and [Plugin contract](docs/plugin-contract.md) for internal details.

## License

MIT © 2026 Sajo Luo. See [LICENSE](LICENSE).
