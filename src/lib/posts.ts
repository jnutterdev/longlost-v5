import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Photo = CollectionEntry<'photos'>;
export type CardVariant = 'featured' | 'image' | 'standard';

const byDateDesc = (a: { data: { date: string } }, b: { data: { date: string } }): number =>
  new Date(b.data.date).getTime() - new Date(a.data.date).getTime();

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', post => !post.data.draft);
  return posts.sort(byDateDesc);
}

export async function getPublishedPhotos(): Promise<Photo[]> {
  const photos = await getCollection('photos', photo => !photo.data.draft);
  return photos.sort(byDateDesc);
}

export function getCardVariant(post: Post): CardVariant {
  if (post.data.featured) return 'featured';
  if (post.data.image) return 'image';
  return 'standard';
}

export function getAllTags(posts: Post[]): string[] {
  const bySlug = new Map<string, string>();
  for (const tag of posts.flatMap(post => post.data.tag)) {
    if (!bySlug.has(tagSlug(tag))) bySlug.set(tagSlug(tag), tag);
  }
  return [...bySlug.values()].sort((a, b) => a.localeCompare(b));
}

export function tagSlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function groupByYear<T extends { data: { date: string } }>(entries: T[]): [number, T[]][] {
  const groups = new Map<number, T[]>();
  for (const entry of entries) {
    const year = new Date(entry.data.date).getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a);
}

export function getExcerpt(post: Post, maxLength = 220): string {
  if (post.data.excerpt) return post.data.excerpt.trim();
  const plain = (post.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}...` : plain;
}
