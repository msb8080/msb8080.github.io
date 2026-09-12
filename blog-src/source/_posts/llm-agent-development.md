---
title: AI Agent 智能体开发：从理论基础到实战案例
abbrlink: llm-agent-development
date: 2026-05-09 14:30:00
updated: 2026-05-09 15:00:00
description: "全面解析 AI Agent 智能体开发，涵盖 Agent 理论、Function Calling、ReAct 范式、记忆管理、Multi-Agent 协作、主流框架对比和 3 个实战案例。"
cover: "/img/default.png"
tags:
  - Agent
  - Function Calling
  - ReAct
  - Multi-Agent
  - LangGraph
categories:
  - AI 后端学习
keywords:
  - AI Agent
  - Function Calling
  - ReAct 范式
  - Multi-Agent
  - LangGraph
  - Agent 框架
---

> 本文从 [大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/) 中拆分，聚焦"三、Agent 智能体"部分。让模型能"用工具、做决策、执行多步任务"。

## 什么是 Agent？

如果说 Prompt Engineering 是"教模型说话"，RAG 是"教模型查资料"，那 Agent 就是"教模型做事"。

**Agent = LLM + 记忆 + 工具 + 规划**

```text
┌─────────────────────────────────────────┐
│                 Agent                    │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │  LLM  │←→│ 记忆  │←→│ 规划  │       │
│  └───┬───┘  └───────┘  └───────┘       │
│      │                                   │
│      ↓                                   │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ 工具1 │  │ 工具2 │  │ 工具3 │       │
│  └───────┘  └───────┘  └───────┘       │
└─────────────────────────────────────────┘
```

核心范式转变：**从"模型直接回答"到"模型决定下一步做什么"**。

---

## 一、Agent 核心技术

### 1.1 Function Calling：Agent 的基石

Function Calling 让模型能够选择调用哪个函数、提取参数。这是 Agent 与外部世界交互的基础。

```python
from openai import OpenAI
import json

client = OpenAI()

# 定义工具
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "搜索公司知识库，查找相关文档",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词",
                    },
                    "category": {
                        "type": "string",
                        "enum": ["hr", "tech", "product", "finance"],
                        "description": "知识库分类",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "获取指定城市的当前天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["city"],
            },
        },
    },
]

# 调用模型
messages = [{"role": "user", "content": "北京今天天气怎么样？"}]

response = client.chat.completions.create(
    model="gpt-4",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # 让模型自己决定是否调用工具
)

# 检查模型是否决定调用工具
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    
    print(f"模型决定调用: {function_name}")
    print(f"参数: {arguments}")
    # 输出：模型决定调用: get_current_weather
    # 输出：参数: {"city": "北京", "unit": "celsius"}
    
    # 执行函数
    weather_result = get_current_weather(**arguments)
    
    # 把结果返回给模型
    messages.append(response.choices[0].message)
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(weather_result, ensure_ascii=False),
    })
    
    final_response = client.chat.completions.create(
        model="gpt-4",
        messages=messages,
    )
    print(final_response.choices[0].message.content)
```

### 1.2 ReAct 范式：思考-行动-观察循环

ReAct（Reasoning + Acting）是 Agent 的核心工作模式：

```text
Thought: 用户问的是天气问题，我需要查询天气 API
Action: get_current_weather(city="北京")
Observation: {"temperature": 22, "weather": "晴", "wind": "北风3级"}
Thought: 我已经获得了天气信息，可以回答用户了
Final Answer: 北京今天天气晴朗，气温22°C，北风3级。
```

**完整实现**：

```python
def react_agent(user_input, tools, max_iterations=5):
    """最简化的 ReAct Agent"""
    messages = [
        {"role": "system", "content": """你是一个 AI 助手，可以使用工具来完成任务。
        
可用工具：
- search_web(query): 搜索网页
- calculate(expression): 计算数学表达式
- get_weather(city): 查询天气

请按照以下步骤思考：
1. 分析用户需要什么
2. 决定是否需要使用工具
3. 如果需要，调用合适的工具
4. 根据工具结果回答用户
"""},
        {"role": "user", "content": user_input},
    ]
    
    for i in range(max_iterations):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools,
        )
        
        msg = response.choices[0].message
        
        # 模型不再调用工具 → 得到最终答案
        if not msg.tool_calls:
            return msg.content
        
        # 模型调用了工具 → 执行工具并继续循环
        messages.append(msg)
        for tool_call in msg.tool_calls:
            result = execute_tool(tool_call.function.name, 
                                  json.loads(tool_call.function.arguments))
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result),
            })
    
    return "达到最大迭代次数"
```

### 1.3 Tool Use：工具设计

**工具设计原则**：

| 原则 | 说明 | 示例 |
|------|------|------|
| 命名清晰 | 函数名和参数名要自解释 | `search_web` 而非 `tool1` |
| 描述充分 | description 要告诉模型什么时候用 | "当需要搜索实时信息时使用" |
| 参数简洁 | 只传必要参数 | 不要传10个可选参数 |
| 返回结构化 | JSON 格式，方便模型理解 | `{"result": "...", "source": "..."}` |

**常用工具类型**：

```python
# 搜索类工具
def search_web(query: str) -> dict:
    """搜索网页获取实时信息"""
    results = web_search_api.search(query, num=5)
    return {"results": [{"title": r.title, "url": r.url, "snippet": r.snippet} for r in results]}

# 数据库查询工具
def query_database(sql: str) -> dict:
    """执行只读 SQL 查询"""
    # 安全校验：只允许 SELECT
    if not sql.strip().upper().startswith("SELECT"):
        return {"error": "只允许 SELECT 查询"}
    result = db.execute(sql)
    return {"rows": result.fetchall(), "columns": result.keys()}

# 文件操作工具
def read_file(path: str) -> dict:
    """读取文件内容"""
    with open(path, "r") as f:
        return {"content": f.read()}

def write_file(path: str, content: str) -> dict:
    """写入文件"""
    with open(path, "w") as f:
        f.write(content)
    return {"status": "success", "path": path}

# API 调用工具
def send_email(to: str, subject: str, body: str) -> dict:
    """发送邮件"""
    email_client.send(to=to, subject=subject, body=body)
    return {"status": "sent", "to": to}
```

### 1.4 记忆管理

| 记忆类型 | 存储方式 | 用途 |
|----------|----------|------|
| 短期记忆 | 对话历史（Messages 数组） | 当前对话上下文 |
| 长期记忆 | 向量数据库 | 跨会话的用户偏好、历史信息 |
| 工作记忆 | Agent 内部状态 | 任务进度、中间结果 |

```python
class AgentMemory:
    def __init__(self):
        self.short_term = []  # 对话历史
        self.working = {}     # 工作状态
        self.long_term = VectorStore()  # 长期记忆
    
    def add_message(self, role, content):
        self.short_term.append({"role": role, "content": content})
        # 上下文太长时，摘要压缩
        if self.count_tokens() > MAX_TOKENS:
            self.summarize_history()
    
    def search_long_term(self, query, k=3):
        """检索长期记忆"""
        return self.long_term.similarity_search(query, k=k)
    
    def save_to_long_term(self, content, metadata=None):
        """保存到长期记忆"""
        self.long_term.add_texts([content], metadatas=[metadata])
```

### 1.5 规划能力

```text
任务拆解示例：

用户需求："帮我分析上个月的销售数据，找出 Top10 产品，生成报告"

Agent 规划：
1. [查询] 获取上个月的销售数据（SQL 查询）
2. [分析] 按产品汇总销售额，排序取 Top10
3. [可视化] 生成柱状图
4. [撰写] 写分析报告（趋势、异常、建议）
5. [输出] 保存为 PDF 报告
```

---

## 二、Agent 进阶技术

### 2.1 Multi-Agent 多智能体

多个 Agent 协作完成复杂任务：

```text
┌─────────────────────────────────────────────┐
│              Manager Agent                   │
│         (任务拆解、进度监控)                  │
└──────┬──────────┬──────────┬────────────────┘
       ↓          ↓          ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Coder    │ │ Reviewer │ │ Tester   │
│ Agent    │ │ Agent    │ │ Agent    │
│(写代码)  │ │(代码审查) │ │(执行测试) │
└──────────┘ └──────────┘ └──────────┘
```

### 2.2 Agent 编排框架对比

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **LangChain** | 生态最全，组件丰富 | 通用 Agent 开发，快速原型 |
| **LlamaIndex** | 专注 RAG 和数据索引 | 知识密集型应用 |
| **AutoGen** | 多智能体协作，对话驱动 | 复杂任务分解 |
| **CrewAI** | 角色扮演，任务委派 | 需要"角色"协作的场景 |
| **LangGraph** | 状态图编排，支持循环/条件 | 复杂工作流，精细控制 |
| **OpenManus** | 模块化，支持本地运行 | 企业级定制 |

### 2.3 LangGraph 深入

LangGraph 是构建复杂 Agent 工作流的首选框架：

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated

# 定义状态
class AgentState(TypedDict):
    messages: list
    plan: str
    current_step: int
    results: dict

# 定义节点
def planner(state: AgentState) -> AgentState:
    """规划节点：拆解任务"""
    plan = llm.invoke(f"将任务拆解为步骤：{state['messages'][-1]}")
    return {"plan": plan, "current_step": 0}

def executor(state: AgentState) -> AgentState:
    """执行节点：执行当前步骤"""
    step = state["plan"][state["current_step"]]
    result = execute_step(step)
    return {"results": {**state["results"], step: result}}

def reviewer(state: AgentState) -> AgentState:
    """审查节点：检查结果"""
    review = llm.invoke(f"审查以下结果：{state['results']}")
    return {"messages": state["messages"] + [review]}

# 构建图
graph = StateGraph(AgentState)
graph.add_node("planner", planner)
graph.add_node("executor", executor)
graph.add_node("reviewer", reviewer)

# 定义边
graph.set_entry_point("planner")
graph.add_edge("planner", "executor")
graph.add_conditional_edges(
    "executor",
    lambda s: "reviewer" if s["current_step"] >= len(s["plan"]) - 1 else "executor",
)
graph.add_edge("reviewer", END)

# 编译并运行
app = graph.compile()
result = app.invoke({"messages": [user_input]})
```

### 2.4 工具链标准化（MCP）

MCP（Model Context Protocol）是一种标准化的工具接入协议：

```text
传统方式：每个 Agent 自定义工具接口
MCP 方式：统一的工具发现和调用协议

优势：
- 工具复用：一个 MCP 工具可在多个 Agent 中使用
- 标准化：统一的参数描述和返回格式
- 可发现性：Agent 自动发现可用工具
```

### 2.5 Agent 可观测性

追踪 Agent 的每一步推理和工具调用：

```python
# 使用 LangSmith 追踪
import langsmith
from langsmith import traceable

@traceable
def agent_step(step_name, input_data):
    """每个步骤都被追踪"""
    # ... 执行逻辑
    return result

# 使用 Langfuse（自部署）
from langfuse.callback import CallbackHandler

handler = CallbackHandler()
response = agent.invoke(input, config={"callbacks": [handler]})
```

---

## 三、Agent 实战案例

### 3.1 案例1：故障诊断 Agent

```text
工具集：
├── 搜索工具：查询知识库、文档
├── 监控工具：查询系统指标、日志
├── 执行工具：重启服务、修改配置
└── 通知工具：发送告警、生成报告

流程：
1. 接收告警 → 2. 分析症状 → 3. 搜索知识库
4. 查询监控 → 5. 定位根因 → 6. 执行修复
7. 验证结果 → 8. 生成报告
```

```python
tools = [
    {
        "name": "query_logs",
        "description": "查询指定服务的日志",
        "parameters": {
            "service": "服务名",
            "time_range": "时间范围",
            "level": "日志级别"
        }
    },
    {
        "name": "query_metrics",
        "description": "查询系统监控指标",
        "parameters": {
            "metric": "指标名（CPU/内存/请求量/延迟）",
            "service": "服务名"
        }
    },
    {
        "name": "restart_service",
        "description": "重启指定服务",
        "parameters": {
            "service": "服务名"
        }
    },
    {
        "name": "send_alert",
        "description": "发送告警通知",
        "parameters": {
            "channel": "通知渠道",
            "message": "告警内容"
        }
    }
]

# Agent Prompt
system_prompt = """
你是一个运维故障诊断 Agent。收到告警后：
1. 分析告警信息，确定受影响的服务
2. 查询相关日志和监控指标
3. 根据症状在知识库中搜索类似案例
4. 定位根因
5. 如果是已知问题，执行修复方案
6. 生成故障报告

注意：重启服务前必须确认影响范围，重大操作需要人工确认。
"""
```

### 3.2 案例2：AI 写作助手（Multi-Agent）

```text
模块设计：
├── Orchestrator：任务编排，分配写作任务
├── Research Agent：收集素材，搜索资料
├── Writer Agent：生成内容，风格控制
├── Editor Agent：润色修改，质量检查
└── Memory：保存写作偏好、历史稿件

流程：
1. 用户输入主题 → 2. 研究 Agent 收集素材
3. 写作 Agent 生成初稿 → 4. 编辑 Agent 润色
5. 用户确认 → 6. 保存到知识库
```

```python
from langgraph.graph import StateGraph

class WritingState(TypedDict):
    topic: str
    research_results: list
    draft: str
    final_version: str
    feedback: str

def research_agent(state: WritingState) -> WritingState:
    """研究 Agent：搜索素材"""
    results = search_web(state["topic"])
    return {"research_results": results}

def writer_agent(state: WritingState) -> WritingState:
    """写作 Agent：生成初稿"""
    prompt = f"""
    主题：{state['topic']}
    素材：{state['research_results']}
    
    请根据以上素材撰写一篇 2000 字的文章。
    """
    draft = llm.invoke(prompt)
    return {"draft": draft}

def editor_agent(state: WritingState) -> WritingState:
    """编辑 Agent：润色修改"""
    prompt = f"""
    请对以下文章进行编辑润色：
    {state['draft']}
    
    编辑要求：
    1. 修正语法错误
    2. 优化表达方式
    3. 检查逻辑连贯性
    4. 确保准确性
    """
    final = llm.invoke(prompt)
    return {"final_version": final}
```

### 3.3 案例3：Multi-Agent 协作（代码开发）

```text
角色设计：
├── Manager Agent：任务拆解，进度监控
├── Coder Agent：代码编写，单元测试
├── Reviewer Agent：代码审查，安全扫描
├── Tester Agent：集成测试，性能测试
└── Deployer Agent：部署上线，监控告警

协作模式：
Manager → 分配任务 → Coder → 提交代码
                    ↓
           Reviewer ← Code Review
                    ↓
               Tester → 测试通过
                    ↓
            Deployer → 部署上线
```

---

## 四、Spring AI Agent 实践（Java）

```java
// Spring AI Function Calling 示例
@Configuration
public class ToolConfig {

    @Bean
    @Description("查询公司知识库")
    public Function<KnowledgeQuery, KnowledgeResult> searchKnowledge() {
        return query -> {
            List<Document> docs = vectorStore.similaritySearch(query.getQuery());
            return new KnowledgeResult(docs.stream()
                .map(Document::getContent)
                .collect(Collectors.joining("\n---\n")));
        };
    }

    @Bean
    @Description("查询数据库")
    public Function<DatabaseQuery, DatabaseResult> queryDatabase() {
        return query -> {
            // SQL 安全校验
            if (!query.getSql().trim().toUpperCase().startsWith("SELECT")) {
                return new DatabaseResult("只允许 SELECT 查询");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(query.getSql());
            return new DatabaseResult(rows);
        };
    }
}

// Agent 调用
@RestController
public class AgentController {

    private final ChatModel chatModel;
    private final List<FunctionCallback> tools;

    @PostMapping("/agent/chat")
    public String chat(@RequestBody String userMessage) {
        var prompt = Prompt.builder()
            .messages(new SystemMessage("你是一个 AI 助手，可以使用工具完成任务。"),
                      new UserMessage(userMessage))
            .toolCallbacks(tools)
            .build();
        
        return chatModel.call(prompt).getResult().getOutput().getContent();
    }
}
```

---

## 五、学习建议

### 动手路径

```text
Week 1: Function Calling
├── 定义 3 个工具（搜索、计算、查天气）
├── 实现基础 Function Calling
└── 理解 tool_calls 和 tool 响应

Week 2: ReAct Agent
├── 实现 ReAct 循环
├── 加入错误处理
└── 做一个能搜索+计算的 Agent

Week 3: 进阶
├── 学习 LangGraph
├── 实现 Multi-Agent 协作
└── 加入可观测性（LangSmith/Langfuse）
```

---

*上一篇：[二、RAG 检索增强生成](/blog/2026/05/09/rag-retrieval-augmented-generation/)*
*下一篇：[四、模型微调 Fine-tuning](/blog/2026/05/09/llm-fine-tuning-guide/)*
*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
