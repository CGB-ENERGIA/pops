# Visualizador de Procedimentos Operacionais — CGB

App em SvelteKit que lê uma pasta do OneDrive/SharePoint da CGB (onde ficam os
POPs) e permite navegar pelas subpastas e visualizar os PDFs direto no
navegador — celular, tablet ou notebook — sem precisar baixar o arquivo nem
fazer login. Hospedado na Vercel.

Os arquivos continuam só no OneDrive/SharePoint; o app apenas lista e exibe o
conteúdo usando a sua própria conta Microsoft (a mesma que já tem acesso à
pasta), autorizada **uma única vez**.

## Como funciona

- Você registra um app no Azure AD (isso **não exige ser administrador** —
  qualquer usuário da CGB pode registrar um app; só a etapa de autorização é
  feita por você mesmo, não por um admin).
- Você acessa uma rota especial do site (`/auth/login`) **uma única vez** e
  faz login com sua conta Microsoft da CGB, autorizando o app a ler arquivos
  que você já tem acesso — inclui a pasta compartilhada pela Rebeca.
- O site guarda essa autorização (via Redis) e, a partir daí, usa-a nos
  bastidores para listar pastas/arquivos e transmitir os PDFs. Quem visita o
  site publicamente **não** vê nenhuma tela de login — só você viu, uma vez.
- Mudanças feitas na pasta (arquivo novo, editado, renomeado) aparecem no site
  automaticamente — o app consulta a pasta ao vivo, com cache curto de ~1
  minuto para não sobrecarregar a API.

> **Se um dia parar de funcionar:** normalmente é porque a autorização expirou
> (troca de senha, conta removida, ou token não usado por muito tempo). Basta
> repetir o passo "Autorizar uma vez" abaixo.

## 1. Registrar o app no Azure AD (sem precisar de admin)

1. Acesse https://portal.azure.com → **Microsoft Entra ID** →
   **Registros de aplicativo** → **Novo registro**.
   - Nome: `pop-viewer` (ou outro nome interno)
   - Tipos de conta: **Somente contas neste diretório organizacional**
   - **URI de redirecionamento**: tipo **Web**, valor
     `http://localhost:5173/auth/callback` (dá para adicionar o endereço da
     Vercel depois, no passo 5)
2. Na página do app criado, anote:
   - **Application (client) ID**
   - **Directory (tenant) ID**
3. Vá em **Certificates & secrets → Client secrets → New client secret**.
   Dê um nome, escolha uma validade (ex.: 24 meses) e clique em **Add**.
   Copie o **Value** imediatamente — ele só aparece uma vez.
4. Vá em **API permissions → Add a permission → Microsoft Graph →
   Delegated permissions** e adicione:
   - `Files.Read.All`
   - Essa permissão não exige "Grant admin consent" — você mesmo autoriza no
     passo 3 abaixo, no momento do login.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

- `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`: do passo 1.
- `MS_SHARE_URL`: o link de compartilhamento da pasta raiz dos POPs.
- `AUTH_SETUP_SECRET`: invente uma senha qualquer — protege a rota de login
  para que só você consiga usá-la.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`: credenciais de um banco Redis
  (guarda a sua sessão de login entre execuções do site). Crie um grátis em
  vercel.com → **Storage → Create Database → Redis** (via marketplace
  Upstash) e copie as duas variáveis da aba **Quickstart / .env.local**.

## 3. Rodar localmente e autorizar uma vez

```bash
npm install
npm run dev -- --open
```

Com o servidor rodando, abra no navegador:

```
http://localhost:5173/auth/login?secret=SEU_AUTH_SETUP_SECRET
```

Faça login com sua conta Microsoft da CGB e aceite a permissão pedida. Você
verá "Login concluído ✅". Pronto — a partir daqui `/` já lista os POPs.

## 4. Publicar na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione todas as variáveis do `.env`.
4. Deploy.
5. No **Azure Portal**, volte em **Autenticação** do app registrado e
   adicione mais uma **URI de redirecionamento** do tipo Web:
   `https://SEU-DOMINIO.vercel.app/auth/callback`.
6. Repita o passo 3 (autorizar uma vez), agora usando o domínio da Vercel:
   `https://SEU-DOMINIO.vercel.app/auth/login?secret=SEU_AUTH_SETUP_SECRET`.

## Estrutura

- `src/lib/server/msAuth.ts` — login delegado (MSAL): gera a URL de login,
  troca o código por tokens e renova o acesso silenciosamente depois.
- `src/lib/server/tokenStore.ts` — persiste a sessão de login no Redis entre
  execuções do servidor (necessário porque a Vercel roda funções sem estado).
- `src/lib/server/graph.ts` — integração com a Microsoft Graph API (resolução
  do link compartilhado, listagem de pastas, breadcrumb, streaming de
  arquivo). Só roda no servidor.
- `src/routes/auth/login`, `src/routes/auth/callback` — fluxo de autorização
  única, usado só por você.
- `src/routes/pasta/[driveId]/[itemId]` — navegação de pastas com busca e
  breadcrumb.
- `src/routes/arquivo/[driveId]/[itemId]` — visualizador do PDF (iframe) com
  opção de baixar.
- `src/routes/api/file/[driveId]/[itemId]` — endpoint que transmite o conteúdo
  do arquivo do OneDrive/SharePoint para o navegador.
