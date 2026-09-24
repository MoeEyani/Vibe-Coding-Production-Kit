import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createBackup } from '../lib/state.mjs';
import { rollbackProject } from '../lib/update.mjs';

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-rollback-guard-'));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('rollback refuses an older historical backup and accepts the newest recovery point', async () => {
  const root = await tempDir();
  const first = await createBackup(root, [], { installedVersion: '0.7.0' });
  await sleep(5);
  const second = await createBackup(root, [], { installedVersion: '0.8.0' });

  await assert.rejects(
    rollbackProject({ targetDir: root, backupId: first.id }),
    /supports rollback only to the newest backup/
  );

  const restored = await rollbackProject({ targetDir: root, backupId: second.id });
  assert.equal(restored.backupId, second.id);
  assert.equal(restored.restoredVersion, '0.8.0');
});
