import { ConfidentialClientApplication, type Configuration } from '@azure/msal-node';
import { env } from '$env/dynamic/private';
import { loadCache, saveCache } from './tokenStore';

const SCOPES = ['https://graph.microsoft.com/Files.Read.All'];

function requiredEnv(name: string): string {
	const value = (env as Record<string, string | undefined>)[name];
	if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
	return value;
}

let cca: ConfidentialClientApplication | null = null;

function getClient(): ConfidentialClientApplication {
	if (cca) return cca;

	const config: Configuration = {
		auth: {
			clientId: requiredEnv('MS_CLIENT_ID'),
			authority: `https://login.microsoftonline.com/${requiredEnv('MS_TENANT_ID')}`,
			clientSecret: requiredEnv('MS_CLIENT_SECRET')
		},
		cache: {
			cachePlugin: {
				beforeCacheAccess: async (context) => {
					const data = await loadCache();
					if (data) context.tokenCache.deserialize(data);
				},
				afterCacheAccess: async (context) => {
					if (context.cacheHasChanged) {
						await saveCache(context.tokenCache.serialize());
					}
				}
			}
		}
	};

	cca = new ConfidentialClientApplication(config);
	return cca;
}

export function getAuthCodeUrl(redirectUri: string): Promise<string> {
	return getClient().getAuthCodeUrl({
		scopes: SCOPES,
		redirectUri
	});
}

export async function completeLogin(code: string, redirectUri: string): Promise<void> {
	await getClient().acquireTokenByCode({
		code,
		scopes: SCOPES,
		redirectUri
	});
}

export async function getDelegatedAccessToken(): Promise<string> {
	const client = getClient();
	const accounts = await client.getTokenCache().getAllAccounts();

	if (accounts.length === 0) {
		throw new Error(
			'Nenhuma sessão da Microsoft encontrada. É necessário fazer login uma vez em /auth/login.'
		);
	}

	const result = await client.acquireTokenSilent({
		account: accounts[0],
		scopes: SCOPES
	});

	if (!result?.accessToken) {
		throw new Error('Não foi possível renovar o acesso à Microsoft. Refaça o login em /auth/login.');
	}

	return result.accessToken;
}
