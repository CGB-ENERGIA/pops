<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let fileUrl = $derived(`/api/file/${data.file.id}`);
	let isPdf = $derived(data.file.mimeType === 'application/pdf');
	let backHref = $derived(data.parentId ? `/pasta/${data.parentId}` : '/');
</script>

<svelte:head>
	<title>{data.file.name} · CGB</title>
</svelte:head>

<nav class="breadcrumb" aria-label="Caminho do arquivo">
	{#each data.breadcrumb as crumb (crumb.id)}
		<a href={`/pasta/${crumb.id}`}>{crumb.name}</a>
		<span class="sep">/</span>
	{/each}
	<span class="current">{data.file.name}</span>
</nav>

<div class="toolbar">
	<a class="back" href={backHref}>← Voltar</a>
	<a class="download" href={fileUrl} download={data.file.name}>Baixar</a>
</div>

{#if isPdf}
	<div class="viewer">
		<iframe title={data.file.name} src={fileUrl}></iframe>
	</div>
{:else}
	<div class="unsupported">
		<p>Este tipo de arquivo não pode ser visualizado diretamente aqui.</p>
		<a class="download-btn" href={fileUrl} download={data.file.name}>Baixar arquivo</a>
	</div>
{/if}

<style>
	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--color-text-muted);
		margin-bottom: 10px;
	}

	.breadcrumb a {
		color: var(--color-primary);
	}

	.sep {
		opacity: 0.5;
	}

	.current {
		font-weight: 600;
		color: var(--color-text);
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.back {
		font-size: 14px;
		color: var(--color-primary);
		font-weight: 600;
	}

	.download {
		font-size: 13px;
		padding: 8px 14px;
		border-radius: 8px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
	}

	.viewer {
		width: 100%;
		height: calc(100vh - 190px);
		min-height: 480px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--color-surface);
	}

	.viewer iframe {
		width: 100%;
		height: 100%;
		border: 0;
	}

	.unsupported {
		text-align: center;
		padding: 60px 20px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.download-btn {
		display: inline-block;
		margin-top: 12px;
		padding: 10px 18px;
		border-radius: 8px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
	}
</style>
