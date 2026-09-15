# Visualizador de Procedimentos Operacionais — CGB

App em SvelteKit que lê uma pasta do Google Drive (onde ficam os POPs) e permite
navegar pelas subpastas e visualizar os PDFs direto no navegador — celular, tablet
ou notebook — sem precisar baixar o arquivo. Hospedado na Vercel.

Os arquivos continuam só no Google Drive; o app apenas lista e exibe o conteúdo
usando uma **service account** do Google com permissão de leitura.

## Como funciona

- Uma "service account" (conta de robô do Google) recebe acesso de leitura à pasta
  raiz dos POPs no Drive.
- O app usa essa conta, nos bastidores, para listar pastas/arquivos e transmitir o
  conteúdo dos PDFs.
- Como o acesso ao app é público (sem login), qualquer pessoa com o link consegue
  ver os procedimentos — a "senha" de verdade é o link do site não ser divulgado
  fora da empresa, se isso importar. Se depois quiser restringir por login, dá para
  adicionar depois.

## 1. Criar a service account no Google Cloud

1. Acesse https://console.cloud.google.com/ e crie um projeto novo (ou use um
   existente), ex.: `cgb-pop-viewer`.
2. No menu **APIs e Serviços → Biblioteca**, procure **Google Drive API** e clique
   em **Ativar**.
3. Vá em **APIs e Serviços → Credenciais → Criar credenciais → Conta de serviço**.
   - Nome: `pop-viewer`
   - Não precisa conceder nenhum papel/role de projeto.
4. Abra a conta de serviço criada → aba **Chaves** → **Adicionar chave** → **Criar
   nova chave** → formato **JSON**. Um arquivo `.json` será baixado — guarde-o em
   local seguro, **não** o envie para o Git.
5. Anote o e-mail da conta de serviço (algo como
   `pop-viewer@cgb-pop-viewer.iam.gserviceaccount.com`), ele está tanto no JSON
   quanto na tela da conta.

## 2. Compartilhar a pasta do Drive com a service account

1. No Google Drive, suba (ou já tenha) a pasta raiz com os POPs — a mesma
   estrutura de `GOMAN - CGB`, `GSTC - CGB`, `TRILHA DE SEGURANÇA`, etc.
2. Clique com o botão direito na pasta raiz → **Compartilhar** → cole o e-mail da
   service account → permissão **Leitor** → **Enviar**.
   - Compartilhando só a pasta raiz já dá acesso a todas as subpastas dentro dela.
3. Copie o ID da pasta raiz pela URL: em
   `https://drive.google.com/drive/folders/1AbCdEfGhIjKlmNoPQRstuVWXyz`, o ID é
   `1AbCdEfGhIjKlmNoPQRstuVWXyz`.

## 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os dados da service account:

```bash
cp .env.example .env
```

- `GOOGLE_CLIENT_EMAIL`: e-mail da service account (passo 1.5).
- `GOOGLE_PRIVATE_KEY`: campo `private_key` do JSON baixado — copie exatamente
  como está, incluindo os `\n`.
- `GOOGLE_ROOT_FOLDER_ID`: ID da pasta raiz (passo 2.3).

## 4. Rodar localmente

```bash
npm install
npm run dev -- --open
```

## 5. Publicar na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione as três variáveis do `.env`
   (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_ROOT_FOLDER_ID`).
   - Ao colar a `GOOGLE_PRIVATE_KEY`, mantenha os `\n` como texto literal
     (a própria Vercel aceita colar o valor com quebras de linha reais também).
4. Deploy. O framework SvelteKit + adapter Vercel é detectado automaticamente.

## Estrutura

- `src/lib/server/drive.ts` — integração com a Google Drive API (listar pastas,
  metadados, streaming de arquivo). Só roda no servidor.
- `src/routes/pasta/[id]` — navegação de pastas com busca e breadcrumb.
- `src/routes/arquivo/[id]` — visualizador do PDF (iframe) com opção de baixar.
- `src/routes/api/file/[id]` — endpoint que transmite o conteúdo do arquivo do
  Drive para o navegador.

## Adicionar login restrito depois (opcional)

Se no futuro quiser limitar o acesso a e-mails `@cgbengenharia.com.br`, dá para
adicionar login Google (OAuth) usando `@auth/sveltekit` sem mudar a estrutura
atual — é só envolver as rotas com a checagem de sessão.
