import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE, postPath, sortPosts, sourceDateInstant, withBase } from '../lib/site';

export async function GET(context: { site?: URL }) {
  const posts = sortPosts(await getCollection('posts'));
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(withBase('/'), context.site ?? new URL('https://msb8080.github.io')),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: sourceDateInstant(post.data.date),
      link: withBase(postPath(post)),
      categories: post.data.tags,
      content: post.body
    })),
    customData: '<language>zh-CN</language>'
  });
}
