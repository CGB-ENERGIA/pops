import { error } from '@sveltejs/kit';
import { getItemMeta, getFileContent } from '$lib/server/graph';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { driveId, itemId } = params;

	let meta;
	try {
		meta = await getItemMeta(driveId, itemId);
	} catch (e) {
		console.error(e);
		error(404, 'Arquivo não encontrado.');
	}

	try {
		const { body, contentType } = await getFileContent(driveId, itemId);
		const safeName = meta.name.replace(/["\r\n]/g, '');

		return new Response(body, {
			headers: {
				'Content-Type': contentType ?? meta.mimeType ?? 'application/octet-stream',
				'Content-Disposition': `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
				'Cache-Control': 'private, max-age=300'
			}
		});
	} catch (e) {
		console.error(e);
		error(502, 'Não foi possível baixar o arquivo do OneDrive/SharePoint.');
	}
};
