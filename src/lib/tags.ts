import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * 把标签转成 URL slug：去空白、转小写、空格转连字符。
 * 例：`RouterOS` → `routeros`，`Home Lab` → `home-lab`
 */
export function slugifyTag(tag: string): string {
	return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export interface TagCount {
	tag: string;
	slug: string;
	count: number;
}

/**
 * 汇总所有文章的标签及篇数，按篇数降序、同篇数按标签名升序。
 */
export async function getAllTags(): Promise<TagCount[]> {
	const posts = await getCollection('blog');
	// 以 slug 为 key 聚合，避免大小写/空白变体（Docker vs docker）被拆成两条
	const counts = new Map<string, TagCount>();
	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			const slug = slugifyTag(tag);
			const existing = counts.get(slug);
			if (existing) {
				existing.count += 1;
			} else {
				counts.set(slug, { tag: tag.trim(), slug, count: 1 });
			}
		}
	}
	return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * 取某个标签（按 slug 匹配）下的文章，按发布日期降序。
 */
export async function getPostsByTag(slug: string): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getCollection('blog');
	return posts
		.filter((post) => (post.data.tags ?? []).some((tag) => slugifyTag(tag) === slug))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
