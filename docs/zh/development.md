# 前端开发

[English](../development.md)

控制台管理已接入 ReliaForge 后端的插件。插件的业务界面由作者提供，Runbook 是插件可以
提供的一种服务。

## 请求流程

```text
Page -> hook -> API function -> HTTP client -> backend
```

页面负责展示数据和用户操作。Hook 管理加载、错误、重试、取消和本地操作状态。API 函数校验
响应，并返回数据而不是 Axios 对象。

正常构建使用 HTTP 适配器，在线演示使用保存数据的静态适配器。两种构建中的页面和 Hook 使用
相同接口。

## 路由与语言

控制台有四个路由：

- `/` — 后端摘要；
- `/plugins` — 插件列表；
- `/plugins/{plugin_id}` — 插件详情；
- `/about` — 项目和安装链接。

英文直接使用这些路由，简体中文增加 `/zh`，例如 `/zh/plugins/{plugin_id}`。正常构建使用
`BrowserRouter`，演示构建使用 `HashRouter`。

`LocaleProvider` 从 URL 读取语言。切换语言时会保留当前页面和查询参数。客户端生成的每条用户
消息都要加入两份语言词典。插件 ID、能力名称、Schema 键、API 值和后端返回的文本保持原样。

## 配置

`VITE_RELIAFORGE_API_URL` 是唯一支持的浏览器构建变量。跨域本地开发使用 `.env.example`。
没有设置该变量时，客户端调用同源 `/api/v1`。浏览器构建变量都是公开信息，不能包含密钥。

## 演示构建

```bash
npm run build:demo
npm run preview:demo
npm run test:e2e:demo
```

[在线演示](https://demo.reliaforge.dev/#/zh/)校验与正常构建相同的响应结构。它读取相互独立的
`demo` 和 `runbook` 静态数据，不提供启停操作，也不发送 API 请求。按照
[项目快速开始](https://reliaforge.dev/zh/guide/getting-started.html)可以在本地运行后端。

## 添加界面功能

1. 在 `src/types` 中新增或更新类型。
2. 在 `src/api` 中增加响应校验和 API 函数。
3. 在 Hook 中调用该函数。
4. 展示加载、错误、空和成功状态。
5. 添加单元测试；重要的值班流程还要添加浏览器测试。

启停按钮必须来自 `available_actions`，页面和 Hook 不能根据插件状态自行推导。异步 Hook 会取消
已经被替代的请求，并忽略组件卸载后的结果。读取或操作成功后，会记录当前数据的获取时间。

启停请求没有收到响应，或返回服务端、网关错误时，控制台会提示结果尚未确认，并读取一次
插件状态，不会自动重试写操作。手动刷新也会保留这条提示，因为一次状态读取无法确认之前那次
请求的具体结果。启停请求的超时仍为 310 秒，普通读取请求为 10 秒。
