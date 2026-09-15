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
