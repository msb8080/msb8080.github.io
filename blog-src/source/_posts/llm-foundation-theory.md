---
title: 大模型基础理论：Transformer 架构、LLM 核心概念与训练流程详解
abbrlink: llm-foundation-theory
date: 2026-05-09 14:00:00
updated: 2026-05-09 15:00:00
description: "面向应用层开发者的 Transformer 架构原理详解，涵盖 Self-Attention、Q/K/V、Positional Encoding、LLM 核心概念、主流架构演进和模型训练三阶段流程。"
cover: "/img/default.png"
tags:
  - Transformer
  - LLM
  - 大模型
  - Attention
  - 预训练
categories:
  - AI 后端学习
keywords:
  - Transformer 架构
  - Self-Attention
  - LLM 基础
  - 模型训练
---

> 本文从 [大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/) 中拆分，聚焦"零、大模型基础理论"部分，适合应用层开发者建立对 LLM 底层原理的直觉理解。

## 为什么应用层开发者需要理解基础理论？

你可能会问：我是做应用的，为什么要理解模型内部原理？答案很简单——**理解原理能帮你做出更好的工程决策**：

- 知道 Attention 的 O(n²) 复杂度，你就理解了为什么长文本模型那么贵
- 理解 Token 的工作方式，你就能写出更高效的 Prompt
- 明白 KV Cache 的原理，你就知道怎么优化推理成本
- 搞清训练三阶段，你就知道微调到底在调什么

不需要深入数学推导，但需要建立**直觉**。

---

## 一、Transformer 架构原理

### 1.1 整体数据流

一个最简化的 Transformer 推理流程：

```text
输入文本
  ↓
Tokenize（分词）
  ↓
Token Embedding（词向量映射）
  ↓
Positional Encoding（添加位置信息）
  ↓
N × [Self-Attention → Add & Norm → FFN → Add & Norm]
  ↓
Linear Layer（映射到词表大小）
  ↓
Softmax（输出概率分布）
  ↓
采样得到下一个 Token
```

核心直觉：模型每次做的事情就是——**给定前面所有 Token，预测下一个 Token 是什么**。

### 1.2 Self-Attention：Transformer 的灵魂

Self-Attention 是整个架构最核心的机制。它的作用是：**让每个 Token 能"看到"序列中所有其他 Token，并决定对谁更关注**。

#### 核心公式

```python
Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V
```

三个角色的直觉理解：

| 角色 | 直觉解释 | 类比 |
|------|----------|------|
| Q (Query) | 当前 Token "想问什么" | 你去图书馆，你的搜索关键词 |
| K (Key) | 每个 Token "能提供什么" | 每本书的标签/索引 |
| V (Value) | 每个 Token "实际内容" | 每本书的实际内容 |

计算过程：
1. Q 和 K 做点积，得到注意力分数（谁跟谁更相关）
2. 除以 √d_k（缩放，防止点积过大导致 softmax 梯度消失）
3. softmax 归一化，得到注意力权重（0~1 之间）
4. 用权重对 V 做加权求和，得到输出

#### Python 代码演示

```python
import numpy as np

def self_attention(Q, K, V):
    """最简化的 Self-Attention 实现"""
    d_k = Q.shape[-1]
    
    # 1. 计算注意力分数
    scores = Q @ K.T / np.sqrt(d_k)
    
    # 2. Softmax 归一化
    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
    weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)
    
    # 3. 加权求和
    output = weights @ V
    
    return output, weights

# 示例：3个Token，维度4
np.random.seed(42)
X = np.random.randn(3, 4)  # 3个Token的Embedding

# Q, K, V 通过线性变换得到
W_q = np.random.randn(4, 4)
W_k = np.random.randn(4, 4)
W_v = np.random.randn(4, 4)

Q = X @ W_q  # Query矩阵
K = X @ W_k  # Key矩阵
V = X @ W_v  # Value矩阵

output, weights = self_attention(Q, K, V)

print("注意力权重矩阵：")
print(weights.round(3))
# 解读：weights[i][j] 表示第i个Token对第j个Token的关注程度
# 每行之和为1（softmax归一化）
```

#### 为什么需要缩放因子 √d_k？

当维度 d_k 很大时，Q·K^T 的点积值会很大，softmax 会趋向 one-hot 分布（梯度接近 0），导致训练不稳定。除以 √d_k 让方差保持在 1 附近。

```python
# 直觉演示
d_k = 64
Q = np.random.randn(d_k)
K = np.random.randn(d_k)

# 不缩放：点积方差 ≈ d_k
dot_product = np.dot(Q, K)
print(f"不缩放的点积: {dot_product:.2f}")  # 可能是很大的值

# 缩放后：方差 ≈ 1
scaled = dot_product / np.sqrt(d_k)
print(f"缩放后的点积: {scaled:.2f}")  # 合理的范围
```

### 1.3 Multi-Head Attention

单个 Attention Head 只能关注一种关系。Multi-Head 让模型**同时关注不同维度的关系**：

```text
例如分析句子 "The cat sat on the mat"

Head 1: 关注语法关系 (cat → sat, 主谓)
Head 2: 关注位置关系 (sat → on → mat, 介词短语)
Head 3: 关注指代关系 (The → cat, 冠词修饰)
...
```

实现方式：把 Q/K/V 分别投影到多个低维子空间，各自做 Attention，最后拼接：

```python
def multi_head_attention(X, W_q, W_k, W_v, W_o, num_heads=4):
    d_model = X.shape[-1]
    d_k = d_model // num_heads
    
    heads = []
    for i in range(num_heads):
        # 每个头使用不同的投影矩阵
        Q = X @ W_q[:, i*d_k:(i+1)*d_k]
        K = X @ W_k[:, i*d_k:(i+1)*d_k]
        V = X @ W_v[:, i*d_k:(i+1)*d_k]
        
        head_output, _ = self_attention(Q, K, V)
        heads.append(head_output)
    
    # 拼接所有头的输出
    multi_head = np.concatenate(heads, axis=-1)
    
    # 最终线性投影
    output = multi_head @ W_o
    return output
```

**应用层关注点**：理解多头就够了，不需要手写实现。框架（PyTorch、Transformers）已经封装好。

### 1.4 Positional Encoding：位置信息的注入

Transformer 没有循环结构，天然不理解 Token 的顺序。Positional Encoding 就是给每个 Token 附加位置信息。

#### 三种主流方案

| 方案 | 原理 | 代表模型 | 特点 |
|------|------|----------|------|
| 绝对位置编码 | 每个位置一个固定向量 | GPT-2, BERT | 简单，但外推能力差 |
| 相对位置编码 | 编码 Token 间的相对距离 | T5, DeBERTa | 更好地捕捉相对关系 |
| RoPE (旋转位置编码) | 通过旋转矩阵编码位置 | LLaMA, Qwen, DeepSeek | 长文本友好，支持外推 |

#### RoPE 核心思想

RoPE 的直觉：**通过旋转矩阵让不同位置的向量产生角度差异，点积自然包含位置信息**。

```python
import numpy as np

def apply_rope(x, position, dim, base=10000):
    """简化的 RoPE 实现"""
    # 计算频率
    freqs = 1.0 / (base ** (np.arange(0, dim, 2) / dim))
    
    # 计算角度
    angles = position * freqs
    
    # 将 x 分成两两一组，应用旋转
    x_rope = x.copy()
    for i in range(0, dim, 2):
        cos_a = np.cos(angles[i // 2])
        sin_a = np.sin(angles[i // 2])
        x_rope[i] = x[i] * cos_a - x[i + 1] * sin_a
        x_rope[i + 1] = x[i] * sin_a + x[i + 1] * cos_a
    
    return x_rope

# 直觉：位置0和位置1的向量，旋转角度不同
# 因此它们的点积会包含相对位置信息
x = np.random.randn(8)
x_pos0 = apply_rope(x, position=0, dim=8)
x_pos1 = apply_rope(x, position=1, dim=8)

print(f"原始向量点积: {np.dot(x, x):.4f}")
print(f"位置0和位置1的RoPE点积: {np.dot(x_pos0, x_pos1):.4f}")
# 点积值不同 → 模型可以区分位置
```

**为什么 RoPE 对长文本友好？** 因为旋转角度是连续的，模型可以泛化到训练时没见过的位置（外推）。

### 1.5 FFN（前馈网络）与残差连接

每个 Transformer Block 的后半部分：

```text
Attention输出 → Add & Norm → FFN → Add & Norm → 输出
                ↑残差连接                ↑残差连接
```

**FFN 的作用**：Attention 负责"信息聚合"，FFN 负责"信息变换"。可以理解为 Attention 决定"看什么"，FFN 决定"怎么理解"。

```python
def ffn(x, W1, W2, b1, b2):
    """两层前馈网络，中间用 ReLU 激活"""
    hidden = np.maximum(0, x @ W1 + b1)  # ReLU
    output = hidden @ W2 + b2
    return output
```

**残差连接的作用**：解决深层网络的梯度问题，让梯度可以直接"跳过"中间层回传。

### 1.6 为什么应用层开发者需要理解 Attention？

理解 Attention 机制对应用开发有 4 个直接影响：

| 认知 | 对应用的影响 |
|------|------------|
| Attention 复杂度 O(n²) | 理解上下文窗口限制，为什么 128K 比 4K 贵得多 |
| KV Cache 优化 | 理解推理加速原理，为什么 streaming 输出更快 |
| 长文本成本 | 评估 RAG vs 长上下文方案的经济性 |
| Primacy/Recency Effect | Prompt 中重要信息放首尾，中间内容容易被"遗忘" |

---

## 二、LLM 核心概念

### 2.1 Token：模型的"眼睛"

模型看到的不是字符，而是 Token。Token 是分词器（Tokenizer）切分文本后的最小单位。

```python
import tiktoken

enc = tiktoken.encoding_for_model("gpt-4")

# 中文通常一个字 = 1~2 个 Token
print(enc.encode("你好世界"))          # [6581, 5329, 10034, 98]
print(enc.n_tokens("你好世界"))        # 4

# 英文常见词是一个 Token
print(enc.encode("hello world"))       # [15339, 1917]
print(enc.n_tokens("hello world"))     # 2

# 特殊字符和生僻词会被拆成多个 Token
print(enc.encode("🍕"))               # [9468, 99830, 244]
print(enc.n_tokens("🍕"))             # 3
```

**对应用的影响**：
- **计费**：按 Token 数收费，中英文成本不同
- **上下文长度**：不是字符数，而是 Token 数
- **Prompt 优化**：用更简洁的表达减少 Token 消耗

### 2.2 Temperature 与采样策略

```python
# Temperature 控制输出随机性
# temperature = 0 → 总是选概率最高的 Token（确定性）
# temperature = 1 → 按原始概率采样（创造性）
# temperature > 1 → 更随机（通常不用）

# Top-P (Nucleus Sampling)：只从累计概率达到 P 的 Token 中采样
# top_p = 0.9 → 只考虑概率前 90% 的 Token

# Top-K：只从概率最高的 K 个 Token 中采样
# top_k = 50 → 只考虑前 50 个 Token
```

**最佳实践**：

| 场景 | Temperature | Top-P | 理由 |
|------|-------------|-------|------|
| 代码生成 | 0 | - | 需要确定性，每次结果一致 |
| 客服问答 | 0.3 | 0.9 | 稍有变化但不失控 |
| 创意写作 | 0.7-1.0 | 0.95 | 需要多样性和创造力 |
| 数据提取 | 0 | - | 需要精确匹配 |

### 2.3 Context Window

Context Window = 模型一次能处理的最大 Token 数，包括输入 + 输出。

```text
例如 GPT-4 的 128K 上下文窗口：
├── System Prompt: ~500 Tokens
├── 用户输入: ~2000 Tokens
├── RAG 检索结果: ~8000 Tokens
├── 对话历史: ~10000 Tokens
├── 模型输出: 最多 ~107500 Tokens
└── 总计 ≤ 128,000 Tokens
```

**实际影响**：
- RAG 检索多少条结果？受 Context Window 限制
- 对话历史保留多少轮？需要截断或摘要策略
- 长文档处理：是否需要分块？

### 2.4 对话角色：System / User / Assistant

```python
messages = [
    {"role": "system", "content": "你是一个专业的 Python 代码助手。"},
    {"role": "user", "content": "写一个快速排序"},
    {"role": "assistant", "content": "def quicksort(arr): ..."},
    {"role": "user", "content": "解释一下时间复杂度"},
]
```

| 角色 | 作用 | 注意事项 |
|------|------|----------|
| System | 定义角色、约束、格式 | 部分模型支持有限 |
| User | 用户输入 | - |
| Assistant | 模型回复 | 可以预填充引导输出 |

### 2.5 Stop Sequence 与 Logprobs

**Stop Sequence**：告诉模型"遇到这个字符串就停止生成"。

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "列出3个水果"}],
    stop=["\n4."],  # 生成到第3个就停
)
```

**Logprobs**：输出每个 Token 的对数概率，用于评估模型置信度。

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "巴黎是哪个国家的首都？"}],
    logprobs=True,
    top_logprobs=5,
)
# 可以看到模型对"法国"这个答案的置信度有多高
```

**应用场景**：
- 不确定性检测：置信度低时，触发人工审核
- 分类任务：检查 top-1 和 top-2 的概率差距
- 幻觉检测：低置信度输出可能是幻觉

---

## 三、主流模型架构演进

### 3.1 五大架构对比

| 架构 | 代表模型 | 特点 | 典型用途 |
|------|----------|------|----------|
| Decoder-Only | GPT-4, Claude, LLaMA, Qwen | 自回归生成，当前绝对主流 | 文本生成、对话、Agent |
| Encoder-Only | BERT, RoBERTa | 双向理解，一次看全文 | 分类、NER、语义相似度 |
| Encoder-Decoder | T5, BART | 编码理解 + 解码生成 | 翻译、摘要、结构化生成 |
| MoE | Mixtral, DeepSeek-V3 | 稀疏激活，效率高 | 大规模推理，性价比 |
| SSM | Mamba | 线性复杂度，长文本友好 | 长文档处理 |

### 3.2 为什么 Decoder-Only 成为主流？

GPT 系列证明了一个重要发现：**只要规模够大，Decoder-Only 模型能涌现（emerge）出各种能力**。

关键优势：
- 自回归生成天然适合文本生成任务
- 结构简单，训练效率高
- 规模扩展效果好（Scaling Law）

### 3.3 MoE（混合专家）详解

MoE 的核心思想：**模型很大，但每次只激活一部分参数**。

```text
传统模型：80B 参数，每次推理全部激活
MoE 模型：8×7B = 56B 总参数，每次只激活 2×7B = 14B

效果接近 80B，成本接近 14B
```

路由机制：

```text
输入 Token → Router（门控网络）→ 选择 Top-K 个专家 → 加权输出

Router 本质是一个小的分类网络，决定"这个问题找哪个专家"
```

**代表模型**：
- **Mixtral 8x7B**：8 个专家，每次激活 2 个，效果接近 LLaMA-2 70B
- **DeepSeek-V3**：更精细的路由策略，中文能力强

### 3.4 State Space Model（Mamba）

Mamba 用状态空间模型替代 Attention，实现**线性复杂度**：

```text
Transformer: O(n²) → 128K 上下文 = 巨大计算量
Mamba: O(n)    → 128K 上下文 = 线性增长
```

但目前 Mamba 在复杂推理任务上还不如 Transformer，两者各有优劣。业界也在探索 Transformer + SSM 的混合架构。

---

## 四、模型训练三阶段

### 4.1 阶段一：Pre-training（预训练）

```text
输入：海量无标注文本（几 TB ~ 几 PB）
目标：预测下一个 Token（Next Token Prediction）
产出：Base Model（基座模型）

这个阶段模型学会了：
├── 语法和语言规则
├── 世界知识（截止到训练数据的时间）
├── 推理能力（初步涌现）
└── 但不会"听指令"——它只会补全文本
```

Base Model 的表现：
```python
# 输入："什么是 Python？"
# Base Model 可能输出：
# "什么是 Python？什么是 Java？什么是 Go？什么是..."（补全模式）
# 而不是回答问题
```

### 4.2 阶段二：SFT（监督微调）

```text
输入：指令-回答对（几万 ~ 几十万条）
目标：学会"听懂人话"并按指令回答
产出：Chat Model

数据格式：
{
    "instruction": "将以下文本翻译成英文",
    "input": "今天天气真好",
    "output": "The weather is really nice today"
}
```

SFT 让模型从"补全机器"变成"对话助手"。

### 4.3 阶段三：RLHF / DPO（对齐）

```text
目标：让模型的输出符合人类偏好（有用、安全、诚实）
方法：人类标注偏好数据，训练模型对齐

RLHF（Reinforcement Learning from Human Feedback）：
1. 收集人类对不同回答的偏好排序
2. 训练 Reward Model（奖励模型）
3. 用 PPO 算法优化生成模型

DPO（Direct Preference Optimization）：
1. 同样收集人类偏好数据
2. 直接优化模型，不需要 Reward Model
3. 更简单、更稳定
```

**RLHF vs DPO vs GRPO 对比**：

| 方法 | 需要 Reward Model | 稳定性 | 复杂度 | 代表模型 |
|------|-------------------|--------|--------|----------|
| RLHF | ✅ 需要 | 中等 | 高 | InstructGPT, ChatGPT |
| DPO | ❌ 不需要 | 高 | 中 | Zephyr, 大量开源模型 |
| GRPO | ❌ 不需要 | 高 | 中 | DeepSeek-R1 |

### 4.4 代码示例：用 TRL 做 SFT

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

# 加载模型
model_name = "Qwen/Qwen2.5-7B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")

# 加载数据集
dataset = load_dataset("tatsu-lab/alpaca", split="train")

# 格式化数据
def format_instruction(example):
    if example["input"]:
        return f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n{example['output']}"
    else:
        return f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"

# 训练配置
config = SFTConfig(
    output_dir="./qwen-sft",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    learning_rate=2e-5,
    max_seq_length=512,
)

# 开始训练
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    formatting_func=format_instruction,
    args=config,
)

trainer.train()
trainer.save_model("./qwen-sft-final")
```

---

## 五、学习建议与资源

### 学习优先级

| 内容 | 优先级 | 建议 |
|------|--------|------|
| Self-Attention 直觉理解 | ⭐⭐⭐⭐⭐ | 必须掌握 Q/K/V 的含义 |
| Token 概念 | ⭐⭐⭐⭐⭐ | 直接影响计费和 Prompt 设计 |
| Temperature 作用 | ⭐⭐⭐⭐⭐ | 日常调参必备 |
| RoPE 位置编码 | ⭐⭐⭐⭐ | 理解长文本模型的关键 |
| MoE 架构 | ⭐⭐⭐ | 了解即可，帮助选型 |
| 训练三阶段 | ⭐⭐⭐⭐ | 理解微调的意义 |
| 数学推导 | ⭐⭐ | 应用层不需要 |

### 推荐资源

**视频**：
- [3Blue1Brown "Attention in transformers, visually explained"](https://www.youtube.com/watch?v=eMlx5fFNoYc) — 最直观的 Attention 可视化
- [Andrej Karpathy "Let's build GPT from scratch"](https://www.youtube?v=kCc8FmEb1nY) — 从零实现 GPT

**文章**：
- [Jay Alammar "The Illustrated Transformer"](http://jalammar.github.io/illustrated-transformer/) — 经典图文教程
- [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/) — 带代码注释的论文实现

**代码**：
- [nanoGPT](https://github.com/karpathy/nanoGPT) — 最小化的 GPT 实现
- [minbpe](https://github.com/karpathy/minbpe) — 最小化的 BPE 分词器

---

*下一篇：[一、Prompt Engineering：基础技巧与高级策略](/blog/2026/05/09/prompt-engineering-guide/)*

*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
