<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
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
