// Todo o conteúdo é estático (vem do manifesto bundlado), então o site inteiro
// pode ser pré-renderizado em build. Isso gera HTML de verdade para cada pasta
// e arquivo, essencial para o app funcionar offline (o service worker precisa
// de algo estático para servir do cache, não de uma função serverless).
export const prerender = true;
