---
title: "Agent Harness 系列 01：从大模型到可执行系统"
date: 2026-09-04 22:30:00
updated: 2026-09-04 22:30:00
description: "解释 Agent Harness 的核心组成、运行循环、上下文工程、工具协议、权限、沙箱和评测，并给出最小可用架构。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 1
cover: "/img/default.png"
tags:
  - Harness
  - Agent
  - MCP
  - AI 工程
categories:
  - AI 后端学习
---

## Harness 到底是什么

模型只负责“根据上下文预测下一步输出”。要让它读取仓库、修改文件、执行测试、请求审批并在失败后恢复，还需要一层运行系统，这就是 **Agent Harness（智能体执行框架/运行外壳）**。

```text
用户目标
   ↓
任务状态机 ──→ 上下文装配 ──→ 模型推理
   ↑                              ↓
结果校验 ←── 工具执行/沙箱 ←── 工具选择
   │
审批、日志、成本、回滚
```

一个可用 Harness 至少包含八部分：

| 组件 | 作用 | 常见失败 |
|---|---|---|
| Agent loop | 驱动“思考—行动—观察—继续” | 无限循环、过早结束 |
| Context builder | 装配指令、代码、历史与工具结果 | 上下文污染、遗漏关键约束 |
| Tool registry | 描述并调用文件、Shell、浏览器、API | 参数错误、工具选择漂移 |
| State & memory | 保存任务、检查点和压缩摘要 | 恢复后丢失目标 |
| Sandbox | 限制文件、网络和进程边界 | 权限过大、逃逸 |
| Approval policy | 在副作用前询问或阻止 | 静默发布、误删数据 |
| Evaluator | 判断是否真正完成 | “代码写完”等同于“任务完成” |
| Observability | 记录事件、耗时、token、错误 | 无法复盘和优化 |

## 一个最小 Agent 循环

下面是概念代码，重点不是 SDK，而是状态边界：

```python
state = load_task()

for step in range(state.max_steps):
    context = build_context(state)
    decision = model.respond(context, tools=allowed_tools(state))

    if decision.is_final:
        result = verify(decision.output, state.acceptance_criteria)
        if result.passed:
            return complete(result)
        state.add_feedback(result.failures)
        continue

    check_policy(decision.tool_call)
    observation = run_in_sandbox(decision.tool_call)
    state.append(observation)
    checkpoint(state)

raise StepLimitExceeded(state.summary())
```

这里最重要的三个设计点是：

1. **完成条件来自验收标准**，不是来自模型一句“已完成”。
2. **工具执行前过权限策略**，副作用越大，门槛越高。
3. **每一步可恢复**，长任务不能只存在于一段聊天记录里。

## MCP、Skills 和 Harness 的关系

- [MCP](https://modelcontextprotocol.io/specification/2025-06-18) 解决客户端如何发现并调用外部工具与资源。
- [Agent Skills](https://agentskills.io/) 用可复用指令和资源描述“某类任务应该怎么做”。
- Harness 负责何时加载 Skill、允许调用哪些工具、如何继续循环、如何审计和恢复。

它们不是互相替代的框架。可以把 MCP 看作“接口插座”，Skill 看作“作业指导书”，Harness 看作“带安全制度的执行车间”。

## 上下文工程比 Prompt 更大

一个稳定的上下文通常按优先级分层：

1. 平台安全与组织策略。
2. 仓库级规则，例如 `AGENTS.md` 或 `CLAUDE.md`。
3. 当前任务目标、范围与验收标准。
4. 相关源码、文档和运行结果。
5. 压缩后的历史，而非原样塞入所有聊天。

常见反模式是“把整个仓库扔进上下文”。更好的做法是先建立目录地图，再按调用链检索小范围证据；每轮保留决策理由、失败结果和下一步，而不是保留所有冗余文本。

## 最小落地清单

- 定义结构化任务：目标、范围、约束、验收、风险。
- 工具默认最小权限，读、写、执行、联网分别控制。
- 写操作输出 diff，外部写入在最后一步请求审批。
- 设置最大步数、单工具超时、总成本和重试上限。
- 每一步写事件日志，敏感字段先脱敏。
- 建立真实任务回归集，模型或 Harness 升级前后对比。

下一篇进入实际选型：[Codex、Claude Code、OpenCode 与自建 Harness 怎么选](/blog/2026/09/04/agent-harness-series-02-selection/)。
