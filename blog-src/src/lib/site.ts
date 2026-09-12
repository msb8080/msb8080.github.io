import type { CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'AI Composer 技术猿',
  shortTitle: 'AI Composer',
  description: '记录 AI 后端、Agent Harness、前沿模型与工程实践，持续沉淀可复用的方法和工具。',
  author: 'minshuaibo',
  pageSize: 10,
  github: 'https://github.com/msb8080'
} as const;

export type Post = CollectionEntry<'posts'>;

export function entrySlug(post: Post) {
  return post.id.replace(/\.md$/i, '').split('/').pop() ?? post.id;
}

export function postPath(post: Post) {
  const date = post.data.date;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `/${year}/${month}/${day}/${entrySlug(post)}/`;
}

export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function taxonomySlug(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function sourceDateIso(date: Date) {
  return `${date.toISOString().slice(0, 19)}+08:00`;
}

export function sourceDateInstant(date: Date) {
  return new Date(sourceDateIso(date));
}

export function readingMinutes(body = '') {
  const latinWords = body.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const hanChars = body.match(/[\p{Script=Han}]/gu)?.length ?? 0;
  return Math.max(1, Math.ceil((latinWords + hanChars / 2.5) / 220));
}

export function sortPosts(posts: Post[]): Post[] {
  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function countValues(posts: Post[], field: 'tags' | 'categories') {
  const counts = new Map<string, number>();
  posts.forEach((post) => {
    post.data[field].forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, slug: taxonomySlug(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function stripMarkdown(body = '') {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
