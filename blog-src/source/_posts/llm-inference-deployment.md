---
title: 大模型推理与部署：从 API 调用到高性能引擎
abbrlink: llm-inference-deployment
date: 2026-05-09 14:50:00
updated: 2026-05-09 15:00:00
description: "全面讲解大模型推理与部署，涵盖 API 调用、本地推理（Ollama/vLLM/SGLang）、量化、KV Cache、PagedAttention、Continuous Batching 和企业级部署方案。"
cover: "/img/default.png"
tags:
  - vLLM
  - SGLang
  - 推理优化
  - 模型部署
  - 大模型
categories:
  - AI 后端学习
keywords:
  - 模型推理
  - vLLM
  - SGLang
  - Ollama
  - 模型量化
  - PagedAttention
---

> 本文从 [大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/) 中拆分，聚焦"五、模型推理与部署"部分。把模型跑起来，控制成本和延迟。

## 推理的核心挑战

大模型推理面临三个核心挑战：
1. **显存**：70B 参数的 FP16 模型需要 ~140GB 显存
2. **延迟**：用户等不了 10 秒才看到第一个字
3. **吞吐**：100 个并发请求怎么处理？

---

## 一、推理基础

### 1.1 API 调用（最简单的方式）

```python
from openai import OpenAI

# OpenAI 官方
client = OpenAI(api_key="sk-...")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好"}],
)

# 硅基流动（国内替代）
client = OpenAI(
    base_url="https://api.siliconflow.cn/v1",
    api_key="sk-...",
)
response = client.chat.completions.create(
    model="Qwen/Qwen2.5-72B-Instruct",
    messages=[{"role": "user", "content": "你好"}],
)

# 通义千问
client = OpenAI(
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    api_key="sk-...",
)
```

**API 选型**：

| 平台 | 特点 | 适用场景 |
|------|------|----------|
| OpenAI | 效果最好，英文强 | 效果优先 |
| 硅基流动 | 国内访问快，模型多 | 国内部署 |
| 通义千问 | 阿里生态，中文强 | 阿里云生态 |
| DeepSeek | 推理能力强，性价比高 | 推理任务 |

### 1.2 本地推理

```bash
# Ollama（最简单）
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5:7b
ollama run qwen2.5:7b

# 作为 API 服务启动
ollama serve
# 访问 http://localhost:11434/v1/chat/completions
```

```python
# 用 OpenAI SDK 调用 Ollama
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
response = client.chat.completions.create(
    model="qwen2.5:7b",
    messages=[{"role": "user", "content": "你好"}],
)
```

### 1.3 模型量化

量化 = 用更少的比特表示模型参数，降低显存占用。

| 量化方法 | 精度 | 显存（7B模型） | 精度损失 |
|----------|------|---------------|----------|
| FP16 | 16-bit | ~14GB | 无 |
| GPTQ | 4-bit | ~4GB | 极小 |
| AWQ | 4-bit | ~4GB | 极小 |
| GGUF | 2-8-bit | 2-7GB | 可调 |

```bash
# 下载 GGUF 量化模型
# https://huggingface.co/Qwen/Qwen2.5-7B-GGUF

# 使用 llama.cpp 运行
./llama-server -m qwen2.5-7b-q4_k_m.gguf -c 4096 --port 8080
```

### 1.4 模型选型指南

```text
简单任务（分类、提取、格式化）  →  小模型（7B）或便宜 API
中等任务（问答、摘要、翻译）    →  中等模型（14B-72B）或 GPT-4o-mini
复杂任务（推理、规划、创作）    →  大模型（GPT-4o、Claude Opus）
```

| 任务类型 | 推荐模型 | 理由 |
|----------|----------|------|
| 结构化提取 | Qwen2.5-7B / GPT-4o-mini | 小模型够用，成本低 |
| 中文问答 | Qwen2.5-72B / DeepSeek-V3 | 中文能力强 |
| 代码生成 | Claude Sonnet / GPT-4o | 代码能力最强 |
| 长文本分析 | Claude Opus (200K) | 上下文窗口最大 |
| 数学推理 | DeepSeek-R1 | 推理能力最强 |

### 1.5 成本控制

```python
# 1. Token 缓存（Prompt Caching）
# 重复的 System Prompt 只计费一次
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": LONG_SYSTEM_PROMPT},  # 缓存命中
        {"role": "user", "content": user_input},
    ],
)

# 2. 语义缓存
import hashlib

cache = {}

def cached_llm_call(prompt):
    key = hashlib.md5(prompt.encode()).hexdigest()
    if key in cache:
        return cache[key]
    result = llm.invoke(prompt)
    cache[key] = result
    return result

# 3. 降级策略
def call_with_fallback(prompt):
    try:
        return fast_model.invoke(prompt)  # 先试快模型
    except (TimeoutError, RateLimitError):
        return slow_model.invoke(prompt)  # 降级到慢模型
```

### 1.6 流式输出

```python
# SSE 流式输出
stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "写一首诗"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## 二、高性能推理引擎

### 2.1 引擎对比

| 引擎 | 核心技术 | 适用场景 |
|------|----------|----------|
| **vLLM** | PagedAttention, Continuous Batching | 高吞吐推理，生产首选 |
| **SGLang** | RadixAttention, Radix Tree 缓存 | 复杂控制流（RAG/Agent） |
| **Ollama** | 易用性，本地化 | 开发调试 |
| **TGI** | HuggingFace 官方 | HuggingFace 生态 |

### 2.2 vLLM 部署

```bash
# 安装
pip install vllm

# 启动 API 服务
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 8192 \
    --gpu-memory-utilization 0.9

# 调用（兼容 OpenAI API）
curl http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "Qwen/Qwen2.5-7B",
        "messages": [{"role": "user", "content": "你好"}]
    }'
```

### 2.3 SGLang 部署

```bash
# 安装
pip install sglang[all]

# 启动服务
python -m sglang.launch_server \
    --model Qwen/Qwen2.5-7B \
    --host 0.0.0.0 \
    --port 3000
```

SGLang 的优势在于**前缀缓存**——RAG 和 Agent 场景下，System Prompt 和检索结果的前缀相同，可以复用计算：

```text
请求1: [System Prompt] + [RAG Context A] + [Question 1]
请求2: [System Prompt] + [RAG Context A] + [Question 2]
                          ↑ 前缀相同，缓存复用
```

---

## 三、高并发优化

### 3.1 KV Cache

KV Cache 缓存已计算的 Key-Value，避免重复计算：

```text
生成第 N 个 Token 时：
- 不用 KV Cache：重新计算所有 N-1 个 Token 的 K/V → O(n²)
- 用 KV Cache：复用前 N-1 个 Token 的 K/V，只计算第 N 个 → O(n)
```

### 3.2 PagedAttention

像操作系统管理虚拟内存一样管理 KV Cache：

```text
传统方式：预分配固定大小的 KV Cache → 浪费显存
PagedAttention：按需分配、动态回收 → 显存利用率提升 2-4x
```

### 3.3 Continuous Batching

```text
传统批处理：等一批请求都完成才处理下一批 → GPU 空闲
Continuous Batching：完成一个请求立即插入新请求 → GPU 始终满载
```

### 3.4 性能优化总结

| 技术 | 效果 | 适用场景 |
|------|------|----------|
| KV Cache | 推理速度 O(n) → O(1) | 所有场景 |
| PagedAttention | 显存利用率 2-4x | vLLM |
| Continuous Batching | 吞吐量 2-10x | 高并发 |
| 量化（4-bit） | 显存降低 4x | 显存不足 |
| Tensor Parallelism | 多卡并行 | 单卡放不下 |

---

## 四、企业级部署

### 4.1 GPU 选型

| GPU | 显存 | 适用场景 | 价格 |
|-----|------|----------|------|
| 4090 | 24GB | 开发/小模型 | 低 |
| L40S | 48GB | 中等模型 | 中 |
| A100 | 80GB | 大模型训练/推理 | 高 |
| H100 | 80GB | 最高性能 | 很高 |

### 4.2 Docker 部署

```dockerfile
# vLLM 部署
FROM vllm/vllm-openai:latest

ENV MODEL_NAME=Qwen/Qwen2.5-7B
ENV MAX_MODEL_LEN=8192

CMD python -m vllm.entrypoints.openai.api_server \
    --model $MODEL_NAME \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len $MAX_MODEL_LEN
```

```yaml
# docker-compose.yml
services:
  llm:
    image: vllm/vllm-openai:latest
    ports:
      - "8000:8000"
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - MODEL_NAME=Qwen/Qwen2.5-7B
```

### 4.3 监控

```text
关键指标：
├── GPU 利用率（目标 > 80%）
├── 显存使用率（告警 > 90%）
├── 请求延迟 P50/P95/P99
├── 吞吐量（tokens/sec）
├── 队列深度（排队请求数）
└── 错误率
```

---

## 五、学习建议

```text
Week 1: 能跑起来
├── API 调用（OpenAI / 硅基流动）
├── Ollama 本地部署
└── 流式输出

Week 2: 生产化
├── vLLM 部署
├── Docker 容器化
└── 简单监控

Week 3: 优化
├── 量化部署
├── 性能调参
└── 弹性伸缩
```

---

*上一篇：[四、模型微调](/blog/2026/05/09/llm-fine-tuning-guide/)*
*下一篇：[六、典型应用场景技术栈](/blog/2026/05/09/llm-application-scenarios/)*
*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
