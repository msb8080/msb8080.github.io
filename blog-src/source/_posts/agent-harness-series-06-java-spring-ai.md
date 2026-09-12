---
title: "Agent Harness 系列 06：用 Java 与 Spring AI 自建业务 Agent"
date: 2026-09-04 21:40:00
updated: 2026-09-04 21:40:00
description: "面向 Java 后端的自建 Harness 方案：状态机、模型适配、工具注册、审批、事件流、持久化和可替换模型。"
series: agent-harness
series_title: Agent Harness 工程实践
series_order: 6
cover: "/img/default.png"
tags:
  - Harness
  - Spring AI
  - Java
  - Agent
categories:
  - AI 后端学习
---

当 Agent 需要嵌入业务系统、接入内部审批、支持租户隔离并沉淀审计数据时，自建 Harness 才真正有价值。Spring AI 提供模型、工具调用和可观测性抽象，具体 API 以[官方参考文档](https://docs.spring.io/spring-ai/reference/)为准。

## 1. 先定义领域状态机

```text
CREATED
  → PLANNING
  → RUNNING
  → WAITING_APPROVAL
  → RUNNING
  → VERIFYING
  → SUCCEEDED | FAILED | CANCELLED
```

不要用一个 `is_finished` 字段承载所有语义。每次状态转换要记录：操作者、原因、输入事件、输出事件、版本号和时间。工具调用要有唯一 `call_id`，外部写操作还要有幂等键。

## 2. 分层架构

```text
api
 ├─ TaskController / SSE
application
 ├─ AgentOrchestrator
 ├─ ApprovalService
 └─ EvaluationService
domain
 ├─ AgentTask / Step / ToolCall
 └─ Policy / StateMachine
infrastructure
 ├─ ModelAdapter (OpenAI / DeepSeek / ...)
 ├─ ToolExecutor
 ├─ TaskRepository
 └─ EventPublisher
```

模型 SDK 只能存在于 infrastructure 层。领域层接收统一的 `ModelDecision`，这样切模型时不会把整个业务状态机一起重写。

## 3. 统一模型适配器

```java
public interface ModelGateway {
    ModelDecision decide(AgentContext context, List<ToolSpec> tools);
}

public sealed interface ModelDecision {
    record FinalAnswer(String content) implements ModelDecision {}
    record CallTool(String callId, String name, Map<String, Object> args)
            implements ModelDecision {}
}
```

OpenAI、DeepSeek 或其他兼容服务都转换为这个接口。不要把某厂商的 finish reason、消息类型和错误码直接扩散到领域对象。

## 4. 编排循环

```java
for (int step = 0; step < policy.maxSteps(); step++) {
    var task = repository.lock(taskId);
    var decision = modelGateway.decide(contextBuilder.build(task), tools.visibleTo(task));

    if (decision instanceof ModelDecision.CallTool call) {
        policy.check(task, call);
        if (policy.requiresApproval(call)) {
            repository.waitForApproval(task, call);
            return;
        }
        var result = toolExecutor.execute(call);
        repository.appendStep(task, call, result);
        continue;
    }

    var answer = (ModelDecision.FinalAnswer) decision;
    var report = evaluator.verify(task, answer);
    repository.finishOrContinue(task, answer, report);
    return;
}
```

这段代码省略了事务、重试和异常处理，但明确了三条边界：模型不能直接执行工具；策略层可以中断；最终答案必须通过验证。

## 5. 工具设计

一个工具只做一件事，并返回结构化结果：

```json
{
  "ok": false,
  "error_code": "TEST_FAILED",
  "summary": "2 tests failed",
  "artifacts": ["reports/test/index.html"],
  "retryable": true
}
```

输出必须限长，完整日志存对象存储或本地制品，只把摘要和引用放回上下文。Shell 工具尤其要限制工作目录、环境变量、超时、输出大小和允许命令。

## 6. SSE 事件不要直接透传模型 token

对前端公开稳定的业务事件：

```text
task.status.changed
agent.message.delta
tool.call.requested
tool.call.completed
approval.required
verification.completed
task.completed
```

事件带递增序号，断线重连从 `Last-Event-ID` 恢复。模型流式格式变化只影响适配层，不影响前端协议。

## 7. 第一版范围

第一版只做单 Agent、有限工具、人工审批、持久化步骤和离线评测。多 Agent、长期记忆和自动规划不是起步必需品。先让 30 个真实任务稳定完成，再增加复杂度。

下一篇收尾：[Harness 安全、评测与可观测性](/blog/2026/09/04/agent-harness-series-07-security-evaluation/)。
