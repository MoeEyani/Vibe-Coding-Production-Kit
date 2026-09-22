import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initProject } from '../lib/init.mjs';
import { createTaskPack } from '../lib/task.mjs';
import { createContextPack } from '../lib/context.mjs';

const execFileAsync = promisify(execFile);

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-context-'));
}

test('context pack bundles task, repository rules, mode prompt, and source-of-truth documents', async () => {
  const target = await tempDir();
  await initProject({ targetDir: target, agent: 'codex', stack: 'generic', includeGitHub: false });
  await createTaskPack({ targetDir: target, slug: 'accept-invite', title: 'Accept invitation' });

  const result = await createContextPack({ targetDir: target, task: 'accept-invite', mode: 'plan' });

  assert.equal(result.mode, 'plan');
  assert.ok(result.files.includes('AGENTS.md'));
  assert.ok(result.files.includes('prompts/02-plan-task.md'));
  assert.ok(result.files.includes(path.join('docs', 'tasks', 'accept-invite.md')));
  assert.ok(result.files.includes(path.join('docs', 'product', 'PRD.md')));
  assert.match(result.content, /# VCP Context Pack — plan/);
  assert.match(result.content, /## Execution prompt/);
  assert.match(result.content, /## Repository instructions/);
  assert.match(result.content, /## Referenced source of truth/);
});

test('context pack supports explicit includes and safe repository-local output', async () => {
  const target = await tempDir();
  await initProject({ targetDir: target, agent: 'generic', stack: 'generic', includeGitHub: false });
  await createTaskPack({ targetDir: target, slug: 'rotate-key' });
  await mkdir(path.join(target, 'src'), { recursive: true });
  await writeFile(path.join(target, 'src', 'key-service.md'), '# Existing key service\nPreserve rotation audit events.\n');

  const result = await createContextPack({
    targetDir: target,
    task: 'rotate-key',
    mode: 'review',
    includes: ['src/key-service.md'],
    output: '.vcp/context/rotate-key-review.md'
  });

  assert.equal(result.output, path.join('.vcp', 'context', 'rotate-key-review.md'));
  assert.ok(result.files.includes(path.join('src', 'key-service.md')));
  const written = await readFile(path.join(target, result.output), 'utf8');
  assert.match(written, /Prompt: Independent Code Review/);
  assert.match(written, /Preserve rotation audit events/);

  await assert.rejects(
    createContextPack({
      targetDir: target,
      task: 'rotate-key',
      mode: 'review',
      output: '.vcp/context/rotate-key-review.md'
    }),
    /Refusing to overwrite existing context pack/
  );
});

test('context pack rejects repository escape paths and enforces the context budget', async () => {
  const target = await tempDir();
  await initProject({ targetDir: target, agent: 'generic', stack: 'generic', includeGitHub: false });
  await createTaskPack({ targetDir: target, slug: 'safe-context' });

  await assert.rejects(
    createContextPack({ targetDir: target, task: 'safe-context', includes: ['../outside.md'] }),
    /escapes the repository root/
  );

  await assert.rejects(
    createContextPack({ targetDir: target, task: 'safe-context', maxBytes: 100 }),
    /above the 100-byte limit/
  );
});

test('context CLI emits a usable bounded pack', async () => {
  const target = await tempDir();
  await initProject({ targetDir: target, agent: 'generic', stack: 'generic', includeGitHub: false });
  await createTaskPack({ targetDir: target, slug: 'context-cli' });

  const bin = path.resolve('bin/vibe-coding-production.mjs');
  const { stdout } = await execFileAsync(process.execPath, [bin, 'context', 'context-cli', '--dir', target, '--mode', 'implement']);
  assert.match(stdout, /# VCP Context Pack — implement/);
  assert.match(stdout, /Prompt: Implement an Approved Task/);
  assert.match(stdout, /docs\/tasks\/context-cli\.md/);
});
