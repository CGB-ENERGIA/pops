import { error } from '@sveltejs/kit';
import { findNode } from '$lib/pops';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const slug = params.slug ? params.slug.split('/') : [];
	const node = findNode(slug);

	if (!node || node.type !== 'folder') error(404, 'Pasta não encontrada.');

	return { folder: node, slug };
};
