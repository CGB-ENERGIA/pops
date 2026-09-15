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
	<a href="/" class="brand">
		Procedimentos Operacionais
		<small>CGB</small>
	</a>
</header>

<main>
	{@render children()}
</main>
