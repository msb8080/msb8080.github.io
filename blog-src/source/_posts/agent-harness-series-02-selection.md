---
title: "Agent Harness 系列 02：Codex、Claude Code、OpenCode 与自建方案怎么选"
date: 2026-09-04 22:20:00
updated: 2026-09-04 22:20:00
description: "从模型自由度、权限、沙箱、扩展、自动化和团队治理维度，对比 Codex、Claude Code、OpenCode 与自建 Harness。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 2
cover: "/img/default.png"
tags:
  - Harness
  - Codex
  - Claude Code
  - OpenCode
categories:
  - AI 后端学习
---

## 一张表先做初筛

| 方案 | 更适合 | 主要优势 | 需要注意 |
|---|---|---|---|
| Codex | 想要成熟编码工作流、桌面/CLI/云协同的团队 | 开源 CLI、仓库规则、沙箱与审批、SDK/App Server | 深度能力与 OpenAI 生态绑定较强 |
| Claude Code | 重视长任务、终端体验、Hooks/Skills/多 Agent 的团队 | 多种运行表面、项目配置、Agent SDK、MCP | 设置作用域多，团队治理需提前统一 |
| OpenCode | 强调多模型和开放配置的个人或团队 | Provider 选择广、Agent/权限可配置、开源 | 版本演进快，配置语法要以对应版本文档为准 |
| 自建 Harness | 有产品化、合规、私有工具链或业务状态机需求 | 行为、数据、权限、评测完全可控 | 研发和长期维护成本最高 |

官方资料：[Codex CLI](https://developers.openai.com/codex/cli)、[Claude Code](https://code.claude.com/docs/en/overview)、[OpenCode Agents](https://opencode.ai/docs/agents)、[Spring AI](https://docs.spring.io/spring-ai/reference/)。

## 用六个问题做决定

### 1. 是否必须自由切换模型

如果经常在 DeepSeek、OpenAI、Anthropic、本地模型之间比较，OpenCode 或自建层更直接。如果目标是获得某一厂商完整的编码 Agent 能力，官方 Harness 往往集成更深。

### 2. 工作发生在哪里

- 纯本地仓库：三种编码 Harness 都适合。
- 云端长任务、跨设备接力：优先评估厂商提供的云任务能力。
- 嵌入自有产品：优先看 Codex SDK/App Server、Claude Agent SDK，或直接自建。

### 3. 副作用有多大

只读分析和自动发布不是同一风险等级。选择时要验证：文件边界、Shell 白名单、网络出口、密钥注入、外部写入审批、审计日志和中断恢复。

### 4. 团队规则能否版本化

规则应该跟仓库一起评审：构建命令、架构约束、禁止操作、验证标准、提交规范。个人偏好则放在本地配置，不能把密钥或个人授权一起提交。

### 5. 失败后如何恢复

演示通常只展示成功路径，生产要问：进程退出后能否继续？工具超时是否幂等？模型切换后状态是否兼容？未完成的外部写入如何对账？

### 6. 如何衡量收益

不要用“生成了多少代码”衡量。建议用：一次通过率、人工返工时间、回归缺陷数、单位成功任务成本、P95 完成时长、被拒绝的危险操作数。

## 推荐的渐进路线

```text
第 1 周：个人只读分析 + 小改动
    ↓
第 2 周：固定仓库规则 + 测试验证
    ↓
第 3 周：接入一个低风险 MCP/内部工具
    ↓
第 4 周：建立 30 个真实任务评测集
    ↓
之后：再决定是否嵌入 SDK 或自建 Harness
```

我的默认建议是：先用现成 Harness 发现真实工作流，再抽取稳定部分自建。过早自建容易把时间花在终端 UI、流式事件和工具协议上，却还没有找到真正值得自动化的任务。

下一篇从可直接使用的方案开始：[Codex 实战](/blog/2026/09/04/agent-harness-series-03-codex/)。
