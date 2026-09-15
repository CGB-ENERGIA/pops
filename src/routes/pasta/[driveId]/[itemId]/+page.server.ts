import { error } from '@sveltejs/kit';
import { listChildren, getBreadcrumb, getRoot } from '$lib/server/graph';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { driveId, itemId } = params;

	try {
		const root = await getRoot();
		const [items, breadcrumb] = await Promise.all([
			listChildren(driveId, itemId),
			getBreadcrumb(driveId, itemId, root.itemId)
		]);

		return { driveId, itemId, items, breadcrumb };
	} catch (e) {
		console.error(e);
		error(
			404,
			'Não foi possível carregar esta pasta. Verifique se o link ainda é válido e se a permissão de leitura está concedida.'
		);
	}
};
