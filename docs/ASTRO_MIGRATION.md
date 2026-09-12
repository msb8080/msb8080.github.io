# Astro 站点结构

个人主页已迁移为 `src/pages/index.astro`，博客源码保留在 `blog-src/`，两者位于同一仓库并共享发布入口。

本地安装依赖后可执行：

```bash
npm install
npm --prefix blog-src install
npm run build:site
```

`build:site` 会先生成博客，再构建主页 Astro 页面；主页静态产物写回根目录，兼容当前 GitHub Pages 的 `master` 分支发布方式。
