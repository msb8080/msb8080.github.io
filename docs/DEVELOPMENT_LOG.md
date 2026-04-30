# Hexo-Blog 开发日志（含部署与使用说明）

## 1. 项目里程碑（基于 Git 提交）
1. `48ef10c`：`Hexo-Blog feat init`
2. `3bc69db`：`Hexo-Blog feat modify themes`
3. `682b150`：`更换主题为fluid`

## 2. 当前状态巡检（2026-04-30）
- 已识别为 Hexo 7 博客工程。
- `public/` 已存在完整静态产物，说明历史上至少有一次成功构建。
- `_config.yml` 配置主题为 `fluid`，但 `themes/fluid/` 当前为空目录。
- 部署方式已配置为 `hexo-deployer-git` 推送到 `msb8080/msb8080.github.io` 的 `master` 分支。
- 仓库未包含依赖锁文件，构建可复现性不足。

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
1. 当前机器已配置可推送到 `https://github.com/msb8080/msb8080.github.io` 的 Git 凭据（SSH Key 或 PAT）。
2. `_config.yml` 中 `deploy` 字段保持可用。

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
   - 建议：恢复 `themes/fluid` 源码或使用可追溯的主题安装方案。
2. 依赖版本漂移（中优先级）
   - 现象：不同机器 `npm install` 结果可能不同。
   - 建议：提交 `package-lock.json` 并固定 Node 版本。
3. 配置域名占位（中优先级）
   - 现象：`url` 仍为 `http://example.com`。
   - 建议：改为真实线上地址，避免 SEO 与订阅链接异常。

## 6. 后续迭代建议
1. 新增 GitHub Actions 自动化构建部署。
2. 增加 README 的一键启动与故障排查说明。
3. 对 `public/` 是否入库做团队约定：
   - 若保留：强调“产物可直接回滚部署”。
   - 若移除：改由 CI 产物发布，降低仓库噪音。
