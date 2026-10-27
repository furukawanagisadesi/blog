const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export function isUpdatedAfterPublished(pubDate?: Date, updatedDate?: Date): boolean {
	if (!pubDate || !updatedDate) return false;
	return toDateKey(updatedDate) > toDateKey(pubDate);
}

/** 列表排序用的日期键：有更新的用更新日期，否则用发布日期。 */
export function activityDateKey(pubDate: Date, updatedDate?: Date): string {
	return isUpdatedAfterPublished(pubDate, updatedDate)
		? toDateKey(updatedDate!)
		: toDateKey(pubDate);
}
