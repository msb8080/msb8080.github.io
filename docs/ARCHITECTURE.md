# Hexo-Blog 架构文档

## 1. 项目定位
本项目是一个基于 Hexo 的静态博客站点工程，使用 `source/` 作为内容源目录，`public/` 作为构建产物目录，并通过 Git 部署到 GitHub Pages 仓库 `msb8080/msb8080.github.io`。

## 2. 技术栈
- 运行时：Node.js（建议 LTS）
- 静态站点生成器：Hexo `7.3.0`
- 主题：配置为 `fluid`（当前仓库未包含主题源码）
- 部署插件：`hexo-deployer-git`
- 常用插件：
  - `hexo-generator-archive/category/tag/index`
  - `hexo-generator-feed`
  - `hexo-generator-sitemap`
  - `hexo-browsersync`

## 3. 目录结构与职责
- `source/`：站点内容源（文章、页面、资源）
- `scaffolds/`：新建文章/页面模板
- `themes/`：主题目录（当前 `fluid/`、`next/` 为空目录）
- `public/`：静态构建输出目录（可直接部署）
- `.deploy_git/`：Hexo deploy 生成的部署临时 Git 工作目录
- `_config.yml`：全站主配置
- `db.json`：Hexo 内容数据库缓存
- `.github/dependabot.yml`：依赖更新策略（npm 每日扫描）

## 4. 构建与发布流程
### 4.1 本地开发流程
1. 安装依赖：`npm install`
2. 清理缓存：`npm run clean`
3. 本地预览：`npm run server`
4. 构建产物：`npm run build`

### 4.2 线上部署流程
1. 执行 `npm run deploy`。
2. Hexo 将 `public/` 内容推送到 `_config.yml` 中 `deploy.repository` 指定仓库分支（当前为 `master`）。
3. GitHub Pages 从该仓库分支发布。

## 5. 配置要点（来自当前仓库）
- 站点基础信息：`title = 闵帅博的个人博客`
- 永久链接：`/:year/:month/:day/:title/`
- 主题：`theme: fluid`
- 部署：
  - `type: git`
  - `repository: https://github.com/msb8080/msb8080.github.io`
  - `branch: master`

## 6. 当前架构风险与影响
1. **主题目录缺失**：`themes/fluid` 为空，导致基于源码重新构建时可能失败或样式异常。
2. **无锁文件**：缺少 `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`，不同环境安装依赖版本可能不一致。
3. **仓库中保留 `public/` 与 `db.json`**：适合“产物直出”场景，但会增加合并噪音与仓库体积。

## 7. 建议改进
1. 补全主题来源：
   - 使用 Git 子模块引入 `hexo-theme-fluid`，或
   - 在 `package.json` 固定主题依赖并改用 Hexo 官方推荐方式加载。
2. 增加锁文件并统一 Node 版本（可新增 `.nvmrc`）。
3. 增加 CI（GitHub Actions）自动构建与部署，减少手动发布风险。
4. 在 `_config.yml` 中将 `url` 从 `http://example.com` 改为真实线上域名，避免 sitemap/feed 链接错误。

## 8. 架构结论
当前项目可视为“Hexo 内容工程 + GitHub Pages 发布链路”的标准静态博客架构，已具备最小可用发布能力；但要保证长期稳定迭代，需要优先修复“主题缺失 + 依赖不可复现”两项基础问题。
