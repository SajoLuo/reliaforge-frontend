# ReliaForge 前端

[English](README.md)

ReliaForge 是一个面向具备生命周期管理能力的运维插件的轻量工作台。本仓库包含中立的 React 管理界面。它通过后端 API 发现插件，不附带内置业务模块目录。

Python 插件运行时和管理 API 位于
[`reliaforge-backend`](https://github.com/SajoLuo/reliaforge-backend)。

- [项目站点与中文文档](https://sajoluo.github.io/reliaforge/zh/)
- [只读在线演示](https://sajoluo.github.io/reliaforge-frontend/#/zh/)

## 界面展示内容

- 平台状态和版本；
- 已发现插件及其生命周期状态；
- 清单中的能力与依赖、由 Python 派生的 Settings Schema，以及健康状态；
- 后端授权的启动、停止和重启操作；
- 项目原则和插件开发入口。

后端清单是插件身份、依赖、能力和分类元数据的事实来源；后端根据各插件的 Python Settings 类生成 Settings Schema。新增后端插件不需要新增前端路由：详情 URL 始终为 `/plugins/{plugin_id}`。

## 环境要求

- Node.js 20 或更高版本；
- npm 10 或更高版本；
- 如需实时数据，需要运行中的 ReliaForge 后端。

## 本地开发

```bash
cp .env.example .env
npm ci
npm run dev
```

打开 `http://127.0.0.1:5530`。示例配置连接到 `http://127.0.0.1:8000` 的后端。

浏览器不保存 API 密钥，也不发送跨域凭据。生产反向代理只在服务端注入身份；后端同时验证直接对端网络与共享密钥，在信任边界不完整时默认拒绝管理请求。未设置 `VITE_RELIAFORGE_API_URL` 时，客户端使用同源 `/api/v1`，因此部署不会继承仅用于开发的 localhost 端点。普通部署假定 Web 外壳位于站点根路径；独立静态演示构建显式使用 GitHub Pages 的 `/reliaforge-frontend/` 路径，不改变生产部署契约。

## 在线演示

公开演示使用生产页面、Hooks、类型和响应解析器，并在 API 边界选择静态数据适配器。它展示中立的 `demo` 和 `runbook` 插件，但两者的 `available_actions` 都为空。演示不会发送管理 API 请求，也不会模拟启动、停止、重启、持久化或托管后端。

英文使用无前缀路由，简体中文使用 `#/zh/`。可见的语言切换器只改变 URL 的语言前缀，并保留当前页面和查询字符串。URL 是唯一持久化的语言状态，因此浏览器语言不会重定向共享的英文 URL。

在本地构建并预览 Pages 产物：

```bash
npm run build:demo
npm run preview:demo
```

完整生命周期体验请参阅[本地快速开始](https://sajoluo.github.io/reliaforge/zh/guide/getting-started.html)。

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

可选浏览器冒烟测试需要安装本地 Playwright 浏览器：

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:demo
```

跨仓库冒烟测试需要先启动后端，并将前端源站加入 CORS 列表，然后运行：

```bash
RELIAFORGE_OPENAPI_URL=http://127.0.0.1:8000/api/v1/openapi.json npm run check:contract
RELIAFORGE_E2E_LIVE=1 RELIAFORGE_E2E_API_URL=http://127.0.0.1:8000 npm run test:e2e
```

## API 契约

界面使用以下版本化端点：

- `GET /api/v1/status`
- `GET /api/v1/plugins`
- `GET /api/v1/plugins/{plugin_id}`
- `POST /api/v1/plugins/{plugin_id}/{start|stop|restart}`

每个插件响应都包含 `available_actions`；界面只渲染后端授权的控制项，绝不根据状态自行推断生命周期转换。重启操作会停止、重新初始化并启动已经加载的插件，并不表示后端会从磁盘重新加载 Python 源码或清单。

GitHub Actions 在 Node.js 20 和 24 上重复执行质量门禁，然后运行普通界面和只读演示的 Chromium 浏览器测试。只有 `main` 构建通过所有任务后才部署到 GitHub Pages。全局覆盖率门槛为语句、函数和行 80%，分支 75%；当前覆盖率可以高于门槛，但后续变更不得降低门槛。

参阅[前端开发](docs/zh/development.md)了解前端结构，参阅[插件契约](docs/zh/plugin-contract.md)了解界面渲染的字段。

## 安全与社区

提交问题或变更前，请阅读 [Changelog](CHANGELOG.md)、[Security](SECURITY.md)、[Contributing](CONTRIBUTING.md) 和 [Code of Conduct](CODE_OF_CONDUCT.md)。这些规范性文件保持英文单一事实来源。

## 许可证

MIT © 2026 Sajo Luo。参阅 [LICENSE](LICENSE)。
