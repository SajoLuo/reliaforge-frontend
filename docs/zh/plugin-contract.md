# 界面渲染的插件契约

[English](../plugin-contract.md)

目录页和详情页使用同一种插件表示。

| 字段 | 用途 |
| --- | --- |
| `id` | 稳定且可用于 URL 的插件标识符 |
| `name` | 易读名称 |
| `version` | 插件版本 |
| `description` | 简短公开描述 |
| `api_version` | 框架契约版本 |
| `state` | 当前生命周期状态；`degraded` 不是生命周期值 |
| `available_actions` | 后端当前授权的有序生命周期操作 |
| `dependencies` | 含 `id` 和 SemVer `version` 范围的必需插件对象 |
| `capabilities` | 公开能力标识符 |
| `settings_schema` | 从插件 Python Settings 类派生的公开 JSON Schema |
| `frontend` | 含可选、可空分类提示的元数据对象，供通用目录使用 |
| `health` | 无副作用健康快照 |

界面把未知设置字段当作可检查的数据，不编辑密钥，也不执行任意插件代码。详情链接始终由插件 ID 生成。生命周期为 `running` 时，健康状态仍可能为 `degraded`。平台计数互斥：`running`、`degraded`、`stopped` 和 `error`。

界面绝不根据生命周期状态推导启动、停止或重启权限。失败记录、未解析依赖或活跃依赖方都可能使操作列表为空。公开只读演示有意为每个演示 fixture 提供空操作列表，并拒绝任何直接操作适配器调用；它不会分叉或削弱生产规则。

本地化只属于展示层。生命周期和健康值的人类可读标签可以翻译，但解析后的响应、插件 ID、能力标识符、依赖范围、版本、Schema 键和操作值始终保持不变。
