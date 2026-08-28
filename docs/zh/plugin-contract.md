# 控制台展示的插件数据

[English](../plugin-contract.md)

插件列表和详情页使用同一种后端响应。

| 字段 | 控制台展示内容 |
| --- | --- |
| `id` | 插件 ID 和详情 URL |
| `name` | 显示名称 |
| `version` | 插件版本 |
| `description` | 插件说明 |
| `api_version` | ReliaForge 插件 API 版本 |
| `state` | 当前运行状态 |
| `available_actions` | 后端当前允许的启动、停止或重启按钮 |
| `dependencies` | 所需插件 ID 和可接受的 SemVer 范围 |
| `capabilities` | 插件提供的命名服务 |
| `settings_schema` | 来自插件 Python 设置类的配置项 |
| `frontend` | 用于插件分组的可选分类 |
| `health` | 当前健康状态和消息 |

插件运行时，健康状态仍可能是降级。摘要会把每个插件归入运行中、降级、已停止或错误中的一类。

控制台不会根据插件状态计算 `available_actions`。插件加载失败、依赖不可用，或有运行中的插件
依赖它时，操作列表都可能为空。只读演示中的所有静态插件都使用空操作列表。

客户端生成的标签和错误会翻译。后端返回的数据保持原样，包括插件 ID、名称、说明、能力、
依赖范围、版本、Schema 键、操作值和后端错误详情。
