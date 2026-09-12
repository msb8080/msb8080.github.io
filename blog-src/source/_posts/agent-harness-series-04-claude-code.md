---
title: "Agent Harness 系列 04：Claude Code 的规则、权限、Hooks 与 Agent SDK"
date: 2026-09-04 22:00:00
updated: 2026-09-04 22:00:00
description: "Claude Code 实战指南，覆盖安装、CLAUDE.md、设置作用域、权限、Hooks、MCP、Skills 和 Agent SDK。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 4
cover: "/img/default.png"
tags:
  - Harness
  - Claude Code
  - MCP
  - Skills
categories:
  - AI 后端学习
---

[Claude Code](https://code.claude.com/docs/en/overview) 把同一套 Agent 引擎带到终端、IDE、桌面和 Web。它适合把一次对话逐步沉淀为仓库规则、可复用 Skill、Hook 和自动化任务。

## 1. 安装

macOS/Linux/WSL 可按官方方式安装：

```bash
curl -fsSL https://claude.ai/install.sh | bash
cd your-project
claude
```

macOS 也可使用稳定通道：

```bash
brew install --cask claude-code
```

安装方式和更新策略会变化，执行前以[官方安装说明](https://code.claude.com/docs/en/overview)为准。

## 2. 用 CLAUDE.md 保存项目知识

```markdown
# Repository guide

## Architecture
- `api/` 只负责协议适配，业务规则在 `domain/`。
- 数据访问必须经过 repository 接口。

## Verification
- 先运行目标模块测试，再运行完整 lint。
- 不得通过删除失败测试来“修复”构建。

## Safety
- 仅允许修改当前仓库。
- Git push、发布和外部写入必须人工确认。
```

把规则保持短小、可验证。长背景材料放到独立文档，只在任务需要时引用。

## 3. 正确区分设置作用域

根据 [Claude Code settings](https://code.claude.com/docs/en/settings)：

| 文件 | 用途 |
|---|---|
| `~/.claude/settings.json` | 个人跨项目偏好 |
| `.claude/settings.json` | 可提交、团队共享的项目设置 |
| `.claude/settings.local.json` | 当前项目的个人覆盖，不应提交 |
| Managed settings | 组织强制策略 |

密钥、个人允许规则和机器路径不能进入团队共享文件。团队文件适合存权限基线、Hooks、插件和必要环境变量名，而不是环境变量值。

## 4. 权限、Hooks、Skills、MCP 怎么分工

- **权限**：决定某类读写或命令是允许、询问还是拒绝。
- **Hooks**：在事件前后执行确定性脚本，例如编辑后格式化、提交前 lint。
- **Skills**：封装可复用的工作方法和配套资源。
- **MCP**：把外部系统作为工具/资源接入。

确定性动作优先用 Hook 或脚本；需要判断和适应的流程用 Skill；需要访问外部系统时再接 MCP。不要把所有事情都塞进一段超长 Prompt。

## 5. 一个可靠的日常工作流

```text
先分析根因，不修改文件
→ 确认最小变更范围
→ 实施并展示 diff
→ 执行测试/静态检查
→ 失败则回到根因，不降低断言
→ 汇总结果
→ 提交、推送或发布前请求确认
```

当这个流程已稳定，可以用 CLI 的非交互能力接入 CI；若要嵌入自己的产品或编排多个 Agent，再评估官方 [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)。

## 6. 上线前检查

- 团队是否理解设置优先级。
- `CLAUDE.md` 是否包含可执行的验证命令。
- 外部 MCP 是否最小授权并可审计。
- Hook 失败是否阻断高风险流程。
- 自动化是否有超时、成本限制和人工接管。

下一篇：[OpenCode 多模型 Harness 实战](/blog/2026/09/04/agent-harness-series-05-opencode/)。
