<script lang="ts">
	import { browser } from '$app/environment';
	import {
		root,
		folderHref,
		fileHref,
		countFiles,
		flattenFiles,
		formatSize,
		extLabel,
		extColor,
		categoryColor,
		initials,
		labelFiles,
		matchesQuery,
		type FolderNode,
		type FileNode,
		type FlatFile
	} from '$lib/pops';
	import { getRecents, getFavorites } from '$lib/history';

	const categories = root.children.filter((c) => c.type === 'folder') as FolderNode[];
	const rootFiles = root.children.filter((c) => c.type === 'file') as FileNode[];
	const rootFileLabels = labelFiles(rootFiles);
	const allFiles = flattenFiles();
	const totalFiles = allFiles.length;
	const fileMap = new Map(allFiles.map((f) => [f.file.id, f]));

	let query = $state('');
	let activeExt = $state<string | null>(null);
	let activeCat = $state<string | null>(null);

	let recentIds = $state<string[]>([]);
	let favoriteIds = $state<string[]>([]);

	$effect(() => {
		if (browser) {
			recentIds = getRecents();
			favoriteIds = getFavorites();
		}
	});

	let favoriteFiles = $derived(
		favoriteIds.map((id) => fileMap.get(id)).filter((x): x is FlatFile => x != null)
	);
	let recentFiles = $derived(
		recentIds
			.filter((id) => !favoriteIds.includes(id))
			.map((id) => fileMap.get(id))
			.filter((x): x is FlatFile => x != null)
			.slice(0, 5)
	);

	let favoriteLabels = $derived(labelFiles(favoriteFiles.map((f) => f.file)));
	let recentLabels = $derived(labelFiles(recentFiles.map((f) => f.file)));

	let rawResults = $derived(
		query.trim().length > 1
			? allFiles.filter(({ file }) => matchesQuery(file, query.trim()))
			: []
	);

	let availableExts = $derived([...new Set(rawResults.map((r) => r.file.ext))]);
	let availableCats = $derived([...new Set(rawResults.map((r) => r.parentSlug[0]).filter(Boolean))]);

	let results = $derived(
		rawResults.filter(({ file, parentSlug }) => {
			if (activeExt && file.ext !== activeExt) return false;
			if (activeCat && (parentSlug[0] ?? '') !== activeCat) return false;
			return true;
		})
	);

	let resultLabels = $derived(labelFiles(results.map((r) => r.file)));
</script>

<svelte:head>
	<title>Procedimentos Operacionais · CGB</title>
</svelte:head>

<section class="hero">
	<h1>Encontre um procedimento</h1>
	<p class="hero-sub">
		{totalFiles} procedimentos organizados em {categories.length} categorias — busque pelo nome ou
		navegue por pasta.
	</p>

	<div class="search">
		<span class="search-icon" aria-hidden="true">⌕</span>
		<input type="search" placeholder="Buscar um procedimento…" bind:value={query} />
	</div>
</section>

{#if query.trim().length > 1}
	{#if availableCats.length > 1 || availableExts.length > 1}
		<div class="filters">
			{#if availableCats.length > 1}
				<div class="filter-group">
					{#each availableCats as cat (cat)}
						<button
							type="button"
							class="filter-chip"
							class:active={activeCat === cat}
							onclick={() => (activeCat = activeCat === cat ? null : cat)}
						>{cat}</button>
					{/each}
				</div>
			{/if}
			{#if availableExts.length > 1}
				<div class="filter-group">
					{#each availableExts as ext (ext)}
						<button
							type="button"
							class="filter-chip"
							class:active={activeExt === ext}
							onclick={() => (activeExt = activeExt === ext ? null : ext)}
						>{extLabel(ext)}</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if results.length === 0}
		<p class="empty">Nenhum procedimento encontrado para "{query}".</p>
	{:else}
		<p class="results-count">{results.length} resultado(s)</p>
		<ul class="file-list">
			{#each results as { file, parentSlug } (file.id)}
				<li>
					<a class="file-row" href={fileHref(file)} title={file.name}>
						<span class="ext-badge" style:background={extColor(file.ext)}>{extLabel(file.ext)}</span>
						<span class="file-text">
							<span class="file-name">{resultLabels.get(file)}</span>
							<span class="file-path">{parentSlug.join(' / ') || 'Raiz'}</span>
						</span>
						<span class="file-size">{formatSize(file.sizeBytes)}</span>
						<span class="chevron" aria-hidden="true">›</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	{#if favoriteFiles.length > 0}
		<h2 class="section-title">Favoritos</h2>
		<ul class="file-list quick-list">
			{#each favoriteFiles as { file, parentSlug } (file.id)}
				<li>
					<a class="file-row" href={fileHref(file)} title={file.name}>
						<span class="ext-badge" style:background={extColor(file.ext)}>{extLabel(file.ext)}</span>
						<span class="file-text">
							<span class="file-name">{favoriteLabels.get(file)}</span>
							<span class="file-path">{parentSlug.join(' / ') || 'Raiz'}</span>
						</span>
						<span class="file-size">{formatSize(file.sizeBytes)}</span>
						<span class="chevron" aria-hidden="true">›</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if recentFiles.length > 0}
		<h2 class="section-title">Recentes</h2>
		<ul class="file-list quick-list">
			{#each recentFiles as { file, parentSlug } (file.id)}
				<li>
					<a class="file-row" href={fileHref(file)} title={file.name}>
						<span class="ext-badge" style:background={extColor(file.ext)}>{extLabel(file.ext)}</span>
						<span class="file-text">
							<span class="file-name">{recentLabels.get(file)}</span>
							<span class="file-path">{parentSlug.join(' / ') || 'Raiz'}</span>
						</span>
						<span class="file-size">{formatSize(file.sizeBytes)}</span>
						<span class="chevron" aria-hidden="true">›</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<h2 class="section-title">Categorias</h2>
	<ul class="category-grid">
		{#each categories as cat (cat.slug.join('/'))}
			<li>
				<a class="category-card" href={folderHref(cat.slug)} style:--accent={categoryColor(cat.name)}>
					<span class="avatar">{initials(cat.name)}</span>
					<span class="category-text">
						<span class="category-name">{cat.name}</span>
						<span class="category-count">{countFiles(cat)} procedimento(s)</span>
					</span>
					<span class="chevron" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if rootFiles.length > 0}
		<h2 class="section-title">Outros arquivos</h2>
		<ul class="file-list">
			{#each rootFiles as f (f.id)}
				<li>
					<a class="file-row" href={fileHref(f)} title={f.name}>
						<span class="ext-badge" style:background={extColor(f.ext)}>{extLabel(f.ext)}</span>
						<span class="file-name">{rootFileLabels.get(f)}</span>
						<span class="file-size">{formatSize(f.sizeBytes)}</span>
						<span class="chevron" aria-hidden="true">›</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.hero {
		margin-bottom: 32px;
	}

	.hero h1 {
		font-size: 26px;
		letter-spacing: -0.02em;
		margin: 0 0 6px;
	}

	.hero-sub {
		color: var(--color-text-muted);
		font-size: 14.5px;
		margin: 0 0 20px;
	}

	.search {
		position: relative;
		max-width: 520px;
	}

	.search-icon {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%) rotate(-45deg);
		color: var(--color-text-muted);
		font-size: 17px;
		pointer-events: none;
	}

	.search input {
		width: 100%;
		padding: 14px 16px 14px 42px;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		font-size: 15.5px;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		transition: box-shadow 0.15s ease;
	}

	.search input:focus {
		outline: none;
		box-shadow:
			0 0 0 3px var(--color-primary-soft),
			var(--shadow-sm);
		border-color: var(--color-primary);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 14px;
	}

	.filter-group {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.filter-chip {
		padding: 5px 13px;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		color: var(--color-text);
		transition: background 0.1s, border-color 0.1s, color 0.1s;
	}

	.filter-chip.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.empty {
		color: var(--color-text-muted);
		text-align: center;
		padding: 40px 0;
	}

	.results-count {
		font-size: 12.5px;
		color: var(--color-text-muted);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 10px;
	}

	.section-title {
		font-size: 12.5px;
		color: var(--color-text-muted);
		margin: 0 0 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.category-grid {
		list-style: none;
		margin: 0 0 32px;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 12px;
	}

	.category-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}

	.avatar {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 14px;
		letter-spacing: -0.02em;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, var(--color-surface));
	}

	.category-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.category-name {
		font-weight: 700;
		font-size: 15px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.category-count {
		font-size: 12.5px;
		color: var(--color-text-muted);
	}

	.file-list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.quick-list {
		margin-bottom: 24px;
	}

	.file-list li + li {
		border-top: 1px solid var(--color-border);
	}

	.file-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		min-height: 48px;
	}

	.ext-badge {
		flex-shrink: 0;
		color: #fff;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.03em;
		padding: 4px 9px;
		border-radius: 999px;
	}

	.file-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.file-name {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-path {
		font-size: 11.5px;
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-size {
		font-size: 12.5px;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.chevron {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	@media (hover: hover) {
		.category-card:hover {
			transform: translateY(-2px);
			box-shadow: var(--shadow-md);
			border-color: color-mix(in srgb, var(--accent) 35%, var(--color-border));
		}

		.file-row:hover {
			background: var(--color-surface-muted);
		}

		.filter-chip:not(.active):hover {
			background: var(--color-surface-muted);
		}
	}
</style>
