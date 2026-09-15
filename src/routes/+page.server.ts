import { redirect } from '@sveltejs/kit';
import { getRoot } from '$lib/server/graph';

export async function load() {
	const root = await getRoot();
	redirect(307, `/pasta/${root.driveId}/${root.itemId}`);
}
