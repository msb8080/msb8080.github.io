---
title: "主流 AI 编程工具 Skills 与插件生态完全指南：安装教程、工作流示例与 Hub 大全"
abbrlink: ai-coding-tools-skills-plugins-guide
date: 2026-05-10 10:00:00
updated: 2026-05-10 10:00:00
description: "全面梳理 2026 年主流 AI 编程工具（Claude Code、Cursor、GitHub Copilot、Windsurf、Cline、Aider）的 Skills/插件体系，涵盖安装教程、热门社区资源、MCP 生态 Hub、以及端到端工作流实战示例。"
cover: "/img/default.png"
tags:
- AI 编程工具
- Claude Code
- Cursor
- MCP
- Skills
categories:
- AI 后端学习
keywords:
- AI 编程工具
- Claude Code Skills
- Cursor Rules
- GitHub Copilot Extensions
- MCP 生态
---

> 本文是 [《大模型应用开发技术路线清单》](/blog/2026/05/09/大模型应用开发技术路线清单/) 系列的实践补充篇，聚焦于开发者日常使用 AI 编程工具时最关心的问题：**如何安装和使用 Skills/插件，如何利用社区资源提升效率，以及如何通过 MCP 生态打通外部工具链。**

---

## 一、为什么需要 Skills 和插件？

AI 编程工具的核心能力在于「理解上下文 + 生成代码」，但默认状态下它们对你的项目规范、团队约定、外部工具链一无所知。**Skills 和插件的本质是让你用声明式的方式教 AI "你是谁、你想要什么"**，从而：

- **降低重复沟通成本**：编码规范、框架偏好、提交风格只需配置一次
- **接入外部工具链**：通过 MCP 协议连接 Jira、数据库、API 文档等
- **构建可复用工作流**：将复杂流程（代码审查、测试生成、文档编写）封装为一键触发的 Skill

---

## 二、Claude Code — Skills 系统

### 2.1 Skills 是什么

Claude Code 的 Skills 系统基于 **Agent Skills 开放标准**，每个 Skill 是一个 `SKILL.md` 文件（YAML frontmatter + Markdown 指令）。Skills 采用**按需加载**机制：始终在上下文中的只有名称和描述（约 100 tokens），完整内容仅在被触发时才加载，极大节省上下文窗口。

### 2.2 安装位置与作用域

| 位置 | 路径 | 作用域 |
|------|------|--------|
| 企业级 | 托管设置（Managed Settings） | 组织内所有用户 |
| 个人级 | `~/.claude/skills/<skill-name>/SKILL.md` | 你的所有项目 |
| 项目级 | `.claude/skills/<skill-name>/SKILL.md` | 当前项目 |
| 插件级 | `<plugin>/skills/<skill-name>/SKILL.md` | 插件启用的地方 |

优先级：企业级 > 个人级 > 项目级。插件 Skills 使用 `plugin-name:skill-name` 命名空间。

### 2.3 目录结构

```
my-skill/
  SKILL.md          # 必需：主指令文件
  template.md       # 可选：模板，让 Claude 填充
  examples/
    sample.md       # 可选：输出示例
  scripts/
    validate.sh     # 可选：Claude 可执行的脚本
```

### 2.4 SKILL.md 核心字段

```yaml
---
description: 代码变更摘要生成器
disable-model-invocation: true   # 仅用户可通过 /skill-name 触发
user-invocable: false            # 仅 Claude 自动触发
allowed-tools: [Bash, Edit]      # 预授权工具列表
context: fork                    # 在子 Agent 中运行
agent: Explore                   # 指定子 Agent 类型
model: sonnet                    # 覆盖模型
paths: ["src/**/*.ts"]           # 仅在匹配路径下激活
---
```

### 2.5 动态上下文注入

Skills 支持 `` !`command` `` 语法，在发送给 Claude 之前动态执行 Shell 命令注入上下文：

```yaml
---
description: 分析未提交的代码变更
---
## 当前变更
!`git diff HEAD`

## 变更统计
!`git diff --stat HEAD`
```

### 2.6 内置 Skills

Claude Code 自带以下 Skills，可直接使用：

| Skill | 用途 |
|-------|------|
| `/simplify` | 审查已修改代码的复用性、质量和效率 |
| `/batch` | 批量处理多个文件或任务 |
| `/debug` | 调试当前问题 |
| `/loop` | 定时循环执行任务 |
| `/claude-api` | 构建 Claude API 应用 |
| `/init` | 初始化 CLAUDE.md 文件 |
| `/review` | 审查 Pull Request |
| `/security-review` | 安全审查 |

### 2.7 自定义 Skill 实战：创建代码审查 Skill

```bash
# 创建 Skill 目录
mkdir -p ~/.claude/skills/code-review
```

编写 `~/.claude/skills/code-review/SKILL.md`：

```yaml
---
description: 自动化代码审查，检查安全漏洞、性能问题和编码规范
disable-model-invocation: true
allowed-tools: [Bash, Read, Grep]
context: fork
---
## 代码审查 Skill

请对指定的代码变更进行全面审查，重点关注：

1. **安全性**：SQL 注入、XSS、硬编码密钥、不安全的依赖
2. **性能**：N+1 查询、不必要的循环、内存泄漏风险
3. **规范**：命名约定、错误处理、日志规范
4. **测试**：边界条件覆盖、Mock 使用合理性

## 变更内容
!`git diff HEAD`

## 变更文件列表
!`git diff --name-only HEAD`
```

使用方式：在 Claude Code 中输入 `/code-review` 即可触发。

### 2.8 分享 Skills

- **项目级**：将 `.claude/skills/` 提交到 Git 仓库
- **插件级**：在插件目录中创建 `skills/` 目录
- **企业级**：通过 Managed Settings 部署

> **目前 Claude Code 尚无集中式 Marketplace**，Skills 主要通过 Git 仓库和插件系统分享。

---

## 三、Cursor — Rules 系统

### 3.1 Rules 的四种类型

| 类型 | 存储位置 | 作用域 |
|------|----------|--------|
| Project Rules | `.cursor/rules/` 目录 | 当前项目 |
| Team Rules | 团队共享 | 团队成员 |
| User Rules | 用户全局设置 | 所有项目 |
| AGENTS.md | 项目根目录 | Agent 指令 |

> 旧版 `.cursorrules` 单文件方式已被 `.cursor/rules/` 目录系统取代，支持按主题组织多个规则文件。

### 3.2 规则文件结构

```
.cursor/
  rules/
    frontend.mdc    # 前端规则
    api.mdc         # API 规则
    testing.mdc     # 测试规则
    database.mdc    # 数据库规则
```

### 3.3 规则文件格式（.mdc）

每个 `.mdc` 文件支持元数据字段控制规则行为：

```yaml
---
description: React 组件开发规范
globs: ["*.tsx", "*.jsx"]
alwaysApply: false
---
## React 组件规范

1. 使用函数式组件 + Hooks
2. Props 接口命名为 `{Component}Props`
3. 使用 CSS Modules 或 Tailwind CSS
4. 每个组件一个文件，导出为 default export
```

- `globs`：文件匹配模式，仅在编辑匹配文件时加载规则
- `alwaysApply`：设为 `true` 则始终应用

### 3.4 自定义规则实战：Next.js 项目规范

创建 `.cursor/rules/nextjs.mdc`：

```yaml
---
description: Next.js 14+ App Router 项目规范
globs: ["app/**/*.tsx", "app/**/*.ts", "components/**/*.tsx"]
alwaysApply: false
---
## Next.js 规范

- 使用 App Router（`app/` 目录），不使用 Pages Router
- Server Components 优先，仅在需要交互时使用 `'use client'`
- 数据获取在 Server Component 中通过 `async/await` 完成
- 使用 `loading.tsx` 和 `error.tsx` 处理加载和错误状态
- API 路由使用 `route.ts`，不使用 `pages/api/`
- 使用 TypeScript 严格模式
```

### 3.5 社区资源

| 资源 | 地址 | 说明 |
|------|------|------|
| awesome-cursorrules | github.com/patrickjs/awesome-cursorrules | GitHub 上最全的 Cursor 规则集合，涵盖 Next.js、Angular、React、Tailwind、Supabase 等框架 |
| cursor.directory | cursor.directory | 社区规则分享平台，可按框架筛选 |

安装社区规则的方式：

```bash
# 方式一：直接下载 .cursorrules 文件到项目根目录（旧方式）
curl -o .cursorrules https://raw.githubusercontent.com/patrickjs/awesome-cursorrules/main/...

# 方式二：将规则文件放入 .cursor/rules/ 目录（推荐）
mkdir -p .cursor/rules
# 将下载的 .mdc 文件放入此目录
```

---

## 四、GitHub Copilot — Extensions 与 Instructions

### 4.1 Extensions Marketplace

GitHub Copilot Extensions 允许第三方工具集成到 Copilot Chat 中。在 **GitHub Marketplace**（github.com/marketplace）中筛选 "Copilot" 即可找到。

热门 Extensions：

| Extension | 功能 |
|-----------|------|
| Docker | 容器化相关问答和操作 |
| Sentry | 错误监控和日志分析 |
| Datadog | APM 和基础设施监控 |
| Azure | 云资源管理 |
| Linear | 项目管理和 Issue 跟踪 |
| Snyk | 安全漏洞扫描 |
| Octocode | 代码分析增强 |

安装方式：在 GitHub Marketplace 中找到对应 Extension，点击 "Install" 即可。

### 4.2 Custom Instructions（自定义指令）

在仓库中创建 `.github/copilot-instructions.md` 文件：

```markdown
# 项目开发规范

## 技术栈
- TypeScript 严格模式
- React 函数式组件
- Zod 数据校验

## 编码规范
- 优先使用 `const`，避免 `let`
- 错误处理使用 Result 模式
- 所有函数必须有 JSDoc 注释
- 测试覆盖率 > 80%
```

配置后，Copilot Chat 会自动遵循这些指令。

### 4.3 Copilot Coding Agent（2025-2026 新特性）

GitHub Copilot 现已支持 **Coding Agent** 模式，可以：

- 自主读取 Issue 并实现代码
- 创建 PR 并等待审查
- 与 GitHub Actions CI/CD 集成
- 支持多模型切换（Anthropic、Google、OpenAI）

---

## 五、Windsurf — Cascade + VS Code 扩展

### 5.1 核心能力

Windsurf（已被 Cognition AI 收购）的核心特性：

| 特性 | 说明 |
|------|------|
| **Cascade** | 深度代码库理解，实时感知上下文变化 |
| **Tab** | 单键触发代码生成 |
| **Devin in Windsurf** | 内置自主云端 Agent |
| **Agent Command Center** | 看板式 Agent 管理面板 |
| **Spaces** | 围绕任务捆绑 Agent 会话、PR、文件 |
| **Windsurf Previews** | IDE 内实时预览网页，点击元素重塑 UI |

### 5.2 扩展机制

Windsurf 基于 VS Code 架构，支持：

- **VS Code 扩展**：直接从 VS Code Marketplace 安装
- **MCP 服务器**：连接自定义工具和服务
- **@ mentions**：在 Cascade 中引用函数、类、文件、目录

### 5.3 工作流示例

```
1. 打开 Windsurf，启动 Cascade
2. @mention 你的 API 目录获取上下文
3. 要求 Cascade 重构认证层
4. Cascade 自动编辑文件并修复 Linter 错误
5. 使用 "Devin in Windsurf" 将部署任务交给云端 Agent
6. 在 Agent Command Center 管理所有 Agent 任务
```

---

## 六、Cline — Skills + MCP 双引擎

### 6.1 Skills 系统

Cline 的 Skills 系统（实验性功能，需在 Settings → Features → Enable Skills 开启）与 Claude Code 类似：

- **按需加载**：元数据始终加载（约 100 tokens），完整指令按需加载
- **存储位置**：`.cline/skills/`（工作区）或 `~/.cline/skills/`（全局）
- **格式**：每个 Skill 是包含 `SKILL.md` 的目录

```bash
# Cline Skills 目录结构
.cline/skills/
  code-gen/
    SKILL.md
  testing/
    SKILL.md
```

> **Skills 与 Rules 的区别**：Rules 始终活跃，Skills 按需加载。适合将不常用但重要的指令封装为 Skill。

### 6.2 MCP 生态

Cline 的主要扩展机制是 **MCP（Model Context Protocol）**：

- **Cline Marketplace**：内置 MCP 服务器发现和安装
- **自动创建**：告诉 Cline "add a tool that fetches Jira tickets"，它会自动生成、构建并安装 MCP 服务器

### 6.3 工作流示例：从 Issue 到实现

```
1. 在 VS Code 侧边栏打开 Cline
2. 输入："add a tool that fetches Jira tickets"
3. Cline 自动创建 MCP 服务器并安装
4. 输入："fetch ticket PROJ-123 and implement the fix"
5. Cline 使用新工具获取 Issue 详情，编辑文件，执行终端命令
6. 通过 Human-in-the-Loop GUI 逐步审批每个变更
```

### 6.4 上下文增强

| 功能 | 说明 |
|------|------|
| `@url` | 抓取 URL 内容并转为 Markdown |
| `@problems` | 添加工作区错误和警告 |
| `@file` / `@folder` | 添加文件/目录内容 |
| `.clinerules` | 项目级规则文件 |
| `.clineignore` | 排除文件 |

---

## 七、Aider — 配置驱动的终端 AI

### 7.1 设计哲学

Aider 是终端原生的 AI 结对编程工具，**没有插件市场**，其可扩展性来自配置系统：

| 配置文件 | 说明 |
|----------|------|
| `.aider.conf.yml` | 主配置文件（支持家目录、Git 根目录、当前目录） |
| `.env` | API 密钥和环境变量 |
| `CONVENTIONS.md` | 编码约定文件 |

### 7.2 配置示例

```yaml
# .aider.conf.yml
model: sonnet
dark-mode: true
auto-commits: true
read:
  - CONVENTIONS.md
  - docs/api-spec.md
```

### 7.3 支持的模型

Claude 3.5 Sonnet、DeepSeek R1、GPT-4o、o1、o3-mini、Gemini、Ollama 本地模型，以及通过 OpenRouter 接入的更多模型。

### 7.4 工作流示例

```bash
# 启动 Aider 并指定要编辑的文件
aider src/api/users.ts src/models/user.ts

# 描述需求
> Add input validation to the user creation endpoint

# Aider 编辑文件并自动提交
# 使用 /undo 撤销上一次变更
# 切换模型：/model o3-mini
```

---

## 八、MCP 生态 Hub 大全

**MCP（Model Context Protocol）** 是跨工具的开放协议，已被 Claude Code、Cursor、Cline、Windsurf、Augment Code 等主流工具采纳。以下是主要的 MCP 生态 Hub：

### 8.1 主要 Hub 平台

| 平台 | 地址 | 规模 | 特点 |
|------|------|------|------|
| **MCP.so** | mcp.so | 20,800+ MCP 服务器 | 第三方最大的 MCP 服务器聚合平台，支持搜索、分类、一键安装 |
| **Smithery.ai** | smithery.ai | 100,000+ 工具 | AI Agent 工具市场，CLI 发现和安装 |
| **GitHub MCP Registry** | github.com/modelcontextprotocol | 官方参考实现 | Anthropic 官方维护，包含数据库、文件系统、Git 等核心 MCP 服务器 |
| **GitHub Marketplace** | github.com/marketplace | Copilot Extensions | GitHub 官方扩展市场，筛选 "Copilot" |

### 8.2 热门 MCP 服务器

| MCP 服务器 | 功能 | 适用工具 |
|-----------|------|----------|
| `filesystem` | 文件系统读写操作 | 所有支持 MCP 的工具 |
| `postgres` / `sqlite` | 数据库查询和管理 | 所有支持 MCP 的工具 |
| `github` | GitHub API 集成（Issue、PR、代码搜索） | 所有支持 MCP 的工具 |
| `slack` | Slack 消息发送和频道管理 | 所有支持 MCP 的工具 |
| `puppeteer` | 浏览器自动化和网页截图 | 所有支持 MCP 的工具 |
| `brave-search` | 网络搜索 | 所有支持 MCP 的工具 |
| `memory` | 持久化知识图谱 | 所有支持 MCP 的工具 |

### 8.3 MCP 安装示例

以 Claude Code 为例，配置一个 MCP 服务器：

```json
// .claude/settings.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

Cline 的 MCP 安装更简单——直接告诉它 "add a tool that..." 即可自动创建。

---

## 九、工具对比总结

| 工具 | 扩展类型 | Hub/市场 | 安装方式 | 核心机制 |
|------|----------|----------|----------|----------|
| **Claude Code** | Skills (SKILL.md) | Git 仓库分享 | `.claude/skills/` 目录 | YAML + Markdown，动态上下文注入 |
| **Cursor** | Rules (.mdc) | awesome-cursorrules, cursor.directory | `.cursor/rules/` 目录 | MDC 文件 + globs 匹配 |
| **GitHub Copilot** | Extensions + Instructions | GitHub Marketplace | 市场安装 + 配置文件 | `.github/copilot-instructions.md` |
| **Windsurf** | VS Code 扩展 + MCP | VS Code Marketplace | 标准 VS Code 安装 | MCP + @ mentions + Cascade |
| **Cline** | Skills + MCP | Cline Marketplace, mcp.so, Smithery.ai | `.cline/skills/` + MCP 配置 | SKILL.md + MCP 协议 |
| **Augment Code** | Context Engine + MCP | 无专属市场 | IDE 扩展安装 | 自动索引 + MCP + Intent |
| **Aider** | 配置文件 | 无市场 | `.aider.conf.yml` | YAML 配置 + CLI 参数 |

---

## 十、端到端工作流实战：从需求到 PR

以下演示一个完整的开发工作流，展示如何组合 Skills、Rules 和 MCP 完成一个功能开发：

### 步骤 1：配置项目规范

```bash
# Claude Code：创建项目 Skill
mkdir -p .claude/skills
cat > .claude/skills/dev-workflow/SKILL.md << 'EOF'
---
description: 全栈开发工作流，从需求分析到代码实现
allowed-tools: [Bash, Read, Edit, Write, Grep]
---
## 开发流程
1. 分析需求，拆解为子任务
2. 检查现有代码结构
3. 实现代码，遵循项目规范
4. 编写测试
5. 运行验证
EOF

# Cursor：创建项目规则
mkdir -p .cursor/rules
cat > .cursor/rules/project.mdc << 'EOF'
---
description: 项目通用规范
alwaysApply: true
---
- TypeScript 严格模式
- 函数式编程优先
- 错误处理使用 Result 模式
- 提交信息使用 Conventional Commits
EOF
```

### 步骤 2：接入外部工具（MCP）

```json
// Claude Code .claude/settings.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_ACCESS_TOKEN": "ghp_xxxxx" }
    }
  }
}
```

### 步骤 3：触发开发流程

```
# 在 Claude Code 中
/dev-workflow

# 描述需求："实现用户注册功能，包含邮箱验证和密码强度校验"

# Claude 会：
# 1. 分析项目结构
# 2. 创建必要的文件
# 3. 实现代码
# 4. 编写测试
# 5. 运行验证
```

### 步骤 4：代码审查

```
# 使用内置 Skill 审查
/review

# 或使用自定义 Skill
/code-review
```

---

## 十一、最佳实践建议

1. **从项目级配置开始**：先为当前项目创建 Rules/Skills，验证效果后再推广到个人级
2. **渐进式增强**：不要一次性配置所有规则，从核心规范开始，逐步补充
3. **利用 MCP 打通工具链**：将常用的外部工具（Jira、数据库、监控）接入 AI 工作流
4. **社区资源要筛选**：awesome-cursorrules 等社区资源质量参差不齐，选择与你技术栈匹配的规则
5. **版本控制 Rules/Skills**：将 `.cursor/rules/`、`.claude/skills/` 等目录纳入 Git 管理
6. **团队统一配置**：通过 Team Rules 或企业级 Managed Settings 确保团队一致性

---

*上一篇：[Prompt Engineering 完全指南：从基础技巧到高级策略](/blog/2026/05/09/prompt-engineering-guide/)*
*下一篇：[RAG 检索增强生成技术全解析](/blog/2026/05/09/rag-retrieval-augmented-generation/)*
*返回导航：[大模型应用开发技术路线清单](/blog/2026/05/09/大模型应用开发技术路线清单/)*
