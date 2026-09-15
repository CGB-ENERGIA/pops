import manifest from './data/manifest.json';

export interface FileNode {
	type: 'file';
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

export function fileUrl(slug: string[]): string {
	return `/pops/${slugPath(slug)}`;
}

export function folderHref(slug: string[]): string {
	return slug.length === 0 ? '/' : `/p/${slugPath(slug)}`;
}

export function fileHref(slug: string[]): string {
	return `/p/${slugPath(slug)}`;
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
