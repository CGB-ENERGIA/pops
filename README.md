# Visualizador de Procedimentos Operacionais — CGB

Site em SvelteKit com os Procedimentos Operacionais da CGB navegáveis por
categoria, com busca e visualização de PDF direto no navegador (celular,
tablet ou notebook). Os arquivos ficam copiados dentro do próprio projeto
(pasta `static/pops`) e são publicados como site estático na Vercel — sem
backend, sem login, sem credenciais de API.

Como os arquivos moram dentro do projeto, **atualizações são feitas
localmente**: sempre que um procedimento for adicionado/alterado na pasta de
origem, é preciso rodar o script de sincronização e publicar de novo.

## Como funciona

- `scripts/sync-pops.mjs` lê a pasta local de origem (por padrão, a pasta
  `PROCEDIMENTOS OPERACIONAIS - CGB` ao lado deste projeto), copia todos os
  PDFs/Word/Excel para `static/pops/` e gera um índice em
  `src/lib/data/manifest.json` com toda a árvore de pastas e arquivos.
- O site lê esse índice para montar a navegação (categorias na tela inicial,
  pastas/subpastas, busca por nome) e serve os arquivos como conteúdo
  estático — o PDF abre embutido na página, sem precisar baixar.
- Como tudo é estático, o deploy na Vercel não precisa de nenhuma variável de
  ambiente nem servidor.

## Atualizando o conteúdo

Sempre que os procedimentos originais mudarem:

```bash
npm run sync
```

Isso recopia tudo de origem para `static/pops` e regenera o manifesto
(arquivos removidos na origem também somem do site). Depois:

```bash
npm run dev -- --open   # conferir localmente
```

Quando estiver tudo certo, faça commit e push — a Vercel republica sozinha.

```bash
git add -A
git commit -m "Atualiza procedimentos operacionais"
git push
```

### Apontando para outra pasta de origem

Por padrão o script usa a pasta
`PROCEDIMENTOS OPERACIONAIS - CGB` (irmã deste projeto, dentro de
"Área de Trabalho"). Para usar outro caminho:

```bash
SOURCE_DIR="C:\caminho\para\a\pasta" npm run sync
```

Tipos de arquivo copiados: `.pdf`, `.docx`, `.xlsx`, `.pptx` (e as versões
antigas `.doc`, `.xls`, `.ppt`). Pastas vazias (ou só com arquivos de tipos
não suportados) não aparecem na navegação. Arquivos temporários do Office
(que começam com `~$`) são sempre ignorados.

## Rodar localmente

```bash
npm install
npm run sync   # copia os arquivos e gera o manifesto (necessário na 1ª vez)
npm run dev -- --open
```

## Publicar na Vercel

1. Suba este projeto (incluindo `static/pops`) para um repositório Git
   (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. Deploy — não precisa configurar nenhuma variável de ambiente.
4. Para publicar atualizações depois, basta repetir "Atualizando o conteúdo"
   acima e dar `git push` — a Vercel redeploya automaticamente.

## Estrutura

- `scripts/sync-pops.mjs` — copia os arquivos da pasta local de origem para
  `static/pops` e gera `src/lib/data/manifest.json`.
- `src/lib/data/manifest.json` — árvore de pastas/arquivos (gerada, não editar
  à mão).
- `src/lib/pops.ts` — funções auxiliares de navegação/busca sobre o manifesto.
- `src/routes/+page.svelte` — tela inicial com os cards de categoria e busca
  global.
- `src/routes/p/[...slug]/+page.svelte` — navegação de pastas e visualizador
  de arquivo (uma única rota cuida dos dois casos).
- `src/routes/+layout.svelte` — cabeçalho e estilos globais.
