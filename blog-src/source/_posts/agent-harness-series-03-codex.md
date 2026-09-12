---
title: "Agent Harness 系列 03：Codex 从仓库规则到可审计自动化"
date: 2026-09-04 22:10:00
updated: 2026-09-04 22:10:00
description: "Codex CLI 与 SDK 使用路线：仓库规则、任务表达、权限审批、验证闭环和非交互自动化。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 3
cover: "/img/default.png"
tags:
  - Harness
  - Codex
  - AGENTS.md
  - AI 编程工具
categories:
  - AI 后端学习
---

Codex 不只是聊天式补全。它的 Harness 把仓库理解、文件编辑、命令执行、审批、沙箱、任务状态和可扩展工具组织成一条执行链。当前能力和命令以 [Codex CLI 文档](https://developers.openai.com/codex/cli) 与 [CLI Reference](https://developers.openai.com/codex/cli/reference) 为准。

## 1. 安装与启动

```bash
npm install -g @openai/codex
cd your-project
codex
```

开工前先让 Codex解释目录、构建入口和测试方式，再给修改任务。对陌生仓库，第一轮只读探索通常比直接写代码可靠。

## 2. 把团队规则写进 AGENTS.md

```markdown
# Project rules

- Java 版本为 21，构建使用 `./mvnw verify`。
- 修改接口必须同步测试和 API 文档。
- 不读取或提交 `.env`、证书和本地凭据。
- 删除数据、发布、推送远端前必须停下并请求确认。
- 完成前报告验证命令、结果和仍存在的风险。
```

规则应该描述稳定事实和边界，不要写某一次任务的临时细节。具体任务仍要包含目标、范围和验收标准。

## 3. 使用“证据—修改—验证”任务模板

```text
目标：修复订单重复提交。
范围：order-api 模块；不要修改支付 SDK。
先做：定位调用链并给出根因证据。
实施：最小改动，保留现有接口兼容性。
验证：运行相关单测和模块构建，补充并发用例。
风险：数据库迁移、远端推送和发布必须先询问。
输出：变更摘要、验证结果、未覆盖风险。
```

这类任务文本本身就是 Harness 的输入协议。越容易验收，Agent 越不容易在“看似完成”处停下。

## 4. 分清沙箱和审批

沙箱限制“技术上能做什么”，审批限制“策略上何时能做”。两者必须同时存在。Codex 的配置项会持续演进，具体字段应查 [Configuration Reference](https://developers.openai.com/codex/config-reference)；不要从博客复制一份旧配置后长期不更新。

推荐分级：

- 仓库内读取、搜索、测试：通常允许。
- 仓库内编辑：显示 diff，允许回滚。
- 仓库外读取、联网、安装依赖：按需询问。
- 删除、提交、推送、发布、外部系统写入：明确审批。

## 5. 从交互式任务走向自动化

当同一工作流已经稳定重复，再使用非交互模式或 [Codex SDK](https://developers.openai.com/codex/sdk) 嵌入脚本/产品。自动化前要补齐：结构化输出、超时、幂等键、失败重试、事件日志、成本上限和人工接管点。

一个合格的自动化结果至少包含：

```json
{
  "status": "passed",
  "changed_files": ["src/..."],
  "checks": [{"name": "unit-test", "passed": true}],
  "risks": [],
  "approval_required": false
}
```

## 6. 常见误区

- 把“全自动”理解成“全权限”。
- 只要求写代码，不要求运行验证。
- 在仓库规则里放密钥或个人机器路径。
- 让 Agent 自动 push/发布，却没有最终 diff 和审批门。
- 模型升级后不跑回归任务。

下一篇：[Claude Code 的 CLAUDE.md、权限、Hooks 与 Agent SDK](/blog/2026/09/04/agent-harness-series-04-claude-code/)。
