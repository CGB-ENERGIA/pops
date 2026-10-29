// Copia os procedimentos das pastas locais para dentro do projeto (static/pops)
// e gera um manifesto (src/lib/data/manifest.json) com a árvore de pastas/arquivos.
//
// Cada arquivo é salvo em static/pops com um nome curto baseado em hash
// (ex.: static/pops/a1b2c3d4e5f6.pdf) em vez do nome original — nomes de
// arquivo muito longos ou com caracteres como vírgula vinham quebrando o
// deploy na Vercel. O nome de exibição continua vindo do manifesto.
//
// Rode `npm run sync` sempre que os arquivos originais forem atualizados, depois
// confira o resultado com `npm run dev` e faça commit + push.

import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const SOURCE_DIR =
	process.env.SOURCE_DIR ??
	resolve(PROJECT_ROOT, '..', 'Procedimentos Atualizados - QRCODE');

const DEST_DIR = resolve(PROJECT_ROOT, 'static', 'pops');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'src', 'lib', 'data', 'manifest.json');
const TEXT_INDEX_PATH = resolve(PROJECT_ROOT, 'static', 'text-index.json');
const TEXT_CACHE_PATH = resolve(__dirname, 'text-cache.json');

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
const usedIds = new Set();
const fileList = []; // { id, ext, srcPath, modified } — used for text extraction

function shouldSkip(name) {
	return name.startsWith('~$') || name.startsWith('.');
}

function idFor(slug) {
	const base = createHash('sha1').update(slug.join('/')).digest('hex').slice(0, 12);
	let id = base;
	let suffix = 1;
	// no improvável caso de colisão, acrescenta um sufixo
	while (usedIds.has(id)) {
		id = `${base}${suffix++}`;
	}
	usedIds.add(id);
	return id;
}

function walk(sourceDir, slug) {
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
			const childNode = walk(sourcePath, childSlug);
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

		const fileSlug = [...slug, entry.name];
		const id = idFor(fileSlug);
		const extNoDot = ext.replace('.', '');

		const stats = statSync(sourcePath);
		copyFileSync(sourcePath, join(DEST_DIR, `${id}.${extNoDot}`));
		fileCount++;

		fileList.push({ id, ext: extNoDot, srcPath: sourcePath, modified: stats.mtime.toISOString() });

		children.push({
			type: 'file',
			id,
			name: entry.name,
			slug: fileSlug,
			ext: extNoDot,
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

const tree = walk(SOURCE_DIR, []);

mkdirSync(resolve(PROJECT_ROOT, 'src', 'lib', 'data'), { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify(tree, null, '\t') + '\n', 'utf-8');

console.log(`Fonte: ${SOURCE_DIR}`);
console.log(`${fileCount} arquivo(s) copiado(s) para static/pops, ${skippedCount} ignorado(s).`);
console.log(`Manifesto gerado em src/lib/data/manifest.json`);

// ── Extração de texto para busca por conteúdo ──────────────────────────────

async function extractPdfText(filePath) {
	try {
		const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
		const data = new Uint8Array(readFileSync(filePath));
		const doc = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
		let text = '';
		for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
			const page = await doc.getPage(i);
			const content = await page.getTextContent();
			text += content.items.filter(item => 'str' in item).map(item => item.str).join(' ') + ' ';
		}
		return text.replace(/\s+/g, ' ').trim().slice(0, 3000);
	} catch {
		return '';
	}
}

async function extractDocxText(filePath) {
	try {
		const mammoth = await import('mammoth');
		const result = await mammoth.extractRawText({ path: filePath });
		return result.value.replace(/\s+/g, ' ').trim().slice(0, 3000);
	} catch {
		return '';
	}
}

async function buildTextIndex() {
	let cache = {};
	try { cache = JSON.parse(readFileSync(TEXT_CACHE_PATH, 'utf-8')); } catch { /* no cache yet */ }

	const index = {};
	let extracted = 0, cached = 0, failed = 0;

	for (const { id, ext, srcPath, modified } of fileList) {
		if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') continue;

		const cacheKey = `${id}_${modified}`;
		if (cacheKey in cache) {
			if (cache[cacheKey]) index[id] = cache[cacheKey];
			cached++;
			continue;
		}

		let text = '';
		if (ext === 'pdf') text = await extractPdfText(srcPath);
		else text = await extractDocxText(srcPath);

		cache[cacheKey] = text;
		if (text) { index[id] = text; extracted++; } else failed++;
	}

	writeFileSync(TEXT_CACHE_PATH, JSON.stringify(cache, null, '\t'), 'utf-8');
	writeFileSync(TEXT_INDEX_PATH, JSON.stringify(index), 'utf-8');
	return { extracted, cached, failed };
}

const SKIP_TEXT = process.argv.includes('--no-text');
if (!SKIP_TEXT) {
	console.log('Extraindo texto dos documentos (use --no-text para pular)…');
	const t0 = Date.now();
	const { extracted, cached, failed } = await buildTextIndex();
	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`Texto: ${extracted} novo(s), ${cached} do cache, ${failed} sem texto — ${dt}s`);
	console.log(`Índice de texto: static/text-index.json`);
}
