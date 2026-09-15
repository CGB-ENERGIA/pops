import { error } from '@sveltejs/kit';
import { Readable } from 'node:stream';
import { getFileMeta, getFileStream } from '$lib/server/drive';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const fileId = params.id;

	let meta;
	try {
		meta = await getFileMeta(fileId);
	} catch (e) {
		console.error(e);
		error(404, 'Arquivo não encontrado.');
	}

	try {
		const driveRes = await getFileStream(fileId);
		const nodeStream = driveRes.data as unknown as Readable;
		const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
		const safeName = (meta.name ?? 'arquivo').replace(/["\r\n]/g, '');

		return new Response(webStream, {
			headers: {
				'Content-Type': meta.mimeType ?? 'application/octet-stream',
				'Content-Disposition': `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
				'Cache-Control': 'private, max-age=300'
			}
		});
	} catch (e) {
		console.error(e);
		error(502, 'Não foi possível baixar o arquivo do Google Drive.');
	}
};
