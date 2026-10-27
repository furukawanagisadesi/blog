import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { sortByRecentActivity } from '../lib/posts';

export async function GET(context) {
	const posts = sortByRecentActivity(await getCollection('blog'));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + post.id + '/',
		})),
	});
}
