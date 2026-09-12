# AI Composer Blog

AI Composer 技术猿的 Astro 静态博客，内容聚焦前沿模型、Agent Harness 与 AI 后端工程。

## 技术栈

- Node.js `24.x`（Astro 最低要求为 `22.12`）
- Astro `7.x`
- Markdown Content Collections
- 构建期搜索索引、RSS 与 Sitemap
- GitHub Pages，站点挂载在 `/blog/`

## 快速开始

```bash
npm install
npm run dev
```

开发地址默认为 `http://localhost:4321/blog/`。

生产校验与本地预览：

```bash
npm run validate
npm run preview
```

`validate` 会依次执行类型诊断、生产构建以及生成产物中的路由、资源、搜索索引和 SEO 元数据校验。

## 内容与代码

- `source/_posts/`：已发布 Markdown；保留原目录以降低迁移噪音
- `source/_drafts/`：未参与构建的草稿
- `src/content.config.ts`：Front Matter 数据约束
- `src/pages/`：首页、文章、归档、分类、标签、RSS 与搜索路由
- `src/components/`、`src/layouts/`：页面组件和布局
- `src/styles/global.css`：全站视觉系统
- `dist/`：Astro 构建产物，不入源代码仓库

## 写作

在 `source/_posts/` 新建 Markdown，文件名会成为文章 URL 的最后一段。必填 Front Matter：

```yaml
---
title: 文章标题
date: 2026-09-05 10:00:00
updated: 2026-09-05 10:00:00
last_verified: 2026-09-05 10:00:00 # 持续更新的资料索引可选
description: 一句话摘要
tags:
  - Agent
categories:
  - AI 后端学习
---
```

历史永久链接格式为 `/:year/:month/:day/:filename/`，不要随意重命名已发布文件或修改发布日期。

## 校验与发布

```bash
./bin/blog-flow.sh check
./bin/blog-flow.sh preview
./bin/blog-flow.sh release
```

`release` 会调用 `deploy.sh`，只同步 `dist/` 到 Pages 仓库的 `/blog/` 子目录，校验根站首页未被改动，并在推送后检查线上首页、样式、搜索、分享卡和关键路由。发布前请确保 Pages 仓库工作区干净。

详细设计见 `docs/ARCHITECTURE.md`。
