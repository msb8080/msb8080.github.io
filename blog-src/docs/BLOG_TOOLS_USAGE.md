# 博客工具使用手册

## 准备

```bash
nvm use
npm install
```

项目要求 Node 24；Astro 的最低运行版本是 Node 22.12。

## 三个统一命令

### 校验

```bash
./bin/blog-flow.sh check
```

检查 `npm`、`rg`、输出目录权限和变更文章的 Front Matter，然后执行完整 Astro 生产构建。内容 schema、Markdown 解析、所有静态路由、RSS 和 Sitemap 都在这一步验证。

### 预览

```bash
./bin/blog-flow.sh preview
```

访问 `http://localhost:4321/blog/`。开发服务器支持热更新。

若要验证最终生产文件：

```bash
npm run build
npm run preview
```

### 发布

```bash
./bin/blog-flow.sh release
```

流程为 `check -> Astro build -> dist/ -> Pages 仓库 blog/ -> commit -> pull --rebase -> push`。部署脚本会拒绝脏的 Pages 工作区，并验证根目录首页哈希没有变化。

## 常见问题

### npm 内网仓库下载缓慢

仅在依赖均为公开 npm 包且确认内网代理不可用时，可对单次安装指定官方仓库；不要修改全局配置：

```bash
npm install --registry=https://registry.npmjs.org
```

### 内容构建失败

优先查看报错中的 Markdown 文件和字段名。常见原因是日期格式错误、`tags/categories` 写成字符串，或缺少 `description`。

### 文章 URL 日期变化

已发布文章的 `date` 决定 URL 年月日。更新文章只改 `updated`，不要改 `date` 或文件名。

### 线上没更新

依次确认本地构建、Pages 仓库推送和 GitHub Pages 发布状态。源仓库 Actions 若受账户状态影响，可继续使用本地 `deploy.sh` 的受控发布路径。
