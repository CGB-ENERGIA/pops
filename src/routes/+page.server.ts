import { redirect } from '@sveltejs/kit';
import { rootFolderId } from '$lib/server/drive';

export function load() {
	redirect(307, `/pasta/${rootFolderId()}`);
}
