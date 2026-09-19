<script lang="ts">
	import type { PageData } from './$types';
	import { folderHref, fileUrl, formatSize, extLabel, extColor } from '$lib/pops';
	import { addRecent, isFavorite, toggleFavorite } from '$lib/history';
	import { browser } from '$app/environment';
	import OfficePreview from '$lib/OfficePreview.svelte';
	import PdfViewer from '$lib/PdfViewer.svelte';

	let { data }: { data: PageData } = $props();

	let file = $derived(data.file);
	let parentSlug = $derived(data.parentSlug as string[]);

	let breadcrumb = $derived(
		parentSlug.map((name, i) => ({ name, href: folderHref(parentSlug.slice(0, i + 1)) }))
	);

	let fileHrefUrl = $derived(fileUrl(file));
	let isPdf = $derived(file.ext === 'pdf');
	let isOffice = $derived(['xlsx', 'xls', 'xlsm', 'xlsb', 'docx', 'doc'].includes(file.ext));
	let backHref = $derived(parentSlug.length ? folderHref(parentSlug) : '/');

	let favorited = $state(false);

	$effect(() => {
		if (browser) {
			addRecent(file.id);
			favorited = isFavorite(file.id);
		}
	});

	function toggleFav() {
		favorited = toggleFavorite(file.id);
	}
</script>

<svelte:head>
	<title>{file.name} · Procedimentos CGB</title>
</svelte:head>

<nav class="breadcrumb" aria-label="Caminho">
	<a href="/">Início</a>
	{#each breadcrumb as crumb (crumb.href)}
		<span class="sep">/</span>
		<a href={crumb.href}>{crumb.name}</a>
	{/each}
	<span class="sep">/</span>
	<span class="current">{file.name}</span>
</nav>

<div class="file-header">
	<span class="ext-badge large" style:background={extColor(file.ext)}>{extLabel(file.ext)}</span>
	<div class="file-header-text">
		<h1 class="title">{file.name}</h1>
		<span class="file-meta">{formatSize(file.sizeBytes)}</span>
	</div>
</div>

<div class="toolbar">
	<a class="back" href={backHref}>← Voltar</a>
	<button type="button" class="fav-btn" class:favorited onclick={toggleFav}>
		{favorited ? '★' : '☆'} {favorited ? 'Favoritado' : 'Favoritar'}
	</button>
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

	.current {
		color: var(--color-text);
		font-weight: 600;
	}

	.sep {
		opacity: 0.4;
	}

	.title {
		font-size: 22px;
		margin: 0 0 4px;
		letter-spacing: -0.02em;
		word-break: break-word;
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

	.file-meta {
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.ext-badge.large {
		flex-shrink: 0;
		color: #fff;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.03em;
		padding: 9px 14px;
		border-radius: 10px;
	}

	.toolbar {
		display: flex;
		gap: 10px;
		margin-bottom: 18px;
		flex-wrap: wrap;
	}

	.back {
		font-size: 13.5px;
		padding: 10px 6px;
		color: var(--color-primary);
		font-weight: 600;
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

	.fav-btn {
		font-size: 13.5px;
		padding: 10px 18px;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.fav-btn.favorited {
		background: #fef3c7;
		border-color: #d97706;
		color: #92400e;
	}

	.viewer.office {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: auto;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
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
</style>
