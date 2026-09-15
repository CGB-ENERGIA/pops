import { error } from '@sveltejs/kit';
import { getFileMeta, getBreadcrumb, rootFolderId } from '$lib/server/drive';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const fileId = params.id;

	try {
		const meta = await getFileMeta(fileId);
		const parentId = meta.parents?.[0];
		const breadcrumb = parentId
			? await getBreadcrumb(parentId, rootFolderId())
			: [];

		return {
			file: {
				id: meta.id!,
				name: meta.name!,
				mimeType: meta.mimeType!
			},
			parentId,
			breadcrumb
		};
	} catch (e) {
		console.error(e);
		error(404, 'Não foi possível carregar este arquivo.');
	}
};
