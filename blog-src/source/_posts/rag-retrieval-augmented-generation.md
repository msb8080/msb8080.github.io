---
title: RAG 检索增强生成：从基础架构到企业级优化
abbrlink: rag-retrieval-augmented-generation
date: 2026-05-09 14:20:00
updated: 2026-05-09 15:00:00
description: "深入解析 RAG 检索增强生成技术，涵盖基础架构、文本分块、Embedding、向量数据库、Query 改写、重排序、混合检索、GraphRAG 及企业级优化方案。"
cover: "/img/default.png"
tags:
  - RAG
  - 向量数据库
  - Embedding
  - 大模型
  - 知识问答
categories:
  - AI 后端学习
keywords:
  - RAG 架构
  - 向量检索
  - Embedding 模型
  - 混合检索
  - GraphRAG
---

> 本文从 [大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/) 中拆分，聚焦"二、RAG 检索增强生成"部分。让模型能"查资料再回答"，解决幻觉和知识过时问题。

## 为什么 RAG 是必修课？

大模型有两个致命弱点：
1. **幻觉**：不知道的事情也会编造答案
2. **知识过时**：训练数据有截止日期，无法获取最新信息

RAG（Retrieval-Augmented Generation）的核心思想：**先检索相关资料，再让模型基于资料生成回答**。

```text
传统方式：用户问题 → LLM → 回答（可能幻觉）
RAG 方式：用户问题 → 检索相关文档 → 拼接上下文 → LLM → 回答（有据可查）
```

**RAG 解决了 80% 的企业知识问答需求**，是大模型应用开发的第二优先级（仅次于 Prompt Engineering）。

---

## 一、RAG 基础架构

### 1.1 标准 RAG 流程

```text
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户问题     │ →  │  Query 改写  │ →  │  向量检索     │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  LLM 生成    │ ←  │  拼接上下文  │ ←  │  重排序       │
└──────────────┘    └──────────────┘    └──────────────┘
```

两个阶段：
- **索引阶段**（离线）：文档 → 分块 → Embedding → 存入向量数据库
- **检索阶段**（在线）：用户问题 → Embedding → 向量检索 → 重排序 → 拼接 → 生成

### 1.2 索引阶段详解

```python
# 完整的索引流程
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import Qdrant

# 1. 加载文档
with open("company_docs.md", "r") as f:
    raw_text = f.read()

# 2. 文本分块
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 每块最大500字符
    chunk_overlap=50,     # 相邻块重叠50字符，避免切断语义
    separators=["\n\n", "\n", "。", "，", " "],  # 优先按这些分隔符切分
)
chunks = splitter.split_text(raw_text)
print(f"分成了 {len(chunks)} 个块")

# 3. 生成 Embedding 并存储
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Qdrant.from_texts(
    texts=chunks,
    embedding=embeddings,
    url="http://localhost:6333",
    collection_name="company_docs",
)
print("索引完成！")
```

### 1.3 检索阶段详解

```python
from langchain_openai import ChatOpenAI

def rag_query(question: str, vectorstore, k=5):
    """标准 RAG 查询"""
    # 1. 向量检索，找到最相关的 k 个块
    docs = vectorstore.similarity_search(question, k=k)
    
    # 2. 拼接上下文
    context = "\n\n---\n\n".join([doc.page_content for doc in docs])
    
    # 3. 生成回答
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    response = llm.invoke([
        {"role": "system", "content": "基于以下参考资料回答问题。如果参考资料中没有相关信息，请说明。"},
        {"role": "user", "content": f"参考资料：\n{context}\n\n问题：{question}"},
    ])
    
    return response.content

answer = rag_query("公司的年假制度是什么？", vectorstore)
```

---

## 二、RAG 核心技术详解

### 2.1 文本分块策略

分块是 RAG 系统的**第一道关卡**，分块质量直接决定检索质量。

| 策略 | 原理 | 适用场景 |
|------|------|----------|
| 固定长度分块 | 按字符数/Token数切分 | 简单文本，快速原型 |
| 递归分块 | 按分隔符层级递归切分 | 结构化文档（推荐） |
| 语义分块 | 根据语义相似度切分 | 长文、连贯文本 |
| 文档结构分块 | 按标题/段落/表格切分 | 技术文档、法律文件 |

```python
# 递归分块（最常用）
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", ".", " "],
)

# 按文档结构分块（适合 Markdown）
from langchain.text_splitter import MarkdownHeaderTextSplitter

headers = [("#", "H1"), ("##", "H2"), ("###", "H3")]
md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers)
md_chunks = md_splitter.split_text(markdown_content)
```

**分块大小的经验值**：

| 文档类型 | 推荐 chunk_size | chunk_overlap |
|----------|----------------|---------------|
| 技术文档 | 300-500 字符 | 50-100 |
| 对话记录 | 200-400 字符 | 30-50 |
| 法律/学术 | 500-800 字符 | 100-150 |
| 代码 | 按函数/类切分 | 0 |

### 2.2 Embedding 模型选型

Embedding 模型将文本转为向量，是语义检索的基础。

| 模型 | 维度 | 最大长度 | 特点 |
|------|------|----------|------|
| OpenAI text-embedding-3-small | 1536 | 8191 | 性价比高，英文强 |
| OpenAI text-embedding-3-large | 3072 | 8191 | 精度最高 |
| BGE-M3 | 1024 | 8192 | 多语言、多粒度、多功能 |
| Jina Embeddings v3 | 1024 | 8192 | 长文本优化 |
| M3E | 768 | 512 | 中文优化，开源 |

```python
# 使用 BGE-M3（中文推荐）
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

embeddings = HuggingFaceBgeEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={"device": "cuda"},
    encode_kwargs={"normalize_embeddings": True},
)

# 使用 OpenAI
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
```

**选型建议**：
- 中文为主 → BGE-M3 或 text-embedding-3-large
- 预算有限 → text-embedding-3-small
- 私有化部署 → BGE-M3 (HuggingFace)
- 多语言 → BGE-M3 或 Jina v3

### 2.3 向量数据库对比

| 数据库 | 特点 | 适用场景 |
|--------|------|----------|
| **Milvus** | 功能最全，分布式，GPU 加速 | 大规模生产环境 |
| **Qdrant** | Rust 实现，性能好，API 友好 | 中等规模，性能敏感 |
| **Chroma** | 最简单，嵌入式 | 开发/原型/小规模 |
| **Weaviate** | 内置混合搜索，GraphQL API | 需要混合检索 |
| **pgvector** | PostgreSQL 插件，复用现有基础设施 | 已有 PG 的团队 |

```python
# Chroma（最简单，适合开发）
from langchain_chroma import Chroma
vectorstore = Chroma.from_texts(chunks, embeddings, persist_directory="./chroma_db")

# Qdrant（推荐生产环境）
from langchain_qdrant import QdrantVectorStore
vectorstore = QdrantVectorStore.from_texts(
    chunks, embeddings,
    url="http://localhost:6333",
    collection_name="my_docs",
)

# Milvus（大规模）
from langchain_milvus import Milvus
vectorstore = Milvus.from_texts(
    chunks, embeddings,
    connection_args={"uri": "./milvus_demo.db"},
)
```

### 2.4 相似度检索

```python
# 基础相似度搜索
docs = vectorstore.similarity_search("公司年假政策", k=5)

# 带分数的搜索
docs_and_scores = vectorstore.similarity_search_with_score("公司年假政策", k=5)
for doc, score in docs_and_scores:
    print(f"分数: {score:.4f} | 内容: {doc.page_content[:100]}...")

# MMR（最大边际相关性）：兼顾相关性和多样性
docs = vectorstore.max_marginal_relevance_search("公司年假政策", k=5, fetch_k=20)
```

### 2.5 Query 改写

用户的原始问题往往不是最优的检索 Query，需要改写。

```python
# HyDE（假设性文档嵌入）
# 思路：先让模型生成一个"假设性回答"，用这个回答去检索
def hyde_rewrite(query, llm):
    prompt = f"""
    请针对以下问题，写一段假设性的回答（不需要准确，只需要格式和风格对）：
    问题：{query}
    """
    hypothetical_answer = llm.invoke(prompt).content
    return hypothetical_answer  # 用这个去检索

# Multi-Query：将一个问题拆成多个角度的子问题
def multi_query_rewrite(query, llm):
    prompt = f"""
    将以下问题拆分为 3 个不同角度的子问题，每行一个：
    问题：{query}
    """
    sub_queries = llm.invoke(prompt).content.strip().split("\n")
    return [q.strip() for q in sub_queries if q.strip()]

# Step-back：生成更高层次的抽象问题
def stepback_rewrite(query, llm):
    prompt = f"""
    针对以下具体问题，生成一个更通用、更高层次的问题：
    具体问题：{query}
    """
    return llm.invoke(prompt).content.strip()
```

### 2.6 重排序（Rerank）

向量检索是"粗排"，Rerank 是"精排"，显著提升准确率。

```python
from langchain_cohere import CohereRerank

reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=3)

# 先检索 20 条
docs = vectorstore.similarity_search(query, k=20)

# 再用 Rerank 精排到 3 条
reranked_docs = reranker.compress_documents(docs, query)

# 或使用 BGE Reranker（本地部署）
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
reranker = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-v2-m3")
```

**Rerank 的效果**：通常能将准确率提升 10-20%，是 RAG 系统的标准配置。

---

## 三、RAG 进阶技术

### 3.1 混合检索（Hybrid Search）

向量检索擅长语义理解，BM25 擅长关键词匹配。两者结合效果更好。

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 检索器
bm25_retriever = BM25Retriever.from_texts(chunks, k=10)

# 向量检索器
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

# 混合检索
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],  # BM25 权重 0.4，向量权重 0.6
)

docs = ensemble_retriever.invoke("公司年假政策")
```

**何时需要混合检索？**
- 用户问题包含专业术语、产品编号等精确关键词
- 向量检索召回率不够时
- 需要兼顾语义和字面匹配

### 3.2 GraphRAG（知识图谱增强）

用知识图谱增强检索，适合**复杂关系推理**。

```text
传统 RAG：用户问题 → 向量检索 → 回答
GraphRAG：用户问题 → 向量检索 + 图谱遍历 → 回答

优势：
- 捕捉实体间的关系（A公司与B公司的合作）
- 支持多跳推理（X的导师的学生是谁？）
- 全局摘要能力（这批数据的整体趋势是什么）
```

**GraphRAG 架构**：

```text
文档 → 实体抽取 → 构建知识图谱 → 社区检测 → 社区摘要
                                         ↓
用户问题 → 全局/局部检索 → 拼接上下文 → LLM 生成
```

### 3.3 Agentic RAG

Agent 控制检索策略，动态决定**是否检索、检索什么、怎么检索**。

```python
# Agent 自主决定检索策略
def agentic_rag(query, tools):
    """
    Agent 根据问题复杂度决定：
    - 简单事实 → 直接回答
    - 需要检索 → 选择最合适的知识库
    - 复杂问题 → 多次检索 + 推理
    """
    # Agent 的 Prompt
    prompt = f"""
    你是一个知识问答助手。你可以使用以下工具：
    - search_kb(query): 搜索知识库
    - search_web(query): 搜索网页
    - calculate(expr): 数学计算
    
    请分析问题，决定是否需要检索，选择合适的工具。
    
    问题：{query}
    """
    # ... ReAct 循环
```

### 3.4 多模态 RAG

处理图片、表格、PDF 等非纯文本内容。

```python
# 使用 Docling 解析 PDF（保留表格结构）
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert("financial_report.pdf")
markdown_content = result.document.export_to_markdown()

# 表格序列化：将表格转为 Markdown 格式，保留结构信息
# 这样 Embedding 能更好地理解表格语义
```

### 3.5 评估框架

RAG 系统上线前必须评估。

```python
# RAGAS 评估框架
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

results = evaluate(
    dataset=eval_dataset,  # 包含 question, answer, contexts, ground_truth
    metrics=[faithfulness, answer_relevancy, context_precision],
)

# RAG Triad（三维度评估）：
# 1. 忠实度 (Faithfulness)：回答是否基于检索到的上下文
# 2. 相关性 (Answer Relevancy)：回答是否切题
# 3. 上下文精度 (Context Precision)：检索到的内容是否相关
```

| 指标 | 含义 | 理想值 |
|------|------|--------|
| Faithfulness | 回答忠实于上下文的比例 | > 0.9 |
| Answer Relevancy | 回答与问题的相关度 | > 0.85 |
| Context Precision | 检索结果的精确度 | > 0.8 |
| Context Recall | 检索结果的召回率 | > 0.8 |

### 3.6 父页面检索（Parent Document Retriever）

检索时用小块（精确），生成时用大块（完整上下文）。

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 小块：用于检索（精确匹配）
child_splitter = RecursiveCharacterTextSplitter(chunk_size=200)
# 大块：用于生成（完整上下文）
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1000)

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=InMemoryStore(),
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
# 检索时匹配小块，返回对应的大块
docs = retriever.invoke("公司年假政策")
```

---

## 四、RAG 系统优化

### 4.1 文档解析优化

| 工具 | 特点 | 适用场景 |
|------|------|----------|
| Docling | IBM 出品，结构保留好 | PDF、Word、PPT |
| MinerU | 中文优化，表格识别强 | 中文文档 |
| Unstructured | 通用，格式支持广 | 多格式混合 |

### 4.2 企业 RAG 冠军方案

```text
架构：多路由 + 动态知识库
├── 解析模块：Docling 优化 → 表格序列化 → 内容提取
├── 检索模块：向量检索 → BM25 → LLM 重排序 → 父页面回溯
├── 生成模块：思维链 + 结构化输出 → 指令细化
└── 调参：Embedding 模型选择 → 分块策略 → Top-K 优化
```

### 4.3 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 检索不到相关内容 | 分块太大/太小、Embedding 不适合 | 调整分块策略，换 Embedding 模型 |
| 检索到但回答不对 | 上下文拼接方式不好 | 改用父页面检索，优化 Prompt |
| 回答幻觉 | 模型忽视上下文 | 强化 Prompt 约束，降低 Temperature |
| 速度慢 | 检索量大、Rerank 慢 | 减少 Top-K，用更快的 Reranker |

---

## 五、学习建议

### 动手路径

```text
Week 1: 搭一个最简单的 RAG
├── LangChain + Chroma + OpenAI
├── PDF 问答系统
└── 能跑通就行

Week 2: 优化检索质量
├── 换 Embedding 模型（BGE-M3）
├── 加 Rerank（Cohere / BGE-reranker）
├── 加 Query 改写（HyDE / Multi-Query）
└── 用 RAGAS 评估

Week 3: 生产化
├── 换 Qdrant / Milvus
├── 混合检索
├── 父页面检索
└── 监控和调参
```

### 推荐资源

- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- [RAGAS Documentation](https://docs.ragas.io/)
- [LlamaIndex RAG Guide](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)

---

*上一篇：[一、Prompt Engineering](/blog/2026/05/09/prompt-engineering-guide/)*
*下一篇：[三、Agent 智能体](/blog/2026/05/09/llm-agent-development/)*
*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
