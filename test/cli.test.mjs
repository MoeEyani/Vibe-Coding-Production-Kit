import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initProject } from '../lib/init.mjs';

const execFileAsync = promisify(execFile);

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-'));
}

test('installs the core framework and GitHub assets', async () => {
  const target = await tempDir();
  const result = await initProject({ targetDir: target, agent: 'codex', includeGitHub: true });

  assert.equal(result.dryRun, false);
  assert.match(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), /# AGENTS\.md/);
  assert.match(await readFile(path.join(target, 'docs/product/PRD.md'), 'utf8'), /PRD/);
  assert.match(await readFile(path.join(target, '.github/workflows/validate.yml'), 'utf8'), /Framework Validation/);
  const { stdout } = await execFileAsync(path.join(target, 'scripts/validate-framework.sh'), { cwd: target });
  assert.match(stdout, /Framework validation passed/);
});

test('adds thin adapters only when the selected tool needs them', async () => {
  const target = await tempDir();
  await initProject({ targetDir: target, agent: 'all', includeGitHub: true });

  assert.match(await readFile(path.join(target, 'CLAUDE.md'), 'utf8'), /@AGENTS\.md/);
  assert.match(await readFile(path.join(target, '.github/copilot-instructions.md'), 'utf8'), /AGENTS\.md/);
});

test('refuses to overwrite existing managed paths without --force', async () => {
  const target = await tempDir();
  await writeFile(path.join(target, 'AGENTS.md'), 'existing policy\n');

  await assert.rejects(
    initProject({ targetDir: target, agent: 'generic', includeGitHub: false }),
    /Refusing to overwrite/
  );

  assert.equal(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), 'existing policy\n');
});

test('dry-run performs no writes', async () => {
  const target = await tempDir();
  const result = await initProject({ targetDir: target, agent: 'claude', includeGitHub: false, dryRun: true });

  assert.equal(result.dryRun, true);
  await assert.rejects(readFile(path.join(target, 'AGENTS.md'), 'utf8'));
});

test('merges into existing directories when individual framework files do not conflict', async () => {
  const target = await tempDir();
  await mkdir(path.join(target, 'docs'), { recursive: true });
  await writeFile(path.join(target, 'docs/EXISTING.md'), 'keep me\n');

  await initProject({ targetDir: target, agent: 'generic', includeGitHub: false });

  assert.equal(await readFile(path.join(target, 'docs/EXISTING.md'), 'utf8'), 'keep me\n');
  assert.match(await readFile(path.join(target, 'docs/product/PRD.md'), 'utf8'), /PRD/);
});
