import type { CollectionEntry } from 'astro:content';
import { activityDateKey } from './dates';

/**
 * 按「最近活动」排序：取 updatedDate（晚于 pubDate 时）或 pubDate 的日期键降序；
 * 同一天按发布日期降序，再按文章 id 升序，保证构建间顺序稳定。
 */
export function sortByRecentActivity(
	posts: CollectionEntry<'blog'>[],
): CollectionEntry<'blog'>[] {
	return [...posts].sort((a, b) => {
		const keyDiff =
			activityDateKey(b.data.pubDate, b.data.updatedDate).localeCompare(
				activityDateKey(a.data.pubDate, a.data.updatedDate),
			);
		if (keyDiff !== 0) return keyDiff;
		const pubDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
		if (pubDiff !== 0) return pubDiff;
		return a.id.localeCompare(b.id);
	});
}
