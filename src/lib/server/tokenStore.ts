import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

const CACHE_KEY = 'msal:cache';

let redis: Redis | null = null;

function getRedis(): Redis {
	if (!redis) {
		const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
		const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
		if (!url || !token) {
			throw new Error(
				'Redis não configurado (KV_REST_API_URL / KV_REST_API_TOKEN). Necessário para guardar a sessão de login com a Microsoft.'
			);
		}
		redis = new Redis({ url, token });
	}
	return redis;
}

export async function loadCache(): Promise<string | null> {
	const value = await getRedis().get<string>(CACHE_KEY);
	return value ?? null;
}

export async function saveCache(serialized: string): Promise<void> {
	await getRedis().set(CACHE_KEY, serialized);
}

export async function clearCache(): Promise<void> {
	await getRedis().del(CACHE_KEY);
}
