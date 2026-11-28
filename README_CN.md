# ReliaForge 前端

[English](README.md)

配合 [`reliaforge-backend`](https://github.com/ReliaForge/reliaforge-backend) 使用的 React 控制台与 `@reliaforge/plugin-sdk`，负责主导航壳层、动态加载插件 ESM 前端包以及插件启停控制。

- [在线文档](https://docs.reliaforge.dev/zh/)
- [在线交互演示](https://demo.reliaforge.dev/?lang=zh)

## 本地运行

需要 Node.js 20+、npm 10+，并先在 `127.0.0.1:8000` 启动 `reliaforge-backend`。

```bash
cp .env.example .env
npm ci
npm run dev
```

打开 `http://127.0.0.1:5530`。后端 `.env.example` 默认已把 `http://127.0.0.1:5530` 加入 `RELIAFORGE_CORS_ORIGINS`。

`VITE_RELIAFORGE_API_URL` 可指定后端地址；未设置时默认请求同源 `/api/v1`。切勿在 `VITE_*` 变量中写入任何密钥。

## 在线演示构建

[demo.reliaforge.dev](https://demo.reliaforge.dev/?lang=zh) 纯浏览器运行，内置六个官方插件的模拟数据与交互视图（含模拟 LXC 终端与滚动日志），不发起任何 `/api/v1` 请求。

```bash
npm run build:demo
npm run preview:demo
```

界面语言默认跟随浏览器设置，也可通过 `?lang=zh` / `?lang=en` 覆盖。

## 壳层调用的管理接口

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

## 验证

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

对接本地运行中的后端做契约校验：

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

内部目录说明见[前端开发](docs/zh/development.md)与[插件契约](docs/zh/plugin-contract.md)。

## 许可证

MIT © 2026 Sajo Luo。详见 [LICENSE](LICENSE)。
