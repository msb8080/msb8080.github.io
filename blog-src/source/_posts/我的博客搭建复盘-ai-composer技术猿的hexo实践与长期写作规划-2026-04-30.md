---
title: 我的博客搭建复盘：AI Composer 技术猿的 Hexo 实践与长期写作规划（2026-04-30）
date: 2026-04-30 17:20:00
updated: 2026-04-30 17:20:00
description: "这是一篇写给未来自己的博客搭建复盘：为什么选 Hexo，怎么稳定发布，遇到问题怎么排查，以及后续后端、AI、投资理财内容怎么长期更新。"
cover: "/img/default.png"
tags:
  - Hexo
  - 博客搭建
  - 自动化发布
  - AI Composer
  - 后端
  - 投资理财
categories:
  - 使用指南
  - 个人复盘
keywords:
  - Hexo 博客复盘
  - AI 技术博客
  - 博客自动化发布
---

这篇文章主要是给未来的我自己看，目标很明确：以后重装系统、换电脑、或者半年没更新博客再回来时，能在 10 分钟内找回全部流程。

另外也想把定位写清楚：这个博客后续会持续写三类内容，`后端`、`AI`、`投资理财`。我给自己的身份定义是“`AI Composer 技术猿`”，希望把技术实践、思考框架和可执行清单都沉淀下来，而不是只发零散笔记。

## 一、我为什么要搭这个博客

我之前踩过的坑很典型：

- 写作和发布流程靠记忆，隔一段时间就会忘命令。
- 配置分散在多个文件里，出问题时不知道先查哪里。
- 同类文章越写越多，但结构不统一，后续维护越来越累。

所以这次我把目标设成三件事：

1. 流程可复用：写作、预览、发布尽量一条龙。
2. 结构可维护：文档和模板统一，减少重复。
3. 内容可迭代：为后续长期写作（后端/AI/理财）留出稳定框架。

## 二、框架和托管平台怎么选

### 1）框架：Hugo vs Hexo

我最后选 `Hexo`，原因不是它“理论最好”，而是它对我当前最顺手：

- Node 生态我熟，写作到部署的心理成本低。
- 中文资料和主题生态丰富，排障效率高。
- 对个人技术博客来说，性能已经足够。

如果你追求极致构建速度、或者大规模多语言内容站，Hugo 也很强；但对我当前阶段，`Hexo 的综合效率更高`。

### 2）托管平台：我的结论

- 稳健方案：`GitHub Pages + Hexo`
- 体验升级：`Cloudflare Pages + Hexo`
- 工程化备选：`Vercel + Hexo`

我的建议是：

1. 先用 GitHub Pages 跑通整套链路。
2. 需要更好的全球访问体验时，再切 Cloudflare Pages。
3. 如果你团队日常用 Vercel 预览流程，再考虑把博客并入 Vercel。

## 三、我现在的发布流程（已经固化）

我把命令收敛成一个脚本：`bin/blog-flow.sh`。

日常只记三步：

```bash
./bin/blog-flow.sh check
./bin/blog-flow.sh preview
./bin/blog-flow.sh release
```

它分别对应：

- `check`：检查依赖 + Front Matter 必填字段 + clean/build。
- `preview`：本地预览（默认 `http://localhost:4000`）。
- `release`：执行 `clean -> build -> deploy`。

这样做的好处是，命令稳定、认知负担低，半年后回来也不容易手滑漏步骤。

## 四、从写作到上线：给未来自己的最短路径

### 1）新建文章

```bash
npx hexo new post "文章标题"
```

### 2）按模板写作

我现在固定用模板，核心字段必须完整：

- `title`
- `date`
- `updated`
- `tags`
- `categories`

### 3）本地验证与发布

```bash
./bin/blog-flow.sh check
./bin/blog-flow.sh preview
./bin/blog-flow.sh release
```

## 五、我遇到过的坑（和处理方式）

### 1）构建权限错误（EACCES / Operation not permitted）

现象：`npm run build` 写 `public/` 或 `db.json` 失败。

处理：

```bash
sudo chown -R $(whoami):staff public db.json docs source/_posts
```

### 2）发布成功但线上没更新

我会按这个顺序排查：

1. `release` 日志是否真的成功。
2. 部署仓库和分支是否配置正确。
3. 托管平台（GitHub/Cloudflare/Vercel）构建日志是否报错。

### 3）文章时间显示不对

优先检查 Front Matter 的 `date/updated` 是否按本地时区填写。

## 六、我的内容定位与栏目规划

后续我会围绕三条线长期更新。

### 1）后端

会写：

- 服务设计与重构复盘
- 接口性能优化（慢查询、缓存、并发）
- 工程实践（CI/CD、监控、可观测性）

### 2）AI

会写：

- AI 工作流搭建（从 Prompt 到自动化）
- 模型接入实践与成本优化
- AI 工具在研发流程中的落地复盘

### 3）投资理财

会写：

- 个人资产配置思路（方法论层面）
- 风险管理与仓位纪律
- 从技术视角看策略执行和复盘框架

说明：这部分以“个人研究记录”为主，不构成投资建议。

## 七、为了长期维护，我做的结构化改造

- 写作模板：`docs/BLOG_WRITING_TEMPLATE.md`
- 流程清单：`docs/BLOG_WORKFLOW.md`
- 工具手册：`docs/BLOG_TOOLS_USAGE.md`
- 季度复盘模板：`docs/QUARTERLY_BLOG_REVIEW_TEMPLATE.md`
- 本地 Skill：`skills/blog-ops-fastlane/SKILL.md`

目标只有一个：减少重复劳动，让博客输出变成长期可持续系统。

## 八、给自己的发布前检查清单

每次发文前，我只看这 7 条：

1. 标题是否清晰，是否有检索关键词。
2. Front Matter 是否完整。
3. 命令能否直接复制执行。
4. 本地预览是否正常（移动端也看一眼）。
5. 文章是否有明确结论和可执行步骤。
6. 外链是否可访问。
7. `updated` 是否已更新。

## 九、最后：一条命令提醒自己

```bash
npx hexo new post "标题" && ./bin/blog-flow.sh check && ./bin/blog-flow.sh preview && ./bin/blog-flow.sh release
```

如果以后我忘了流程，就回来打开这篇。它不是“教程炫技”，就是我自己的可执行回顾手册。
