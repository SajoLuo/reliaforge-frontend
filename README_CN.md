# ReliaForge 前端

[English](README.md)

ReliaForge 前端是 [ReliaForge 后端](https://github.com/SajoLuo/reliaforge-backend)的 React
控制台。它显示后端状态、插件健康情况、依赖和配置项，以及后端当前允许执行的启动、停止或
重启操作。

- [项目文档](https://reliaforge.dev/zh/)
- [只读在线演示](https://demo.reliaforge.dev/#/zh/)

## 本地运行

需要 Node.js 20 或更高版本、npm 10 或更高版本。如需实时数据，还要先运行 ReliaForge 后端。

```bash
cp .env.example .env
npm ci
npm run dev
```

打开 `http://127.0.0.1:5530`。示例会连接到 `http://127.0.0.1:8000` 的后端。

`VITE_RELIAFORGE_API_URL` 用于设置后端来源。没有设置时，控制台使用同源 `/api/v1`。
不要把 API 密钥或共享密钥放入 `VITE_*` 变量，因为浏览器构建文件都是公开的。

## 在线演示

[在线演示](https://demo.reliaforge.dev/#/zh/)使用与正常构建相同的页面和响应校验，但读取
`demo` 和 `runbook` 插件的静态数据。它没有后端，不发送管理请求，也不显示启动、停止或
重启按钮。

在本地构建和预览演示：

```bash
npm run build:demo
npm run preview:demo
```

英文路由没有语言前缀，演示中的简体中文路由使用 `#/zh/`。切换语言时会保留当前页面和
查询参数。

## API 接口

控制台使用：

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

每个插件响应都包含 `available_actions`。控制台只展示这些操作，后端会认证并校验每次请求。

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
```

浏览器测试需要 Playwright Chromium：

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:demo
```

检查运行中的后端是否符合前端契约：

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

源码结构见[前端开发](docs/zh/development.md)，控制台展示的字段见
[插件数据](docs/zh/plugin-contract.md)。

## 许可证

MIT © 2026 Sajo Luo。参阅 [LICENSE](LICENSE)。
