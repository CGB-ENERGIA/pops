<script lang="ts">
	import type { PageData } from './$types';
	import {
		folderHref,
		fileHref,
		fileUrl,
		formatSize,
		countFiles,
		extLabel,
		extColor,
		categoryColor,
		initials,
		labelFiles,
		type FolderNode,
		type FileNode
	} from '$lib/pops';
	import OfficePreview from '$lib/OfficePreview.svelte';
	import PdfViewer from '$lib/PdfViewer.svelte';

	let { data }: { data: PageData } = $props();

	let node = $derived(data.node);
	let slug = $derived(data.slug as string[]);

	let query = $state('');

	let folder = $derived(node.type === 'folder' ? (node as FolderNode) : null);
	let file = $derived(node.type === 'file' ? (node as FileNode) : null);

	let subfolders = $derived(folder ? folder.children.filter((c) => c.type === 'folder') : []);
	let files = $derived(folder ? folder.children.filter((c) => c.type === 'file') : []);

	let filteredSubfolders = $derived(
		query.trim()
			? subfolders.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
			: subfolders
	);
	let filteredFiles = $derived(
		query.trim()
			? files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
			: files
	);

	let breadcrumb = $derived(
		slug.map((name, i) => ({ name, href: folderHref(slug.slice(0, i + 1)) }))
	);

	let fileLabels = $derived(labelFiles(filteredFiles));

	let fileHrefUrl = $derived(file ? fileUrl(file.slug) : '');
	let isPdf = $derived(file?.ext === 'pdf');
	let isOffice = $derived(
		file ? ['xlsx', 'xls', 'xlsm', 'xlsb', 'docx', 'doc'].includes(file.ext) : false
	);
</script>

<svelte:head>
	<title>{node.name} · Procedimentos CGB</title>
</svelte:head>

<nav class="breadcrumb" aria-label="Caminho">
	<a href="/">Início</a>
	{#each breadcrumb as crumb, i (crumb.href)}
		<span class="sep">/</span>
		{#if i === breadcrumb.length - 1}
			<span class="current">{crumb.name}</span>
		{:else}
			<a href={crumb.href}>{crumb.name}</a>
		{/if}
	{/each}
</nav>

{#if folder}
	<h1 class="title">{folder.name}</h1>

	<div class="search">
		<span class="search-icon" aria-hidden="true">⌕</span>
		<input type="search" placeholder="Buscar nesta pasta…" bind:value={query} />
	</div>

	{#if filteredSubfolders.length === 0 && filteredFiles.length === 0}
		<p class="empty">Nenhum item encontrado.</p>
	{:else}
		{#if filteredSubfolders.length > 0}
			<ul class="category-grid">
				{#each filteredSubfolders as sub (sub.slug.join('/'))}
					<li>
						<a
							class="category-card"
							href={folderHref(sub.slug)}
							style:--accent={categoryColor(sub.name)}
						>
							<span class="avatar">{initials(sub.name)}</span>
							<span class="category-text">
								<span class="category-name">{sub.name}</span>
								<span class="category-count">{countFiles(sub)} procedimento(s)</span>
							</span>
							<span class="chevron" aria-hidden="true">›</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if filteredFiles.length > 0}
			<ul class="file-list">
				{#each filteredFiles as f (f.slug.join('/'))}
					<li>
						<a class="file-row" href={fileHref(f.slug)} title={f.name}>
							<span class="ext-badge" style:background={extColor(f.ext)}>{extLabel(f.ext)}</span>
							<span class="file-name">{fileLabels.get(f)}</span>
							<span class="file-size">{formatSize(f.sizeBytes)}</span>
							<span class="chevron" aria-hidden="true">›</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
{:else if file}
	<div class="file-header">
		<span class="ext-badge large" style:background={extColor(file.ext)}>{extLabel(file.ext)}</span>
		<div class="file-header-text">
			<h1 class="title">{file.name}</h1>
			<span class="file-meta">{formatSize(file.sizeBytes)}</span>
		</div>
	</div>

	<div class="toolbar">
		<a class="download" href={fileHrefUrl} download={file.name}>⬇ Baixar</a>
		<a class="open-tab" href={fileHrefUrl} target="_blank" rel="noopener noreferrer">Abrir em nova aba ↗</a>
	</div>

	{#if isPdf}
		<PdfViewer url={fileHrefUrl} />
	{:else if isOffice}
		<div class="viewer office">
			<OfficePreview url={fileHrefUrl} ext={file.ext} />
		</div>
	{:else}
		<div class="unsupported">
			<p>Pré-visualização não disponível para arquivos {extLabel(file.ext)}.</p>
			<a class="download-btn" href={fileHrefUrl} download={file.name}>Baixar arquivo</a>
		</div>
	{/if}
{/if}

<style>
	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--color-text-muted);
		margin-bottom: 18px;
	}

	.breadcrumb a {
		color: var(--color-primary);
		font-weight: 500;
	}

	.breadcrumb .current {
		color: var(--color-text);
		font-weight: 600;
	}

	.sep {
		opacity: 0.4;
	}

	.title {
		font-size: 22px;
		margin: 0 0 16px;
		letter-spacing: -0.02em;
	}

	.search {
		position: relative;
		max-width: 480px;
		margin-bottom: 20px;
	}

	.search-icon {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%) rotate(-45deg);
		color: var(--color-text-muted);
		font-size: 16px;
		pointer-events: none;
	}

	.search input {
		width: 100%;
		padding: 13px 16px 13px 42px;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		font-size: 15px;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.search input:focus {
		outline: none;
		box-shadow:
			0 0 0 3px var(--color-primary-soft),
			var(--shadow-sm);
		border-color: var(--color-primary);
	}

	.empty {
		color: var(--color-text-muted);
		text-align: center;
		padding: 40px 0;
	}

	.category-grid {
		list-style: none;
		margin: 0 0 20px;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
		width: 42px;
		height: 42px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 13px;
		letter-spacing: -0.02em;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, white);
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
		font-size: 14.5px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.category-count {
		font-size: 12px;
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

	.ext-badge.large {
		font-size: 13px;
		padding: 9px 14px;
		border-radius: 10px;
	}

	.file-name {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
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

	.file-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 18px;
	}

	.file-header-text {
		flex: 1;
		min-width: 0;
	}

	.file-header .title {
		margin: 0 0 4px;
		word-break: break-word;
	}

	.file-meta {
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.toolbar {
		display: flex;
		gap: 10px;
		margin-bottom: 18px;
	}

	.download {
		font-size: 13.5px;
		padding: 10px 18px;
		border-radius: 999px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		box-shadow: var(--shadow-sm);
	}

	.open-tab {
		font-size: 13.5px;
		padding: 10px 18px;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 600;
	}

	.viewer {
		width: 100%;
		height: calc(100vh - 260px);
		min-height: 480px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.viewer.office {
		height: auto;
		overflow: auto;
	}

	.unsupported {
		text-align: center;
		padding: 60px 20px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
	}

	.download-btn {
		display: inline-block;
		margin-top: 14px;
		padding: 11px 20px;
		border-radius: 999px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
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
	}
</style>
