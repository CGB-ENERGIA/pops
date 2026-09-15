import { google, type drive_v3 } from 'googleapis';
import { env } from '$env/dynamic/private';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function getAuth() {
	const clientEmail = env.GOOGLE_CLIENT_EMAIL;
	const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

	if (!clientEmail || !privateKey) {
		throw new Error(
			'Credenciais do Google não configuradas (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY).'
		);
	}

	return new google.auth.JWT({
		email: clientEmail,
		key: privateKey,
		scopes: ['https://www.googleapis.com/auth/drive.readonly']
	});
}

function getDrive(): ReturnType<typeof google.drive> {
	return google.drive({ version: 'v3', auth: getAuth() });
}

export interface DriveItem {
	id: string;
	name: string;
	mimeType: string;
	isFolder: boolean;
	size?: string;
	modifiedTime?: string;
	iconLink?: string;
}

export function rootFolderId(): string {
	const id = env.GOOGLE_ROOT_FOLDER_ID;
	if (!id) throw new Error('GOOGLE_ROOT_FOLDER_ID não configurado.');
	return id;
}

// cache simples em memória (reduz chamadas repetidas à API do Drive entre navegações)
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

export async function getFileMeta(fileId: string) {
	return cached(`meta:${fileId}`, async () => {
		const drive = getDrive();
		const res = await drive.files.get({
			fileId,
			fields: 'id, name, mimeType, size, modifiedTime, parents'
		});
		return res.data;
	});
}

export async function listFolder(folderId: string): Promise<DriveItem[]> {
	return cached(`list:${folderId}`, async () => {
		const drive = getDrive();
		const items: DriveItem[] = [];
		let pageToken: string | undefined;

		do {
			const res = await drive.files.list({
				q: `'${folderId}' in parents and trashed = false`,
				fields:
					'nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink)',
				orderBy: 'folder,name_natural',
				pageSize: 200,
				pageToken
			});

			for (const f of res.data.files ?? []) {
				items.push({
					id: f.id!,
					name: f.name!,
					mimeType: f.mimeType!,
					isFolder: f.mimeType === FOLDER_MIME,
					size: f.size ?? undefined,
					modifiedTime: f.modifiedTime ?? undefined,
					iconLink: f.iconLink ?? undefined
				});
			}
			pageToken = res.data.nextPageToken ?? undefined;
		} while (pageToken);

		return items;
	});
}

export async function getBreadcrumb(
	folderId: string,
	rootId: string
): Promise<{ id: string; name: string }[]> {
	return cached<{ id: string; name: string }[]>(`breadcrumb:${folderId}`, async () => {
		const drive = getDrive();
		const trail: { id: string; name: string }[] = [];
		let currentId: string | undefined = folderId;
		let guard = 0;

		while (currentId && guard < 20) {
			guard++;
			const res: { data: drive_v3.Schema$File } = await drive.files.get({
				fileId: currentId,
				fields: 'id, name, parents'
			});
			trail.unshift({ id: res.data.id!, name: res.data.name! });
			if (currentId === rootId) break;
			currentId = res.data.parents?.[0];
		}

		return trail;
	});
}

export function getFileStream(fileId: string) {
	const drive = getDrive();
	return drive.files.get(
		{ fileId, alt: 'media' },
		{ responseType: 'stream' }
	);
}
