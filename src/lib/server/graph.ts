import { env } from '$env/dynamic/private';
import { getDelegatedAccessToken } from './msAuth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export interface GraphItem {
	id: string;
	name: string;
	isFolder: boolean;
	mimeType?: string;
	size?: number;
	lastModifiedDateTime?: string;
}

export interface RootRef {
	driveId: string;
	itemId: string;
}

function requiredEnv(name: string): string {
	const value = (env as Record<string, string | undefined>)[name];
	if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
	return value;
}

async function graphFetch(path: string, init?: RequestInit): Promise<Response> {
	const token = await getDelegatedAccessToken();
	const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`;
	const res = await fetch(url, {
		...init,
		headers: {
			...init?.headers,
			Authorization: `Bearer ${token}`
		}
	});
	if (!res.ok) {
		throw new Error(`Graph API ${res.status} em ${path}: ${await res.text()}`);
	}
	return res;
}

// --- cache simples em memória ----------------------------------------------

const cache = new Map<string, { value: unknown; expires: number }>();
const TTL_MS = 60_000;

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
	const hit = cache.get(key);
	if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
	return fn().then((value) => {
		cache.set(key, { value, expires: Date.now() + TTL_MS });
		return value;
	});
}

// --- resolução do link compartilhado em (driveId, itemId) ------------------

function encodeShareUrl(shareUrl: string): string {
	const base64 = Buffer.from(shareUrl, 'utf-8')
		.toString('base64')
		.replace(/=+$/, '')
		.replace(/\//g, '_')
		.replace(/\+/g, '-');
	return `u!${base64}`;
}

export async function getRoot(): Promise<RootRef> {
	return cached('root', async () => {
		const shareUrl = requiredEnv('MS_SHARE_URL');
		const shareId = encodeShareUrl(shareUrl);
		const res = await graphFetch(`/shares/${shareId}/driveItem?$select=id,parentReference`);
		const data = (await res.json()) as { id: string; parentReference: { driveId: string } };
		return { driveId: data.parentReference.driveId, itemId: data.id };
	});
}

// --- itens (pastas/arquivos) ------------------------------------------------

interface GraphDriveItemApi {
	id: string;
	name: string;
	size?: number;
	lastModifiedDateTime?: string;
	folder?: unknown;
	file?: { mimeType?: string };
	parentReference?: { id?: string; driveId?: string };
}

function toItem(raw: GraphDriveItemApi): GraphItem {
	return {
		id: raw.id,
		name: raw.name,
		isFolder: Boolean(raw.folder),
		mimeType: raw.file?.mimeType,
		size: raw.size,
		lastModifiedDateTime: raw.lastModifiedDateTime
	};
}

export async function getItemMeta(driveId: string, itemId: string): Promise<GraphItem> {
	return cached(`meta:${driveId}:${itemId}`, async () => {
		const res = await graphFetch(
			`/drives/${driveId}/items/${itemId}?$select=id,name,size,lastModifiedDateTime,folder,file,parentReference`
		);
		return toItem((await res.json()) as GraphDriveItemApi);
	});
}

export async function getParent(
	driveId: string,
	itemId: string
): Promise<{ driveId: string; itemId: string } | null> {
	const res = await graphFetch(`/drives/${driveId}/items/${itemId}?$select=parentReference`);
	const data = (await res.json()) as { parentReference?: { id?: string; driveId?: string } };
	if (!data.parentReference?.id) return null;
	return { driveId: data.parentReference.driveId ?? driveId, itemId: data.parentReference.id };
}

export async function listChildren(driveId: string, itemId: string): Promise<GraphItem[]> {
	return cached(`list:${driveId}:${itemId}`, async () => {
		const items: GraphItem[] = [];
		let url: string | undefined =
			`/drives/${driveId}/items/${itemId}/children?$select=id,name,size,lastModifiedDateTime,folder,file&$top=200`;

		while (url) {
			const res: Response = await graphFetch(url);
			const data = (await res.json()) as { value: GraphDriveItemApi[]; '@odata.nextLink'?: string };
			items.push(...data.value.map(toItem));
			url = data['@odata.nextLink'];
		}

		items.sort((a, b) => {
			if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
			return a.name.localeCompare(b.name, 'pt-BR');
		});

		return items;
	});
}

export async function getBreadcrumb(
	driveId: string,
	itemId: string,
	rootItemId: string
): Promise<{ driveId: string; itemId: string; name: string }[]> {
	return cached<{ driveId: string; itemId: string; name: string }[]>(
		`breadcrumb:${driveId}:${itemId}`,
		async () => {
			const trail: { driveId: string; itemId: string; name: string }[] = [];
			let currentDriveId = driveId;
			let currentItemId: string | undefined = itemId;
			let guard = 0;

			while (currentItemId && guard < 20) {
				guard++;
				const res = await graphFetch(
					`/drives/${currentDriveId}/items/${currentItemId}?$select=id,name,parentReference`
				);
				const data = (await res.json()) as {
					id: string;
					name: string;
					parentReference?: { id?: string; driveId?: string };
				};
				trail.unshift({ driveId: currentDriveId, itemId: data.id, name: data.name });
				if (currentItemId === rootItemId) break;
				currentItemId = data.parentReference?.id;
				currentDriveId = data.parentReference?.driveId ?? currentDriveId;
			}

			return trail;
		}
	);
}

export async function getFileContent(
	driveId: string,
	itemId: string
): Promise<{ body: ReadableStream; contentType: string | null }> {
	const token = await getDelegatedAccessToken();
	const res = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${itemId}/content`, {
		headers: { Authorization: `Bearer ${token}` },
		redirect: 'follow'
	});

	if (!res.ok || !res.body) {
		throw new Error(`Falha ao baixar arquivo do Graph: ${res.status}`);
	}

	return { body: res.body, contentType: res.headers.get('content-type') };
}
