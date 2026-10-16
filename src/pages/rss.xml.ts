import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getExcerpt, getPublishedPosts } from '../lib/posts';

export async function GET(context: APIContext): Promise<Response> {
  const posts = await getPublishedPosts();
  return rss({
    title: 'longlostforgotten',
    description: 'a place for ramblings, musings, fragmented thoughts, and other odds and ends.',
    site: context.site ?? 'https://longlostforgotten.com',
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: getExcerpt(post),
      link: `/posts/${post.id}/`,
      categories: post.data.tag,
    })),
  });
}
