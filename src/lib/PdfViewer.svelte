<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

	let { url }: { url: string } = $props();

	let containerEl: HTMLDivElement;
	let viewerEl: HTMLDivElement;

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let query = $state('');
	let matchCurrent = $state(0);
	let matchTotal = $state(0);
	let searching = $state(false);
	let currentPage = $state(1);
	let totalPages = $state(0);
	let zoomPct = $state(100);

	// instâncias do pdf.js guardadas fora do estado reativo do Svelte
	let eventBus: import('pdfjs-dist/web/pdf_viewer.mjs').EventBus | undefined;
	let findController: import('pdfjs-dist/web/pdf_viewer.mjs').PDFFindController | undefined;
	let pdfViewer: import('pdfjs-dist/web/pdf_viewer.mjs').PDFViewer | undefined;
	let searchTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		let cancelled = false;

		(async () => {
			await import('pdfjs-dist/web/pdf_viewer.css');
			const pdfjsLib = await import('pdfjs-dist');
			const { EventBus, PDFLinkService, PDFFindController, PDFViewer } = await import(
				'pdfjs-dist/web/pdf_viewer.mjs'
			);

			pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

			if (cancelled) return;

			eventBus = new EventBus();
			const linkService = new PDFLinkService({ eventBus });
			findController = new PDFFindController({ eventBus, linkService });

			pdfViewer = new PDFViewer({
				container: containerEl,
				viewer: viewerEl,
				eventBus,
				linkService,
				findController
			});
			linkService.setViewer(pdfViewer);

			eventBus.on('pagesinit', () => {
				if (!pdfViewer) return;
				pdfViewer.currentScaleValue = 'page-width';
				status = 'ready';
			});

			eventBus.on('pagechanging', (evt: { pageNumber: number }) => {
				currentPage = evt.pageNumber;
			});

			eventBus.on('scalechanging', (evt: { scale: number }) => {
				zoomPct = Math.round(evt.scale * 100);
			});

			eventBus.on('updatefindmatchescount', (evt: { matchesCount: { current: number; total: number } }) => {
				matchCurrent = evt.matchesCount.current;
				matchTotal = evt.matchesCount.total;
				searching = false;
			});

			eventBus.on('updatefindcontrolstate', () => {
				searching = false;
			});

			try {
				const loadingTask = pdfjsLib.getDocument({ url });
				const pdfDocument = await loadingTask.promise;
				if (cancelled) return;
				totalPages = pdfDocument.numPages;
				pdfViewer.setDocument(pdfDocument);
				linkService.setDocument(pdfDocument);
			} catch (e) {
				console.error(e);
				status = 'error';
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		clearTimeout(searchTimer);
	});

	function dispatchFind(type: '' | 'again', findPrevious = false) {
		if (!eventBus) return;
		searching = true;
		eventBus.dispatch('find', {
			source: {},
			type,
			query,
			caseSensitive: false,
			entireWord: false,
			highlightAll: true,
			findPrevious,
			matchDiacritics: false
		});
	}

	function onSearchInput() {
		clearTimeout(searchTimer);
		if (!query.trim()) {
			matchCurrent = 0;
			matchTotal = 0;
			return;
		}
		searchTimer = setTimeout(() => dispatchFind(''), 250);
	}

	function next() {
		if (query.trim()) dispatchFind('again', false);
	}

	function prev() {
		if (query.trim()) dispatchFind('again', true);
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			e.shiftKey ? prev() : next();
		}
	}

	function zoomIn() {
		if (!pdfViewer) return;
		pdfViewer.currentScale = Math.min(pdfViewer.currentScale * 1.25, 5);
	}

	function zoomOut() {
		if (!pdfViewer) return;
		pdfViewer.currentScale = Math.max(pdfViewer.currentScale / 1.25, 0.25);
	}

	function goToPage(n: number) {
		if (!pdfViewer || !totalPages) return;
		pdfViewer.currentPageNumber = Math.max(1, Math.min(Math.round(n), totalPages));
	}

	function onPageInput(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		if (!isNaN(val)) goToPage(val);
	}
</script>

<div class="pdf-toolbar">
	<div class="search-box">
		<span class="icon" aria-hidden="true">⌕</span>
		<input
			type="search"
			placeholder="Buscar no texto do documento…"
			bind:value={query}
			oninput={onSearchInput}
			onkeydown={onSearchKeydown}
		/>
	</div>
	{#if query.trim()}
		<span class="match-count">
			{#if searching}
				buscando…
			{:else if matchTotal === 0}
				0 resultados
			{:else}
				{matchCurrent} / {matchTotal}
			{/if}
		</span>
		<button type="button" onclick={prev} disabled={matchTotal === 0} aria-label="Resultado anterior"
			>‹</button
		>
		<button type="button" onclick={next} disabled={matchTotal === 0} aria-label="Próximo resultado"
			>›</button
		>
	{/if}
</div>

{#if status === 'ready'}
<div class="pdf-toolbar pdf-toolbar-nav">
	<button type="button" onclick={zoomOut} aria-label="Diminuir zoom">−</button>
	<span class="zoom-pct">{zoomPct}%</span>
	<button type="button" onclick={zoomIn} aria-label="Aumentar zoom">+</button>
	{#if totalPages > 1}
		<span class="nav-sep">|</span>
		<span class="page-label">Pág.</span>
		<input
			type="number"
			class="page-input"
			min="1"
			max={totalPages}
			value={currentPage}
			onchange={onPageInput}
			aria-label="Número da página"
		/>
		<span class="page-total">de {totalPages}</span>
	{/if}
</div>
{/if}

<div class="pdf-shell">
	{#if status === 'loading'}
		<div class="preview-status">Carregando documento…</div>
	{:else if status === 'error'}
		<div class="preview-status">Não foi possível carregar o PDF.</div>
	{/if}
	<div class="pdf-container" bind:this={containerEl} class:hidden={status !== 'ready'}>
		<div class="pdfViewer" bind:this={viewerEl}></div>
	</div>
</div>

<style>
	.pdf-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}

	.search-box {
		position: relative;
		flex: 1;
		min-width: 200px;
	}

	.search-box .icon {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%) rotate(-45deg);
		color: var(--color-text-muted);
		font-size: 15px;
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 10px 14px 10px 38px;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		font-size: 14px;
		background: var(--color-surface);
	}

	.search-box input:focus {
		outline: none;
		box-shadow: 0 0 0 3px var(--color-primary-soft);
		border-color: var(--color-primary);
	}

	.match-count {
		font-size: 12.5px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.pdf-toolbar button {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 16px;
		cursor: pointer;
	}

	.pdf-toolbar button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.pdf-toolbar-nav {
		margin-top: -4px;
	}

	.zoom-pct {
		font-size: 12.5px;
		color: var(--color-text-muted);
		min-width: 40px;
		text-align: center;
	}

	.nav-sep {
		color: var(--color-border);
		margin: 0 4px;
		font-size: 14px;
	}

	.page-label {
		font-size: 12.5px;
		color: var(--color-text-muted);
	}

	.page-input {
		width: 52px;
		padding: 5px 8px;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface);
		font-size: 13px;
		text-align: center;
	}

	.page-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-primary-soft);
	}

	.page-total {
		font-size: 12.5px;
		color: var(--color-text-muted);
	}

	.pdf-shell {
		position: relative;
		width: 100%;
		height: calc(100vh - 250px);
		min-height: 480px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		background: #525659;
	}

	.preview-status {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 14px;
		z-index: 1;
	}

	.pdf-container {
		position: absolute;
		inset: 0;
		overflow: auto;
	}

	.pdf-container.hidden {
		visibility: hidden;
	}

	:global(.pdf-container .pdfViewer .page) {
		margin: 12px auto;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	:global(.pdf-container mark) {
		background: #ffe066;
		color: inherit;
	}

	:global(.pdf-container .highlight.selected) {
		background: #ff9632;
	}
</style>
