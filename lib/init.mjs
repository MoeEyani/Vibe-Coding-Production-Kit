import { access, cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterFiles, agentNote } from './adapters.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CORE_ASSETS = [
  'AGENTS.md',
  'docs',
  'prompts',
  'examples/feature-spec.example.md',
  'scripts/validate-framework.sh'
];

const GITHUB_ASSETS = [
  '.github/ISSUE_TEMPLATE',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/workflows/validate.yml'
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function expandAsset(relative) {
  const source = path.join(packageRoot, relative);
  const sourceStat = await stat(source);
  if (sourceStat.isFile()) return [relative];

  const result = [];
  async function walk(currentRelative) {
    const currentSource = path.join(packageRoot, currentRelative);
    const entries = await readdir(currentSource, { withFileTypes: true });
    for (const entry of entries) {
      const child = path.join(currentRelative, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile()) result.push(child);
    }
  }
  await walk(relative);
  return result;
}

async function expandAssets(assets) {
  return (await Promise.all(assets.map(expandAsset))).flat().sort();
}

async function collectConflicts(target, files, adapters) {
  const conflicts = [];
  for (const relative of files) {
    if (await exists(path.join(target, relative))) conflicts.push(relative);
  }
  for (const relative of adapters.keys()) {
    if (await exists(path.join(target, relative))) conflicts.push(relative);
  }
  return conflicts;
}

async function copyFile(target, relative, force) {
  const source = path.join(packageRoot, relative);
  const destination = path.join(target, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force, errorOnExist: !force, preserveTimestamps: true });
}

export async function initProject({ targetDir, agent = 'generic', includeGitHub = true, force = false, dryRun = false }) {
  const target = path.resolve(targetDir);
  const assetRoots = [...CORE_ASSETS, ...(includeGitHub ? GITHUB_ASSETS : [])];
  const files = await expandAssets(assetRoots);
  const adapters = adapterFiles(agent);
  const conflicts = await collectConflicts(target, files, adapters);

  if (conflicts.length > 0 && !force) {
    const detail = conflicts.map((item) => `  - ${item}`).join('\n');
    throw new Error(`Refusing to overwrite existing framework files:\n${detail}\nRe-run with --force only after reviewing these files.`);
  }

  const planned = [...files, ...adapters.keys()].sort();
  if (dryRun) {
    return { target, files: planned, note: agentNote(agent), dryRun: true };
  }

  await mkdir(target, { recursive: true });

  for (const relative of files) {
    await copyFile(target, relative, force);
  }

  for (const [relative, content] of adapters) {
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, { encoding: 'utf8', flag: force ? 'w' : 'wx' });
  }

  const agentFile = path.join(target, 'AGENTS.md');
  const agentContent = await readFile(agentFile, 'utf8');
  if (!agentContent.includes('# AGENTS.md')) {
    throw new Error('Installed AGENTS.md did not pass a basic integrity check.');
  }

  return { target, files: planned, note: agentNote(agent), dryRun: false };
}
