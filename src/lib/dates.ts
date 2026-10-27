const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export function isUpdatedAfterPublished(pubDate?: Date, updatedDate?: Date): boolean {
	if (!pubDate || !updatedDate) return false;
	return toDateKey(updatedDate) > toDateKey(pubDate);
}
