// Gera os PNGs do ícone do app (PWA + apple-touch-icon) a partir do SVG fonte.
// Rode com `node scripts/generate-icons.mjs` sempre que trocar o app-icon.svg.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SRC_SVG = resolve(PROJECT_ROOT, 'src/lib/assets/app-icon.svg');
const OUT_DIR = resolve(PROJECT_ROOT, 'static/icons');

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
	{ file: 'icon-192.png', size: 192 },
	{ file: 'icon-512.png', size: 512 },
	{ file: 'maskable-512.png', size: 512, padding: 0.16 },
	{ file: 'apple-touch-icon.png', size: 180 }
];

for (const t of targets) {
	const img = sharp(SRC_SVG).resize(t.size, t.size);

	if (t.padding) {
		const pad = Math.round(t.size * t.padding);
		await sharp(SRC_SVG)
			.resize(t.size - pad * 2, t.size - pad * 2)
			.extend({
				top: pad,
				bottom: pad,
				left: pad,
				right: pad,
				background: '#3730a3'
			})
			.png()
			.toFile(resolve(OUT_DIR, t.file));
	} else {
		await img.png().toFile(resolve(OUT_DIR, t.file));
	}

	console.log(`gerado static/icons/${t.file}`);
}
