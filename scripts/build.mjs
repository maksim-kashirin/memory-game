import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'src', 'assets', 'README.md']) {
  await cp(resolve(root, entry), resolve(output, entry), { recursive: true });
}

// Source sprite sheets are development artifacts; the optimized individual
// WebP files are the only illustrations needed by the deployed game.
await rm(resolve(output, 'assets/source'), { recursive: true, force: true });

console.log(`Static build created at ${output}`);
