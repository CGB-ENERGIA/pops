# Visualizador de Procedimentos Operacionais — CGB

Portal leve, mobile-first, em SvelteKit, que serve como porta de entrada para
os Procedimentos Operacionais da CGB. Não copia nem armazena nenhum arquivo —
cada card do site leva direto para a pasta real no OneDrive/SharePoint, então
o conteúdo está sempre atualizado (é a pasta ao vivo, não uma cópia).

Sem backend, sem login próprio, sem credenciais de API. Só um front-end
estático hospedado na Vercel.

## Como funciona

- `src/lib/data/pastas.ts` tem uma lista simples de atalhos (`{ nome, url }`).
- A página inicial mostra um card para cada atalho; ao tocar, abre o link do
  OneDrive em uma nova aba.
- Dentro do OneDrive, a navegação entre subpastas, a busca e a visualização
  do PDF já são feitas pela própria interface da Microsoft — que funciona bem
  em celular, tablet e notebook.

## Pré-requisito: link público

Para que qualquer pessoa consiga abrir sem precisar de login, a pasta no
OneDrive precisa estar compartilhada com o link no modo **"Qualquer pessoa com
o link"**:

1. No OneDrive, clique com o botão direito na pasta → **Compartilhar**.
2. Em **Configurações do link**, escolha **Qualquer pessoa** (em vez de
   "Pessoas com acesso existente" ou "Pessoas em CGB Engenharia").
3. Permissão: **Pode visualizar**.
4. Copie o link e cole em `src/lib/data/pastas.ts`.

Se preferir manter restrito a quem tem conta da CGB, escolha **Pessoas em CGB
Engenharia** em vez de "Qualquer pessoa" — quem já estiver logado no
Microsoft 365 da empresa no navegador entra direto, sem senha extra.

## Adicionando mais atalhos

Edite `src/lib/data/pastas.ts` e adicione um item por pasta que quiser
destacar na tela inicial, por exemplo uma entrada para cada uma de GERE,
GOMAN, GSTC e Trilha de Segurança (usando o link de compartilhamento de cada
subpasta em vez do link da pasta raiz):

```ts
export const atalhos: Atalho[] = [
	{ nome: 'GERE - CGB', url: 'https://cgbengenharia-my.sharepoint.com/...' },
	{ nome: 'GOMAN - CGB', url: 'https://cgbengenharia-my.sharepoint.com/...' }
	// ...
];
```

## Rodar localmente

```bash
npm install
npm run dev -- --open
```

## Publicar na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. Deploy — não precisa configurar nenhuma variável de ambiente.

## Estrutura

- `src/lib/data/pastas.ts` — lista de atalhos (nome + link do OneDrive).
- `src/routes/+page.svelte` — tela inicial com os cards.
- `src/routes/+layout.svelte` — cabeçalho e estilos globais.
