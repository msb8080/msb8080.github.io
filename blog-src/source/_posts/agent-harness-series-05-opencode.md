---
title: "Agent Harness 系列 05：OpenCode 多模型配置与权限实战"
date: 2026-09-04 21:50:00
updated: 2026-09-04 21:50:00
description: "使用 OpenCode 组织多模型 Provider、主 Agent、子 Agent、项目规则与细粒度权限，并规避版本配置差异。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 5
cover: "/img/default.png"
tags:
  - Harness
  - OpenCode
  - DeepSeek
  - 多模型
categories:
  - AI 后端学习
---

OpenCode 的核心吸引力是开放和多模型：可以按任务在不同 Provider/模型间选择，并用 Agent 配置约束提示词、步数和工具权限。入口见 [OpenCode Providers](https://opencode.ai/docs/providers) 与 [Agents](https://opencode.ai/docs/agents)。

## 1. 先建立两个角色

- **Plan/Review Agent**：只读，负责理解仓库、方案和审查。
- **Build Agent**：允许在仓库内编辑和运行验证，但拒绝推送与发布。

这种职责分离比“一个全能 Agent 永久全权限”更容易审计。

项目级 Agent 可以写成 Markdown，例如：

```markdown
---
description: 只读审查当前变更
mode: subagent
---

检查正确性、安全性、兼容性和遗漏测试。
按严重程度列出问题，并给出文件与行号证据；不要修改文件。
```

具体目录和字段请以当前 [Agents 文档](https://opencode.ai/docs/agents) 为准。

## 2. Provider 配置原则

OpenCode 支持内置 Provider，也支持 OpenAI-compatible 接口。连接自定义服务时至少核对：

- `baseURL` 是否包含正确版本路径。
- 使用 Chat Completions 还是 Responses 协议。
- model ID 是否真实存在。
- 上下文和最大输出配置是否与服务端一致。
- API Key 只通过凭据存储或环境变量引用，不写进仓库。

对于 DeepSeek 这类兼容接口，先用官方最小请求验证服务，再接 Harness。DeepSeek 当前接口和模型以[官方快速开始](https://api-docs.deepseek.com/)为准。

## 3. 权限要从默认拒绝开始

OpenCode 的配置格式正处在演进期：V1 文档使用 `permission`/`bash`，V2 文档使用 `permissions`/`shell`。复制示例前先确认正在运行的版本，并对照对应的[权限文档](https://opencode.ai/docs/permissions)。

不管语法是哪一版，策略应保持一致：

```text
默认：ask
读取仓库、搜索、git diff/status：allow
读取 .env、SSH、云凭据：deny
仓库内编辑：allow 或 ask
git commit：ask
git push、发布、删除远端资源：deny/最终人工审批
```

## 4. 多模型不是每一步都切模型

更稳定的做法是按任务类型路由：

| 任务 | 模型侧重点 |
|---|---|
| 快速搜索/分类 | 低延迟、低成本 |
| 跨文件设计与实现 | 代码能力、长上下文、工具调用 |
| 最终审查 | 使用不同模型或不同提示词交叉验证 |
| 中文文档 | 中文表达、结构化输出 |

同一个长任务中频繁换模型会造成风格、工具调用和隐含假设漂移。若必须切换，应在检查点保存结构化状态，而不是只传一段聊天摘要。

## 5. 最小验收

- `opencode` 能正确发现目标模型。
- Review Agent 无法编辑或执行危险命令。
- Build Agent 只能写当前仓库。
- 故意请求读取 `.env` 时会被拒绝。
- 测试失败时不会自动删测试或扩大权限。
- 模型不可用时能明确失败，而不是静默换到未知模型。

下一篇：[用 Java / Spring AI 自建业务 Harness](/blog/2026/09/04/agent-harness-series-06-java-spring-ai/)。
