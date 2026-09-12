# 站点统一仓库布局

个人主页与博客已整理到 `msb8080.github.io`：

- 根目录：个人主页源码
- `blog-src/`：Astro 博客源码、内容、配置与构建脚本
- `blog/`：博客静态构建产物，保持线上 `/blog/` URL

本地更新博客：

```bash
npm --prefix blog-src ci
npm run build:blog
npm run check
```

原 `Hexo-Blog` 仓库暂时保留作为历史备份，不再作为主发布入口。两个站点继续共享域名、导航和视觉规范。
