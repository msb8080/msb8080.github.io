import { getCollection } from 'astro:content';
import { formatDate, postPath, sortPosts, stripMarkdown, withBase } from '../lib/site';

export async function GET() {
  const posts = sortPosts(await getCollection('posts'));
  const documents = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    text: stripMarkdown(post.body).slice(0, 4000),
    tags: post.data.tags,
    date: formatDate(post.data.date),
    url: withBase(postPath(post))
  }));
  return new Response(JSON.stringify(documents), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
