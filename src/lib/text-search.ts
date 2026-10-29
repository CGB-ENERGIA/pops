import { flattenFiles, type FlatFile } from './pops';

const _fileMap = new Map(flattenFiles().map((f) => [f.file.id, f]));

let _index: Record<string, string> | null = null;
let _loading = false;

export async function searchContent(q: string): Promise<FlatFile[]> {
	if (!_index) {
		if (_loading) return [];
		_loading = true;
		try {
			const res = await fetch('/text-index.json');
			_index = res.ok ? ((await res.json()) as Record<string, string>) : {};
		} catch {
			_index = {};
		} finally {
			_loading = false;
		}
	}

	const lower = q.toLowerCase().trim();
	if (!lower) return [];

	return Object.entries(_index)
		.filter(([, text]) => text.toLowerCase().includes(lower))
		.map(([id]) => _fileMap.get(id))
		.filter((f): f is FlatFile => f != null);
}
