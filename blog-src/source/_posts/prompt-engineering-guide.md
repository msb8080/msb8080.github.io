---
title: Prompt Engineering 完全指南：从基础技巧到高级策略
abbrlink: prompt-engineering-guide
date: 2026-05-09 14:10:00
updated: 2026-05-09 15:00:00
description: "全面梳理 Prompt Engineering 技术体系，从 Zero-shot、Few-shot、CoT 到 ReAct、Tree-of-Thought，涵盖 System Prompt 设计、结构化输出、约束提示等实战技巧。"
cover: "/img/default.png"
tags:
  - Prompt Engineering
  - CoT
  - ReAct
  - 大模型
categories:
  - AI 后端学习
keywords:
  - Prompt Engineering
  - Chain-of-Thought
  - 结构化输出
  - System Prompt
  - ReAct
---

> 本文从 [大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/) 中拆分，聚焦"一、Prompt Engineering"部分。不改模型、不加数据，只靠"说话方式"把效果拉到最好。

## 为什么 Prompt Engineering 是第一优先级？

Prompt Engineering 是大模型应用开发的**地基**。无论你后面用 RAG、Agent 还是微调，最终都要通过 Prompt 跟模型沟通。Prompt 写得好坏，直接决定应用效果。

**核心原则**：Prompt 就是给模型写一份"工作说明书"——越清晰、越具体、越有结构，模型输出越好。

---

## 一、Prompt 基础技巧

### 1.1 Zero-shot 与 Few-shot

**Zero-shot**：直接提问，不给示例。

```python
prompt = """
将以下文本分类为 [正面/负面/中性]：
"这家餐厅的菜味道不错，但等了40分钟才上菜。"
"""
# 模型可能输出：中性
```

**Few-shot**：给出几个示例，引导模型理解任务和输出格式。

```python
prompt = """
将以下文本分类为 [正面/负面/中性]。

示例1：输入："服务态度超好，下次还来！" → 正面
示例2：输入："味道一般，价格偏贵。" → 负面
示例3：输入："位置在市中心，方便停车。" → 中性

现在分类：输入："这家餐厅的菜味道不错，但等了40分钟才上菜。" →
"""
# 模型输出更稳定：中性
```

**什么时候用 Few-shot？**
- 需要特定输出格式
- 任务定义模糊，示例比描述更清晰
- Zero-shot 效果不好时

### 1.2 Chain-of-Thought（思维链）

CoT 是最重要的 Prompt 技巧之一。核心思想：**让模型"一步步想"，而不是直接给答案**。

```python
# 没有 CoT —— 容易出错
prompt = """
小明有15个苹果，给了小红5个，又买了8个，吃了3个，还剩几个？
"""
# 模型可能直接猜答案，容易算错

# 使用 CoT —— 准确率大幅提升
prompt = """
小明有15个苹果，给了小红5个，又买了8个，吃了3个，还剩几个？

请一步步思考：
1. 初始数量：15个
2. 给了小红5个：15 - 5 = 10个
3. 又买了8个：10 + 8 = 18个
4. 吃了3个：18 - 3 = 15个
所以最终答案是：15个
"""
```

**触发 CoT 的几种方式**：

```python
# 方式1：直接要求
prompt = "请一步步思考，然后给出答案。"

# 方式2：使用特定标记
prompt = "让我们一步步来分析这个问题。"

# 方式3：在 Few-shot 示例中展示推理过程
prompt = """
问题：商店有20个橙子，上午卖了8个，下午进了15个，晚上卖了6个。
思考过程：20 - 8 + 15 - 6 = 21
答案：21个

问题：图书馆有50本书，借出23本，归还7本，新购入12本。
"""
```

### 1.3 System Prompt 设计

System Prompt 是所有应用的起点，定义模型的"人设"和约束。

```python
# 基础 System Prompt
system_prompt = "你是一个专业的 Python 代码助手。"

# 详细的 System Prompt（推荐）
system_prompt = """
# 角色
你是一个专业的 Python 代码助手，擅长后端开发、API 设计和性能优化。

# 能力范围
- 编写 Python 代码（FastAPI、Django、Flask）
- 代码审查和优化建议
- 调试和错误排查
- 架构设计讨论

# 输出规范
- 代码必须附带注释
- 优先使用 Python 3.10+ 特性
- 复杂逻辑分步骤解释
- 给出代码的时间/空间复杂度

# 约束
- 不回答与编程无关的问题
- 不提供任何系统的 root 密码
- 遇到不确定的问题，明确说明而不是猜测
"""

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "写一个 FastAPI 的 JWT 认证中间件"},
]
```

**System Prompt 设计清单**：

| 要素 | 说明 | 示例 |
|------|------|------|
| 角色定义 | 模型是谁 | "你是 X 领域专家" |
| 能力范围 | 能做什么 | "你可以做 A、B、C" |
| 输出格式 | 怎么回答 | "用 Markdown 格式，代码附注释" |
| 约束条件 | 不能做什么 | "不回答政治话题" |
| 语气风格 | 怎么说话 | "用口语化表达，简洁明了" |

### 1.4 结构化输出（JSON Mode）

让模型输出 JSON，方便程序解析，是 RAG、Agent 等应用的基础能力。

```python
prompt = """
从以下文本中提取实体信息，输出 JSON 格式：

文本："张三在北京大学计算机系读博士，导师是李四教授，研究方向是自然语言处理。"

输出格式：
{
    "person": [{"name": "...", "role": "..."}],
    "organization": [{"name": "...", "type": "..."}],
    "location": ["..."],
    "research_topic": ["..."]
}
"""
```

**使用 OpenAI JSON Mode（更可靠）**：

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "你是一个信息提取助手。请始终以 JSON 格式回复。"},
        {"role": "user", "content": "提取以下文本的实体：张三在北京大学工作"},
    ],
    response_format={"type": "json_object"},
)

import json
result = json.loads(response.choices[0].message.content)
print(result)
# {"person": [{"name": "张三", "role": "员工"}], "organization": [{"name": "北京大学", "type": "大学"}]}
```

### 1.5 Prompt 模板引擎

在实际项目中，Prompt 通常需要动态填充变量，需要模板引擎。

**LangChain 方式**：
```python
from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "你是{role}，擅长{skill}。"),
    ("human", "{question}"),
])

prompt = template.invoke({
    "role": "数据分析师",
    "skill": "SQL 查询和数据可视化",
    "question": "帮我写一个查询本月销售 Top10 的 SQL",
})
```

**Spring AI 方式（Java）**：
```java
PromptTemplate template = new PromptTemplate("""
    你是{role}，擅长{skill}。
    用户问题：{question}
    """);

Prompt prompt = template.create(Map.of(
    "role", "数据分析师",
    "skill", "SQL 查询",
    "question", "查询本月销售Top10"
));
```

### 1.6 思维链 + 结构化输出

CoT 和 JSON 输出结合，兼顾推理过程和可解析性：

```python
prompt = """
分析以下用户投诉，输出分析结果。

投诉内容："我上周买的手机屏幕有划痕，联系客服说已经过了7天退换期，让我自己找售后维修。"

请先一步步分析问题（reasoning），然后给出结构化结果。

输出 JSON 格式：
{
    "reasoning": "分析过程的每一步...",
    "category": "产品问题",
    "severity": "中",
    "suggested_action": "建议方案",
    "keywords": ["关键词1", "关键词2"]
}
"""
```

---

## 二、高级 Prompt 技巧

### 2.1 Self-Consistency（自一致性）

**核心思想**：同一个问题让模型回答多次，取多数答案（投票）。

```python
import collections

def self_consistency(prompt, n=5):
    """多次采样，取最多出现的答案"""
    answers = []
    for _ in range(n):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,  # 需要一定随机性
        )
        answers.append(response.choices[0].message.content.strip())
    
    # 投票取多数
    counter = collections.Counter(answers)
    most_common = counter.most_common(1)[0]
    return most_common[0], most_common[1] / n  # 答案 + 置信度

answer, confidence = self_consistency("23 * 47 = ?", n=5)
print(f"答案: {answer}, 置信度: {confidence:.0%}")
```

**适用场景**：数学计算、逻辑推理、事实性问答。不适合创意任务。

### 2.2 Tree-of-Thought（思维树）

**核心思想**：探索多条推理路径，选择最优路径。

```python
prompt = """
我有一个 3x3 的数字华容道（滑块拼图），当前状态是：
2 8 3
1 6 4
7 _ 5

目标状态：
1 2 3
8 _ 4
7 6 5

请用思维树方法求解：
1. 列出当前所有可能的移动（分支）
2. 对每个分支评估距离目标的启发值
3. 选择最优分支继续探索
4. 重复直到找到解
"""
```

**实际使用建议**：ToT 的效果取决于任务复杂度。简单任务用 CoT 就够了。

### 2.3 ReAct Prompting（推理 + 行动）

ReAct 是 Agent 的 Prompt 基础，让模型在**推理**和**行动**之间交替：

```python
prompt = """
你可以使用以下工具：
- search(query): 搜索网页
- calculate(expression): 计算数学表达式

请按照以下格式回答：
Thought: 我需要思考下一步做什么
Action: 工具名称(参数)
Observation: 工具返回的结果
...（可以重复多次）
Thought: 我现在知道答案了
Final Answer: 最终回答

问题：2024年巴黎奥运会中国代表团获得了多少枚金牌？
"""
```

模型输出：
```text
Thought: 我需要搜索2024年巴黎奥运会中国代表团的金牌数。
Action: search("2024年巴黎奥运会中国代表团金牌数")
Observation: 中国代表团在2024年巴黎奥运会获得40枚金牌...
Thought: 搜索结果显示中国获得了40枚金牌。
Final Answer: 2024年巴黎奥运会中国代表团获得了40枚金牌。
```

### 2.4 Role Playing（角色扮演）

让模型扮演特定角色，提升特定领域表现：

```python
prompt = """
你现在是一位有20年经验的资深架构师，评审以下系统设计方案。

设计方案：[设计方案内容]

请从以下维度评审：
1. 可扩展性
2. 可用性
3. 性能瓶颈
4. 安全风险
5. 成本优化

每个维度给出1-10分和具体建议。
"""
```

### 2.5 Constraint Prompting（约束提示）

明确约束条件，减少幻觉：

```python
prompt = """
基于以下参考资料回答问题。注意：
1. 只能使用参考资料中的信息回答
2. 如果参考资料中没有相关信息，回复"根据现有资料无法回答"
3. 引用原文时标注来源段落编号

参考资料：
[段落1] Spring Boot 3.0 要求 Java 17 或更高版本...
[段落2] Spring AI 提供了统一的 AI 模型调用接口...

问题：Spring AI 支持哪些向量数据库？
"""
```

### 2.6 Output Format Control（输出格式控制）

精确控制输出格式：

```python
# 要求 Markdown 表格
prompt = "对比 Python 和 Java 在 AI 开发中的优劣，用 Markdown 表格输出。"

# 要求特定列表格式
prompt = """
列出 3 个 Python Web 框架，格式如下：
1. **框架名** - 一句话描述
2. **框架名** - 一句话描述
3. **框架名** - 一句话描述
"""

# 要求 XML 标签格式（某些场景更可靠）
prompt = """
分析以下代码的潜在问题。

<analysis>
<issue>
<severity>high/medium/low</severity>
<description>问题描述</description>
<suggestion>修复建议</suggestion>
</issue>
</analysis>
"""
```

---

## 三、Prompt 工程最佳实践

### 3.1 Prompt 调试清单

| 检查项 | 说明 |
|--------|------|
| 任务描述是否清晰？ | 模型是否知道要做什么 |
| 输出格式是否指定？ | JSON/Markdown/表格 |
| 约束条件是否明确？ | 不能做什么 |
| Few-shot 示例是否覆盖边界？ | 特殊情况的处理 |
| 是否有歧义？ | 一个指令可能有多种理解 |

### 3.2 常见陷阱

**陷阱1：Prompt 太长太复杂**
```python
# ❌ 一次给太多指令，模型容易遗漏
prompt = "做A、做B、做C、做D、做E、做F..."

# ✅ 分步骤或使用分隔符
prompt = """
## 任务1：做A
## 任务2：做B
## 任务3：做C
请按顺序完成以上任务。
"""
```

**陷阱2：假设模型理解隐含信息**
```python
# ❌ 模型不知道"上次"是什么
prompt = "修改上次的代码"

# ✅ 提供完整上下文
prompt = "修改以下代码，将 timeout 从 30 改为 60：\n```python\n...\n```"
```

**陷阱3：期望模型做不可能的事**
```python
# ❌ 模型不知道实时信息
prompt = "现在北京的天气怎么样？"

# ✅ 使用工具
prompt = "请调用天气 API 查询北京当前天气。"
```

### 3.3 Prompt 性能优化

| 技巧 | 说明 | 节省比例 |
|------|------|----------|
| 缩短 System Prompt | 只保留必要约束 | 10-30% |
| 压缩 Few-shot 示例 | 精选代表性示例 | 20-40% |
| 使用缩写和符号 | "e.g." 替代 "for example" | 5-10% |
| 避免重复指令 | 合并相似要求 | 10-20% |

---

## 四、Java 生态的 Prompt 实践（Spring AI）

```java
// Spring AI PromptTemplate 示例
@Component
public class CustomerServiceAgent {

    private final ChatModel chatModel;
    
    private static final String SYSTEM_PROMPT = """
        你是客服助手，负责回答用户关于产品的问题。
        
        规则：
        1. 只回答产品相关问题
        2. 不确定时引导用户联系人工客服
        3. 用简洁友好的语气
        """;

    public String answer(String question, ProductContext context) {
        PromptTemplate template = new PromptTemplate("""
            产品信息：{productInfo}
            用户问题：{question}
            
            请基于产品信息回答，如果信息不足请说明。
            """);
        
        Prompt prompt = template.create(Map.of(
            "productInfo", context.toMarkdown(),
            "question", question
        ));
        
        // 注入 System Prompt
        List<Message> messages = List.of(
            new SystemMessage(SYSTEM_PROMPT),
            prompt.getInstructions().get(0)
        );
        
        return chatModel.call(new Prompt(messages))
                       .getResult()
                       .getOutput()
                       .getContent();
    }
}
```

---

## 五、学习建议

### 动手练习路径

```text
Week 1: 基础
├── 用 Zero-shot 完成 5 个不同任务
├── 用 Few-shot 引导输出格式
└── 为你的项目写一个 System Prompt

Week 2: 进阶
├── 用 CoT 解决数学/逻辑推理题
├── 实现结构化 JSON 输出
└── 尝试 Self-Consistency

Week 3: Agent 基础
├── 学习 ReAct 范式
├── 设计工具集和 Prompt
└── 做一个简单的 Agent
```

### 推荐资源

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [DeepLearning.AI "ChatGPT Prompt Engineering for Developers"](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/)

---

*上一篇：[零、大模型基础理论](/blog/2026/05/09/llm-foundation-theory/)*
*下一篇：[二、RAG 检索增强生成](/blog/2026/05/09/rag-retrieval-augmented-generation/)*
*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
