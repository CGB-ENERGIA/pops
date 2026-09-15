<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/app-icon.svg';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch((err) => {
				console.error('Falha ao registrar service worker:', err);
			});
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</svelte:head>

<header class="app-header">
	<div class="app-header-inner">
		<a href="/" class="mark" aria-hidden="true">CGB</a>
		<a href="/" class="brand-text">
			<span class="brand-name">Procedimentos Operacionais</span>
			<span class="brand-sub">Consulta rápida de POPs</span>
		</a>
	</div>
</header>

<main>
	{@render children()}
</main>
