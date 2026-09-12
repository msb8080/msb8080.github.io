# 博客长期维护写作模板（Astro）

## Front Matter

```yaml
---
title: 具体、可检索的文章标题
date: 2026-09-05 10:00:00
updated: 2026-09-05 10:00:00
description: 120 字以内摘要
tags:
  - Agent
  - Harness
categories:
  - AI 后端学习
---
```

专题文章可增加 `series`、`series_title`、`series_order`。`cover` 和 `keywords` 可选。

## 推荐章节

1. TL;DR
2. 背景与问题
3. 目标与约束
4. 方案对比
5. 最终决策
6. 实操与验证
7. 风险与回滚
8. 迭代记录

## 发布检查

- 标题包含核心检索词，摘要能独立说明价值。
- 事实性与时效性内容有一手来源和核验日期。
- 命令可复制执行，代码块语言标识正确。
- 内部链接以 `/blog/` 开头，外链可访问。
- 已发布文章只更新 `updated`，不改变 `date` 和文件名。
- `./bin/blog-flow.sh check` 成功，移动端预览正常。
