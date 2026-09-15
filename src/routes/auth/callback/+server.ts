import { error } from '@sveltejs/kit';
import { completeLogin } from '$lib/server/msAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	if (!code) error(400, 'Código de autorização ausente.');

	const redirectUri = `${url.origin}/auth/callback`;

	try {
		await completeLogin(code, redirectUri);
	} catch (e) {
		console.error(e);
		error(500, 'Falha ao concluir o login com a Microsoft.');
	}

	return new Response(
		`<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Login concluído</title></head>
<body style="font-family: sans-serif; padding: 40px; text-align: center;">
	<h1>Login concluído ✅</h1>
	<p>O site já pode acessar a pasta de procedimentos. Pode fechar esta aba.</p>
	<p><a href="/">Ir para a página inicial</a></p>
</body>
</html>`,
		{ headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
};
