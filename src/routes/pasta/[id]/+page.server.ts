import { error } from '@sveltejs/kit';
import { listFolder, getBreadcrumb, rootFolderId } from '$lib/server/drive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const folderId = params.id;
	const rootId = rootFolderId();

	try {
		const [items, breadcrumb] = await Promise.all([
			listFolder(folderId),
			getBreadcrumb(folderId, rootId)
		]);

		return {
			folderId,
			rootId,
			items,
			breadcrumb
		};
	} catch (e) {
		console.error(e);
		error(404, 'Não foi possível carregar esta pasta. Verifique se ela existe e está compartilhada.');
	}
};
