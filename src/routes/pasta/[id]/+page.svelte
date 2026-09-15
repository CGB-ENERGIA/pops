<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let query = $state('');

	let filtered = $derived(
		query.trim()
			? data.items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
			: data.items
	);

	let folders = $derived(filtered.filter((i) => i.isFolder));
	let files = $derived(filtered.filter((i) => !i.isFolder));

	function formatSize(bytes?: string) {
		if (!bytes) return '';
		const n = Number(bytes);
		if (!n) return '';
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>{data.breadcrumb.at(-1)?.name ?? 'Procedimentos'} · CGB</title>
</svelte:head>

<nav class="breadcrumb" aria-label="Caminho da pasta">
	{#each data.breadcrumb as crumb, i (crumb.id)}
		{#if i > 0}<span class="sep">/</span>{/if}
		{#if i === data.breadcrumb.length - 1}
			<span class="current">{crumb.name}</span>
		{:else}
			<a href={`/pasta/${crumb.id}`}>{crumb.name}</a>
		{/if}
	{/each}
</nav>

<div class="search">
	<input type="search" placeholder="Buscar nesta pasta…" bind:value={query} />
</div>

{#if filtered.length === 0}
	<p class="empty">Nenhum item encontrado nesta pasta.</p>
{:else}
	<ul class="list">
		{#each folders as item (item.id)}
			<li>
				<a class="row" href={`/pasta/${item.id}`}>
					<span class="icon folder-icon" aria-hidden="true">📁</span>
					<span class="name">{item.name}</span>
					<span class="chevron" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
		{#each files as item (item.id)}
			<li>
				<a class="row" href={`/arquivo/${item.id}`}>
					<span class="icon file-icon" aria-hidden="true">📄</span>
					<span class="name">{item.name}</span>
					{#if item.size}<span class="meta">{formatSize(item.size)}</span>{/if}
					<span class="chevron" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--color-text-muted);
		margin-bottom: 14px;
	}

	.breadcrumb a {
		color: var(--color-primary);
	}

	.breadcrumb .current {
		color: var(--color-text);
		font-weight: 600;
	}

	.sep {
		opacity: 0.5;
	}

	.search {
		margin-bottom: 14px;
	}

	.search input {
		width: 100%;
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 15px;
		background: var(--color-surface);
	}

	.search input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
	}

	.empty {
		color: var(--color-text-muted);
		text-align: center;
		padding: 40px 0;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.list li + li {
		border-top: 1px solid var(--color-border);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 14px;
		min-height: 48px;
	}

	.row:active {
		background: var(--color-bg);
	}

	.icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.name {
		flex: 1;
		font-size: 15px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		font-size: 12px;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.chevron {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	@media (hover: hover) {
		.row:hover {
			background: var(--color-bg);
		}
	}
</style>
