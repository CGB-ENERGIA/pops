import { error } from '@sveltejs/kit';
import { findFileById, findParentFolder } from '$lib/pops';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const file = findFileById(params.id);
	if (!file) error(404, 'Arquivo não encontrado.');

	const parent = findParentFolder(file.slug);

	return { file, parentSlug: parent?.slug ?? [] };
};
