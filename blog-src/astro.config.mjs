import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://msb8080.github.io',
  base: '/blog',
  publicDir: './static',
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: 'assets'
  },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});
