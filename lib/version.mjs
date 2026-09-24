import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function getCliVersion() {
  const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  return pkg.version;
}
