# Hexo-Blog 开发日志（含部署与使用说明）

## 1. 项目里程碑（基于 Git 提交）
1. `48ef10c`：`Hexo-Blog feat init`
2. `3bc69db`：`Hexo-Blog feat modify themes`
3. `682b150`：`更换主题为fluid`

## 2. 当前状态巡检（2026-04-30）
- 已识别为 Hexo 7 博客工程。
- 已完成本地构建验证（`npm run clean && npm run build`）。
- 主题采用 `hexo-theme-fluid` npm 依赖方式，已移除空主题目录导致的 `No layout` 风险。
- 部署方式已切换为 SSH：`git@github.com:msb8080/msb8080.github.io.git`。
- 已新增 `package-lock.json`、`.nvmrc`、`package.json#engines`，依赖与运行时可复现性提升。
- 站点域名配置已从占位值改为 `https://msb8080.github.io`。

## 3. 日常开发说明
### 3.1 环境准备
1. 安装 Node.js LTS（建议 18/20 之一）。
2. 在项目根目录安装依赖：`npm install`。

### 3.2 常用命令
- 清理缓存：`npm run clean`
- 本地启动：`npm run server`
- 生成静态文件：`npm run build`
- 发布站点：`npm run deploy`

### 3.3 内容维护
1. 在 `source/_posts/` 下新增 Markdown 文章。
2. 按 `permalink` 规则自动生成文章链接。
3. 构建后内容输出到 `public/`。

## 4. 部署使用说明
### 4.1 前置条件
1. 当前机器已配置可推送到 `git@github.com:msb8080/msb8080.github.io.git` 的 SSH 凭据。
2. `_config.yml` 中 `deploy` 字段保持可用。
3. 首次部署前完成主机信任：`ssh -T git@github.com`。

### 4.2 手动部署步骤
1. `npm install`
2. `npm run clean`
3. `npm run build`
4. `npm run deploy`

### 4.3 验证部署
1. 检查目标仓库 `master` 分支是否有新提交。
2. 打开 GitHub Pages 域名验证页面更新时间。

## 5. 问题记录与处理建议
1. 主题目录为空（高优先级）
   - 现象：重新构建可能失败或页面样式缺失。
   - 处理：已改为 `hexo-theme-fluid` 依赖安装，并删除空目录影响。
2. 依赖版本漂移（中优先级）
   - 现象：不同机器 `npm install` 结果可能不同。
   - 处理：已提交 `package-lock.json`，并新增 `.nvmrc` 与 `engines` 约束。
3. 配置域名占位（中优先级）
   - 现象：`url` 仍为 `http://example.com`。
   - 处理：已更新为 `https://msb8080.github.io`。

## 6. 部署故障复盘（2026-04-30）
1. 现象：`hexo deploy` 初次执行失败，报错 `could not read Username for 'https://github.com'`。
2. 原因：HTTPS 部署缺少可用凭据。
3. 处理：切换部署仓库为 SSH 地址。
4. 现象：切换后出现 `Host key verification failed`。
5. 原因：执行环境 SSH 主机信任与 key 使用不一致。
6. 处理：补齐 SSH 信任并显式使用 GitHub key，随后部署成功（`INFO Deploy done: git`）。

## 7. 后续迭代建议
1. 新增 GitHub Actions 自动化构建部署。
2. 增加 README 的一键启动与故障排查说明。
3. 对 `public/` 是否入库做团队约定：
   - 若保留：强调“产物可直接回滚部署”。
   - 若移除：改由 CI 产物发布，降低仓库噪音。
