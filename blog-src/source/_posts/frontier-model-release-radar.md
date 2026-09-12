---
title: "2026 前沿大模型发布雷达：官方资讯、API 文档与退役公告入口"
date: 2026-09-04 22:40:00
updated: 2026-09-05 09:00:00
last_verified: 2026-09-05 09:00:00
description: "持续维护的前沿模型发布索引，覆盖 OpenAI、Anthropic、Google、DeepSeek、Qwen、xAI、Mistral、Kimi、MiniMax 与 GLM 的官方发布、模型目录、API 文档和退役公告。"
cover: "/img/default.png"
tags:
  - 大模型
  - 模型发布
  - Agent
  - Harness
categories:
  - AI 后端学习
keywords:
  - 前沿模型
  - 模型发布资讯
  - 大模型 API
  - 模型退役公告
---

> 最后核验：**2026-09-04**。模型名称、价格、上下文长度和可用区域都可能快速变化，本文把“官方入口”放在结论之前；接入生产环境前，请再次查看模型目录、价格页和退役公告。

## 先看结论：不要只收藏发布新闻

追踪模型至少需要四类入口：

1. **发布/变更日志**：知道新模型何时出现、能力发生了什么变化。
2. **模型目录**：确认真实可调用的模型 ID、模态与限制。
3. **API 文档与价格**：判断能否接入以及成本结构。
4. **退役公告**：提前处理别名漂移、强制迁移和行为变化。

生产配置建议固定到明确版本，并把 `latest` 一类动态别名只用于实验环境。每次升级都应重新跑一遍自己的回归集，而不是只看厂商榜单。

## 2026 年 9 月模型速览

| 厂商/系列 | 本次核验时值得关注的模型 | 适合先验证的方向 | 官方入口 |
|---|---|---|---|
| OpenAI | GPT-6 Astra、GPT-5.6 Sol / Terra / Luna | 端到端任务、编码、通用 Agent | [模型目录](https://developers.openai.com/api/docs/models) · [模型选型指南](https://developers.openai.com/api/docs/guides/latest-model) |
| Anthropic Claude | Opus / Sonnet / Fable 当前代模型 | 长任务、编码、工具使用 | [模型生命周期](https://docs.anthropic.com/en/docs/about-claude/model-deprecations) · [Claude Code 文档](https://code.claude.com/docs/en/overview) |
| Google Gemini | Gemini 3.8 Flash、Gemini 3.7 Flash | 长上下文、低延迟、多模态与 Agent | [Gemini API Changelog](https://ai.google.dev/gemini-api/docs/changelog) · [退役公告](https://ai.google.dev/gemini-api/docs/deprecations) |
| DeepSeek | `deepseek-v4-flash`、`deepseek-v4-pro`、实验视觉模型 | 中文、推理、代码、兼容接口 | [API 文档](https://api-docs.deepseek.com/) · [更新日志](https://api-docs.deepseek.com/updates) |
| Qwen | Qwen3.6、Qwen3-Coder、Qwen3-VL、Qwen3-Omni | 开源权重、代码、多模态、本地部署 | [Qwen 官方 GitHub](https://github.com/QwenLM) · [Qwen 官方博客](https://qwenlm.github.io/blog/) |
| xAI Grok | Grok 4.6、Grok Build | 编码、Agent、实时信息工具 | [发布日志](https://docs.x.ai/developers/release-notes) · [模型目录](https://docs.x.ai/developers/models) |
| Mistral | Mistral 模型族与 OCR / Vibe 能力 | 欧洲部署、轻量模型、文档处理 | [Release Notes](https://docs.mistral.ai/resources/release-notes) · [Changelog](https://docs.mistral.ai/resources/changelogs) |
| Kimi | Kimi K2.5 及平台当前模型 | 中文长上下文、工具调用、多模态 | [Kimi API 文档](https://platform.moonshot.ai/docs/) |
| MiniMax | MiniMax M2.7 / M2.7-highspeed | 编码、Agent、语音视频多模态 | [接口能力总览](https://platform.minimaxi.com/docs/api-reference/api-overview) · [模型列表 API](https://platform.minimaxi.com/docs/api-reference/models/openai/list-models) |
| 智谱 GLM | GLM-5.2 及平台当前模型 | 中文、代码、Agent 与国产化接入 | [新品发布](https://docs.bigmodel.cn/cn/update/new-releases) |

这张表是“入口地图”，不是绝对排名。对工程团队更有意义的指标通常是：任务成功率、工具调用正确率、单位成功任务成本、P95 延迟、长任务恢复能力和权限边界。

## 每周 20 分钟更新法

### 第一步：只扫官方变更页

按“变更日志 → 模型目录 → 退役公告”的顺序浏览。营销文章可以帮助理解定位，但不能替代 API 文档。

### 第二步：记录五个字段

```yaml
verified_at: 2026-09-04
provider: example
model_id: exact-model-id
availability: preview | ga | deprecated
important_changes:
  - tool_calling
  - context_window
  - pricing
  - api_shape
```

### 第三步：跑自己的最小回归集

建议至少准备 20～50 个真实任务，覆盖：代码修改、信息抽取、结构化输出、工具调用、长上下文和拒答边界。记录成功与失败原因，不要只记平均分。

### 第四步：把升级当成依赖升级

- 实验环境可跟随动态别名。
- 生产环境固定模型 ID，并提供快速回滚。
- 同时保存 Prompt、工具 schema、Harness 版本和评测集版本。
- 关注“旧 ID 被自动路由到新模型”的公告，它可能让结果和账单一起变化。

## 接下来读什么

模型决定能力上限，Harness 决定它能否稳定完成工作。继续阅读：

- [Harness 系列 01：从模型到可执行系统](/blog/2026/09/04/agent-harness-series-01-overview/)
- [Harness 系列 02：Codex、Claude Code、OpenCode 与自建方案怎么选](/blog/2026/09/04/agent-harness-series-02-selection/)
- [Harness 系列 07：安全、评测与可观测性](/blog/2026/09/04/agent-harness-series-07-security-evaluation/)

> 维护原则：新增厂商时必须至少补齐“模型目录或 API 文档”和“变更/退役入口”中的两项；无法从官方来源验证的信息，不进入主表。
