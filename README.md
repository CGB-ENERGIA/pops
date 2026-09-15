# Visualizador de Procedimentos Operacionais — CGB

App em SvelteKit que lê uma pasta do OneDrive/SharePoint da CGB (onde ficam os
POPs) e permite navegar pelas subpastas e visualizar os PDFs direto no
navegador — celular, tablet ou notebook — sem precisar baixar o arquivo nem
fazer login. Hospedado na Vercel.

Os arquivos continuam só no OneDrive/SharePoint; o app apenas lista e exibe o
conteúdo usando um app registrado no Azure AD da CGB com permissão de leitura.

## Como funciona

- Um **app registrado no Azure AD** (aplicativo "de robô", sem usuário por trás)
  recebe permissão de leitura de arquivos no tenant da CGB.
- O app SvelteKit usa essa credencial, nos bastidores, para resolver o link da
  pasta compartilhada, listar pastas/arquivos e transmitir o conteúdo dos PDFs.
- Como o acesso ao site é público (sem login), qualquer pessoa com o link do
  site consegue navegar e visualizar os procedimentos.
- Mudanças feitas na pasta (arquivo novo, editado, renomeado) aparecem no site
  automaticamente — o app consulta a pasta ao vivo, com um cache curto de ~1
  minuto para não sobrecarregar a API.

> **Nota de segurança:** a permissão de leitura usada (`Files.Read.All`,
> aplicativo) dá ao app acesso de leitura a qualquer arquivo do tenant que ele
> seja capaz de resolver, não só a essa pasta. Isso é necessário porque a pasta
> está em um OneDrive pessoal (não uma biblioteca de site do SharePoint). Se
> quiser restringir o escopo no futuro, mover os POPs para uma biblioteca de
> documentos de um site do SharePoint permite usar a permissão mais restrita
> `Sites.Selected`.

## 1. Registrar o app no Azure AD

Isso precisa ser feito por alguém com direito de administrador no Microsoft
365 / Azure AD da CGB (Application Administrator ou Global Administrator).

1. Acesse https://portal.azure.com → **Microsoft Entra ID** (Azure AD) →
   **Registros de aplicativo** → **Novo registro**.
   - Nome: `pop-viewer` (ou outro nome interno)
   - Tipos de conta: **Somente contas neste diretório organizacional**
   - Não precisa de "URI de redirecionamento"
2. Na página do app criado, anote:
   - **Application (client) ID**
   - **Directory (tenant) ID**
3. Vá em **Certificates & secrets → Client secrets → New client secret**.
   Dê um nome, escolha uma validade (ex.: 24 meses) e clique em **Add**.
   Copie o **Value** imediatamente — ele só aparece uma vez.
4. Vá em **API permissions → Add a permission → Microsoft Graph →
   Application permissions** e adicione:
   - `Files.Read.All`
5. Clique em **Grant admin consent for CGB** (só um admin consegue clicar
   nesse botão — é essa a etapa que exige acesso de administrador).

## 2. Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

- `MS_TENANT_ID`: Directory (tenant) ID (passo 1.2)
- `MS_CLIENT_ID`: Application (client) ID (passo 1.2)
- `MS_CLIENT_SECRET`: valor do client secret (passo 1.3)
- `MS_SHARE_URL`: o link de compartilhamento da pasta raiz dos POPs (o mesmo
  link usado para abrir a pasta no navegador, ex.:
  `https://cgbengenharia-my.sharepoint.com/:f:/g/personal/...`)

## 3. Rodar localmente

```bash
npm install
npm run dev -- --open
```

## 4. Publicar na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em https://vercel.com, **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione as quatro variáveis do `.env`.
4. Deploy. O framework SvelteKit + adapter Vercel é detectado automaticamente.

## Estrutura

- `src/lib/server/graph.ts` — integração com a Microsoft Graph API
  (autenticação client credentials, resolução do link compartilhado, listagem
  de pastas, breadcrumb, streaming de arquivo). Só roda no servidor.
- `src/routes/pasta/[driveId]/[itemId]` — navegação de pastas com busca e
  breadcrumb.
- `src/routes/arquivo/[driveId]/[itemId]` — visualizador do PDF (iframe) com
  opção de baixar.
- `src/routes/api/file/[driveId]/[itemId]` — endpoint que transmite o conteúdo
  do arquivo do OneDrive/SharePoint para o navegador.
