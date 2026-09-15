import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),

			prerender: {
				handleHttpError: ({ path, message }) => {
					// falso positivo do crawler de prerender: nomes de arquivo com vírgula
					// (ex.: "34,5 kV.docx") fazem a checagem de link reportar 404 mesmo o
					// arquivo existindo e sendo servido normalmente em runtime.
					if (path.startsWith('/pops/')) {
						console.warn(`[prerender] ignorando link de arquivo estático: ${path}`);
						return;
					}
					throw new Error(message);
				}
			}
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			manifest: {
				name: 'Procedimentos Operacionais - CGB',
				short_name: 'POPs CGB',
				description: 'Consulta de procedimentos operacionais da CGB, com acesso offline.',
				theme_color: '#3730a3',
				background_color: '#f4f6fb',
				display: 'standalone',
				start_url: '/',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// os PDFs vão até ~8MB; o limite padrão do Workbox (2MB) bloquearia o build
				maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
				// pré-carrega só a casca do app (HTML/JS/CSS/ícones) no primeiro acesso
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
				navigateFallback: '/',
				runtimeCaching: [
					{
						// arquivos dos procedimentos: ficam disponíveis offline assim que
						// abertos uma vez, e se atualizam sozinhos quando há internet
						urlPattern: ({ url }) => url.pathname.startsWith('/pops/'),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'pops-files',
							expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 180 },
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
