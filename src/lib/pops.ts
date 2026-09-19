import manifest from './data/manifest.json';

export interface FileNode {
	type: 'file';
	id: string;
	name: string;
	slug: string[];
	ext: string;
	sizeBytes: number;
	modified: string;
}

export interface FolderNode {
	type: 'folder';
	name: string;
	slug: string[];
	children: PopNode[];
}

export type PopNode = FileNode | FolderNode;

export const root = manifest as FolderNode;

export function findNode(slug: string[]): PopNode | null {
	let current: PopNode = root;
	for (const part of slug) {
		if (current.type !== 'folder') return null;
		const next: PopNode | undefined = current.children.find((c) => c.name === part);
		if (!next) return null;
		current = next;
	}
	return current;
}

export function slugPath(slug: string[]): string {
	return slug.map(encodeURIComponent).join('/');
}

// A URL do arquivo estático usa um id curto (hash) em vez do nome original —
// nomes longos/com vírgula no caminho quebravam o deploy na Vercel.
export function fileUrl(file: FileNode): string {
	return `/pops/${file.id}.${file.ext}`;
}

export function folderHref(slug: string[]): string {
	return slug.length === 0 ? '/' : `/p/${slugPath(slug)}`;
}

export function fileHref(file: FileNode): string {
	return `/f/${file.id}`;
}

export function findFileById(id: string, node: PopNode = root): FileNode | null {
	if (node.type === 'file') return node.id === id ? node : null;
	for (const child of node.children) {
		const found = findFileById(id, child);
		if (found) return found;
	}
	return null;
}

export function findParentFolder(fileSlug: string[]): FolderNode | null {
	const parentSlug = fileSlug.slice(0, -1);
	const node = findNode(parentSlug);
	return node && node.type === 'folder' ? node : null;
}

export function formatSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function countFiles(node: PopNode): number {
	if (node.type === 'file') return 1;
	return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

export interface FlatFile {
	file: FileNode;
	parentSlug: string[];
}

export function flattenFiles(node: PopNode = root): FlatFile[] {
	if (node.type === 'file') return [];
	const out: FlatFile[] = [];
	for (const child of node.children) {
		if (child.type === 'file') {
			out.push({ file: child, parentSlug: node.slug });
		} else {
			out.push(...flattenFiles(child));
		}
	}
	return out;
}

const EXT_LABEL: Record<string, string> = {
	pdf: 'PDF',
	docx: 'Word',
	doc: 'Word',
	xlsx: 'Excel',
	xls: 'Excel',
	xlsm: 'Excel',
	xlsb: 'Excel',
	pptx: 'PowerPoint',
	ppt: 'PowerPoint'
};

export function extLabel(ext: string): string {
	return EXT_LABEL[ext] ?? ext.toUpperCase();
}

const EXT_COLOR: Record<string, string> = {
	pdf: '#d92d20',
	docx: '#2563eb',
	doc: '#2563eb',
	xlsx: '#0f9d58',
	xls: '#0f9d58',
	xlsm: '#0f9d58',
	xlsb: '#0f9d58',
	pptx: '#d97706',
	ppt: '#d97706'
};

export function extColor(ext: string): string {
	return EXT_COLOR[ext] ?? '#6b7280';
}

const CATEGORY_COLORS = ['#2563eb', '#0f9d58', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

export function initials(name: string): string {
	const clean = name.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
	const firstWord = clean.split(' ')[0] ?? '';
	if (firstWord.length >= 2) return firstWord.slice(0, 2).toUpperCase();
	return (clean.replace(/\s+/g, '').slice(0, 2) || '?').toUpperCase();
}

export function categoryColor(topName: string): string {
	let hash = 0;
	for (let i = 0; i < topName.length; i++) hash = (hash * 31 + topName.charCodeAt(i)) >>> 0;
	return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

const POP_CODE_RE = /POP\.?\s*0*(\d+)/i;
// Casa um prefixo "POP.00168[.EQTL] - 02 - " (código + opcional revisão) no
// início do nome, para remover repetições dele e sobrar só a descrição.
const CODE_PREFIX_RE = /^POP\.?\s*0*\d+(\.[A-Z]+)?\s*-\s*(\d+\s*-\s*)?/i;

// Nome de exibição curto, ex.: "POP.00168.EQTL - 02 - POP.00168.EQTL - Comunicação
// com o COI.pdf" -> "POP-168 · Comunicação com o COI". Os nomes originais repetem
// o código do POP duas vezes, o que truncava feio nas listas do celular.
export function shortLabel(name: string): string {
	const noExt = name.replace(/\.[a-zA-Z0-9]+$/, '');
	const match = noExt.match(POP_CODE_RE);
	if (!match) return noExt;

	const code = `POP-${match[1]}`;
	const tail = noExt.replace(CODE_PREFIX_RE, '').replace(CODE_PREFIX_RE, '').trim();
	return tail ? `${code} · ${tail}` : code;
}

// Aplica shortLabel a uma lista de arquivos.
export function labelFiles<T extends { name: string }>(items: T[]): Map<T, string> {
	const result = new Map<T, string>();
	for (const item of items) result.set(item, shortLabel(item.name));
	return result;
}

// Verifica se o arquivo corresponde a uma query de busca.
// Além do nome, suporta busca por número do POP: "168" acha "POP.00168".
export function matchesQuery(file: FileNode, q: string): boolean {
	const lower = q.toLowerCase().trim();
	if (!lower) return false;
	if (file.name.toLowerCase().includes(lower)) return true;
	if (/^\d+$/.test(lower)) {
		const m = file.name.match(POP_CODE_RE);
		if (m && parseInt(m[1], 10) === parseInt(lower, 10)) return true;
	}
	return false;
}
