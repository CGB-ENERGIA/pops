<script lang="ts">
	import { atalhos } from '$lib/data/pastas';
</script>

<svelte:head>
	<title>Procedimentos Operacionais · CGB</title>
</svelte:head>

<p class="intro">
	Toque em uma pasta para abrir direto no OneDrive — sempre com o conteúdo mais
	atual, sem precisar baixar nada.
</p>

<ul class="grid">
	{#each atalhos as atalho (atalho.url)}
		<li>
			<a class="card" href={atalho.url} target="_blank" rel="noopener noreferrer">
				<span class="icon" aria-hidden="true">📁</span>
				<span class="text">
					<span class="nome">{atalho.nome}</span>
					{#if atalho.descricao}
						<span class="descricao">{atalho.descricao}</span>
					{/if}
				</span>
				<span class="chevron" aria-hidden="true">↗</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.intro {
		color: var(--color-text-muted);
		font-size: 14px;
		margin: 0 0 16px;
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.card:active {
		background: var(--color-bg);
	}

	.icon {
		font-size: 26px;
		flex-shrink: 0;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.nome {
		font-weight: 600;
		font-size: 15px;
	}

	.descricao {
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.chevron {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	@media (hover: hover) {
		.card:hover {
			background: var(--color-bg);
		}
	}
</style>
