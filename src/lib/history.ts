const RECENTS_KEY = 'cgb_pops_recents';
const FAVORITES_KEY = 'cgb_pops_favorites';
const MAX_RECENTS = 10;

function safeGet(key: string): string[] {
	try {
		return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
	} catch {
		return [];
	}
}

function safeSet(key: string, val: string[]): void {
	try {
		localStorage.setItem(key, JSON.stringify(val));
	} catch { /* private/storage-full */ }
}

export function addRecent(id: string): void {
	const items = safeGet(RECENTS_KEY).filter((x) => x !== id);
	items.unshift(id);
	safeSet(RECENTS_KEY, items.slice(0, MAX_RECENTS));
}

export function getRecents(): string[] {
	return safeGet(RECENTS_KEY);
}

export function getFavorites(): string[] {
	return safeGet(FAVORITES_KEY);
}

export function isFavorite(id: string): boolean {
	return safeGet(FAVORITES_KEY).includes(id);
}

export function toggleFavorite(id: string): boolean {
	const favs = safeGet(FAVORITES_KEY);
	const idx = favs.indexOf(id);
	if (idx >= 0) {
		favs.splice(idx, 1);
		safeSet(FAVORITES_KEY, favs);
		return false;
	}
	favs.unshift(id);
	safeSet(FAVORITES_KEY, favs);
	return true;
}
