import { error } from '@sveltejs/kit';
import { getItemMeta, getParent, getBreadcrumb, getRoot } from '$lib/server/graph';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { driveId, itemId } = params;

	try {
		const [meta, parent, root] = await Promise.all([
			getItemMeta(driveId, itemId),
			getParent(driveId, itemId),
			getRoot()
		]);

		const breadcrumb = parent
			? await getBreadcrumb(parent.driveId, parent.itemId, root.itemId)
			: [];

		return {
			file: { driveId, itemId, name: meta.name, mimeType: meta.mimeType },
			parent,
			breadcrumb
		};
	} catch (e) {
		console.error(e);
		error(404, 'Não foi possível carregar este arquivo.');
	}
};
