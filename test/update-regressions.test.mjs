import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { threeWayMerge } from '../lib/merge.mjs';
import { checkForUpdate } from '../lib/update.mjs';

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-update-regression-'));
}

test('three-way merge preserves a local final-newline removal while merging unrelated upstream edits', () => {
  const result = threeWayMerge(
    'alpha\nbeta\n',
    'alpha\nbeta',
    'alpha\nbeta upstream\n'
  );

  assert.equal(result.clean, true);
  assert.equal(result.content, 'alpha\nbeta upstream');
});

test('three-way merge preserves an upstream final-newline removal with unrelated local edits', () => {
  const result = threeWayMerge(
    'alpha\nbeta\n',
    'alpha local\nbeta\n',
    'alpha\nbeta'
  );

  assert.equal(result.clean, true);
  assert.equal(result.content, 'alpha local\nbeta');
});

test('update check delegates to the project that was actually checked', async () => {
  const root = await tempDir();
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    installedVersion: '0.9.0',
    install: { agent: 'generic', stack: 'generic', includeGitHub: false },
    ignoredFiles: [],
    managedFiles: {}
  }, null, 2)}\n`, 'utf8');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() { return { version: '0.10.0' }; }
  });

  try {
    const report = await checkForUpdate({ targetDir: root, fetchLatest: true });
    assert.equal(report.cliUpdateAvailable, true);
    assert.equal(report.updateAvailable, true);
    assert.equal(
      report.targetCommand,
      `npx --yes vibe-coding-production@0.10.0 update ${JSON.stringify(path.resolve(root))} --dry-run`
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
