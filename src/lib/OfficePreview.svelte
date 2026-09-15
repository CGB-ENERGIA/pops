<script lang="ts">
	let { url, ext }: { url: string; ext: string } = $props();

	type State = 'loading' | 'ready' | 'error';

	let status = $state<State>('loading');
	let sheets = $state<{ name: string; html: string }[]>([]);
	let activeSheet = $state(0);
	let docHtml = $state('');

	$effect(() => {
		status = 'loading';
		sheets = [];
		docHtml = '';
		activeSheet = 0;

		const isSpreadsheet = ext === 'xlsx' || ext === 'xls';
		const currentUrl = url;

		(async () => {
			try {
				const res = await fetch(currentUrl);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buffer = await res.arrayBuffer();

				if (isSpreadsheet) {
					const XLSX = await import('xlsx');
					const workbook = XLSX.read(buffer, { type: 'array' });
					const parsed = workbook.SheetNames.map((name) => ({
						name,
						html: XLSX.utils.sheet_to_html(workbook.Sheets[name])
					}));
					if (currentUrl !== url) return;
					sheets = parsed;
				} else {
					const mammoth = await import('mammoth');
					const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
					if (currentUrl !== url) return;
					docHtml = result.value;
				}
				status = 'ready';
			} catch (e) {
				console.error(e);
				status = 'error';
			}
		})();
	});
</script>

{#if status === 'loading'}
	<div class="preview-status">Carregando pré-visualização…</div>
{:else if status === 'error'}
	<div class="preview-status">Não foi possível gerar a pré-visualização deste arquivo.</div>
{:else if sheets.length > 0}
	{#if sheets.length > 1}
		<div class="sheet-tabs">
			{#each sheets as sheet, i (sheet.name)}
				<button
					type="button"
					class="sheet-tab"
					class:active={i === activeSheet}
					onclick={() => (activeSheet = i)}
				>
					{sheet.name}
				</button>
			{/each}
		</div>
	{/if}
	<div class="sheet-scroll">
		{@html sheets[activeSheet]?.html}
	</div>
{:else}
	<div class="doc-content">
		{@html docHtml}
	</div>
{/if}

<style>
	.preview-status {
		text-align: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	.sheet-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 12px 12px 0;
	}

	.sheet-tab {
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		font-size: 12.5px;
		font-weight: 600;
		padding: 7px 12px;
		border-radius: 999px 999px 0 0;
		cursor: pointer;
	}

	.sheet-tab.active {
		background: var(--color-surface);
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.sheet-scroll {
		overflow: auto;
		padding: 16px;
		max-height: calc(100vh - 320px);
	}

	.sheet-scroll :global(table) {
		border-collapse: collapse;
		font-size: 13px;
	}

	.sheet-scroll :global(td) {
		border: 1px solid var(--color-border);
		padding: 5px 8px;
		white-space: nowrap;
	}

	.doc-content {
		padding: 28px 32px;
		max-height: calc(100vh - 300px);
		overflow: auto;
		font-size: 14.5px;
		line-height: 1.65;
	}

	.doc-content :global(h1),
	.doc-content :global(h2),
	.doc-content :global(h3) {
		letter-spacing: -0.01em;
	}

	.doc-content :global(table) {
		border-collapse: collapse;
		margin: 12px 0;
	}

	.doc-content :global(td),
	.doc-content :global(th) {
		border: 1px solid var(--color-border);
		padding: 6px 10px;
	}

	.doc-content :global(img) {
		max-width: 100%;
	}
</style>
