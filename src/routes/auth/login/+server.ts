import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getAuthCodeUrl } from '$lib/server/msAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const expected = env.AUTH_SETUP_SECRET;
	if (!expected) error(500, 'AUTH_SETUP_SECRET não configurado.');
	if (url.searchParams.get('secret') !== expected) {
		error(403, 'Segredo inválido.');
	}

	const redirectUri = `${url.origin}/auth/callback`;
	const authUrl = await getAuthCodeUrl(redirectUri);
	redirect(307, authUrl);
};
