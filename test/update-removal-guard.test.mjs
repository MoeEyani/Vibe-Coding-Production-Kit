import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hashContent } from '../lib/state.mjs';
import { planUpdate } from '../lib/update.mjs';

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-removal-guard-'));
}

test('managed files cannot disappear from a template without an explicit migration removal', async () => {
  const root = await tempDir();
  const relative = 'docs/file.md';
  const baseline = 'tracked content\n';
  const baselinePath = `.vcp/baselines/${relative}`;

  await mkdir(path.dirname(path.join(root, baselinePath)), { recursive: true });
  await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
  await writeFile(path.join(root, relative), baseline, 'utf8');
  await writeFile(path.join(root, baselinePath), baseline, 'utf8');
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    installedVersion: '0.9.0',
    installedAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    install: { agent: 'generic', stack: 'generic', includeGitHub: false },
    ignoredFiles: [],
    managedFiles: {
      [relative]: {
        policy: 'managed',
        origin: 'template',
        mode: 420,
        baselineHash: hashContent(baseline),
        baselinePath,
        templateVersion: '0.9.0'
      }
    }
  }, null, 2)}\n`, 'utf8');

  const plan = await planUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [],
    desiredBuilder: async () => ({ stack: 'generic', files: new Map() })
  });

  assert.equal(plan.actions.length, 1);
  assert.equal(plan.actions[0].type, 'CONFLICT');
  assert.match(plan.actions[0].reason, /without an explicit migration removal/);
  assert.equal(plan.conflicts, 1);
  assert.equal(plan.changes, 0);
});
