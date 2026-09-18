// Copia os procedimentos das pastas locais para dentro do projeto (static/pops)
// e gera um manifesto (src/lib/data/manifest.json) com a árvore de pastas/arquivos.
//
// Rode `npm run sync` sempre que os arquivos originais forem atualizados, depois
// confira o resultado com `npm run dev` e faça commit + push.

import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const SOURCE_DIR =
	process.env.SOURCE_DIR ??
	resolve(PROJECT_ROOT, '..', 'PROCEDIMENTOS OPERACIONAIS - CGB');

const DEST_DIR = resolve(PROJECT_ROOT, 'static', 'pops');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'src', 'lib', 'data', 'manifest.json');

const ALLOWED_EXT = new Set([
	'.pdf',
	'.docx',
	'.xlsx',
	'.xlsm',
	'.xlsb',
	'.pptx',
	'.doc',
	'.xls',
	'.ppt'
]);
const IGNORE_DIRS = new Set(['.claude', '.git', 'node_modules']);

if (!existsSync(SOURCE_DIR)) {
	console.error(`Pasta de origem não encontrada: ${SOURCE_DIR}`);
	console.error('Defina a variável de ambiente SOURCE_DIR apontando para a pasta correta.');
	process.exit(1);
}

// limpa o destino para não deixar arquivo removido/renomeado para trás
if (existsSync(DEST_DIR)) rmSync(DEST_DIR, { recursive: true, force: true });
mkdirSync(DEST_DIR, { recursive: true });

let fileCount = 0;
let skippedCount = 0;

function shouldSkip(name) {
	return name.startsWith('~$') || name.startsWith('.');
}

function walk(sourceDir, destDir, slug) {
	const entries = readdirSync(sourceDir, { withFileTypes: true }).sort((a, b) =>
		a.name.localeCompare(b.name, 'pt-BR')
	);

	const children = [];

	for (const entry of entries) {
		if (shouldSkip(entry.name)) {
			if (!entry.isDirectory()) skippedCount++;
			continue;
		}

		const sourcePath = join(sourceDir, entry.name);

		if (entry.isDirectory()) {
			if (IGNORE_DIRS.has(entry.name)) continue;

			const childSlug = [...slug, entry.name];
			const childDest = join(destDir, entry.name);
			mkdirSync(childDest, { recursive: true });
			const childNode = walk(sourcePath, childDest, childSlug);
			// só inclui a pasta se tiver algo dentro (evita pastas vazias na navegação)
			if (childNode.children.length > 0) {
				children.push(childNode);
			}
			continue;
		}

		const ext = extname(entry.name).toLowerCase();
		if (!ALLOWED_EXT.has(ext)) {
			skippedCount++;
			continue;
		}

		copyFileSync(sourcePath, join(destDir, entry.name));
		const stats = statSync(sourcePath);
		fileCount++;

		children.push({
			type: 'file',
			name: entry.name,
			slug: [...slug, entry.name],
			ext: ext.replace('.', ''),
			sizeBytes: stats.size,
			modified: stats.mtime.toISOString()
		});
	}

	return {
		type: 'folder',
		name: slug.length > 0 ? slug[slug.length - 1] : 'Procedimentos Operacionais',
		slug,
		children
	};
}

const tree = walk(SOURCE_DIR, DEST_DIR, []);

mkdirSync(resolve(PROJECT_ROOT, 'src', 'lib', 'data'), { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify(tree, null, '\t') + '\n', 'utf-8');

console.log(`Fonte: ${SOURCE_DIR}`);
console.log(`${fileCount} arquivo(s) copiado(s) para static/pops, ${skippedCount} ignorado(s).`);
console.log(`Manifesto gerado em src/lib/data/manifest.json`);
