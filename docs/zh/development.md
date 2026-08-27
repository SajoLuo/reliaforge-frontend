# 前端开发

[English](../development.md)

## 分层

```text
页面 → 功能 Hook → 类型化 API 函数 → 共享 HTTP 客户端 → 后端
```

页面不会创建 HTTP 客户端或复制请求状态。`useAsyncResource` 统一管理加载、数据、错误、重试和卸载取消。API 函数返回响应数据，而不是传输层对象。

面向 Hook 的 `src/api/plugins.ts` 函数委托给一个类型化的 `ReliaForgeApi` 适配器。普通构建选择 Axios 适配器；公开演示选择经过验证的静态适配器。页面和 Hooks 不会根据该选择分支。

## 路由

应用有四类平台路由：

- `/`：平台摘要；
- `/plugins`：由清单驱动的插件目录；
- `/plugins/{plugin_id}`：动态插件详情；
- `/about`：项目说明。

英文拥有这些无前缀路由。简体中文在 `/zh` 下镜像，例如 `/zh/plugins/{plugin_id}`。在 Pages 演示中，对应地址为 `#/plugins/{plugin_id}` 和 `#/zh/plugins/{plugin_id}`。`src/i18n/LocaleProvider.tsx` 仅根据 URL 判断语言；`src/i18n/` 下的仓库自有类型化词典只本地化展示文案，不改变 API 数据。语言切换器只改变 URL 的语言前缀，并保留语义路由和查询字符串。URL 是唯一持久化的语言状态；浏览器语言不会自动重定向共享的英文链接。

插件标识符动态生成详情链接。首个版本有意不包含插件专属 React 包。

普通构建使用 `BrowserRouter` 和 `/` Vite base。显式演示构建使用 `HashRouter` 和 `/reliaforge-frontend/`，因此 GitHub Pages 详情链接无需重定向垫片即可直接打开和刷新。构建模式只由 `src/config/buildMode.ts` 解释。

## 配置

仅支持 `VITE_RELIAFORGE_API_URL`。跨域本地开发使用 `.env.example`，真实环境文件必须保持未跟踪。未设置该变量时，客户端使用生产反向代理后的同源 `/api/v1`。构建变量属于公开浏览器数据，绝不能包含密钥。

## 静态演示

```bash
npm run build:demo
npm run preview:demo
npm run test:e2e:demo
```

[在线演示](https://sajoluo.github.io/reliaforge-frontend/#/zh/)使用与普通构建相同的响应解析器和界面。其 fixture 只包含公开的 `demo` 和 `runbook` 示例，返回相互独立的值，不暴露生命周期操作，也不发出 API 请求。要在本地运行完整的后端托管生命周期，请参阅[项目快速开始](https://sajoluo.github.io/reliaforge/zh/guide/getting-started.html)。

## 添加界面行为

1. 在 `src/types` 中新增或更新接口。
2. 在 `src/api` 中增加类型化函数。
3. 通过功能 Hook 暴露该函数。
4. 渲染加载、错误、空和成功状态。
5. 增加单元测试；关键流程还需增加浏览器冒烟测试。

所有新的用户可见字符串都必须同时加入两份类型化语言词典。插件 ID、能力名、Schema 键、版本、API 值和命令保持原样。后端提供的任意插件文案属于数据，不应被改写；只有随项目发布的中立演示 fixture 可以提供本地化展示标签。

生命周期按钮必须来自 `available_actions`；页面和 Hook 都不能根据当前状态猜测操作。异步 Hook 会中止被替代的请求，并忽略过期或卸载后的结果。
