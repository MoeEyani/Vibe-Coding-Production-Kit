import assert from 'node:assert/strict';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeManagedPath } from '../lib/template.mjs';
import {
  acquireUpdateLock,
  createBackup,
  hashContent,
  readBaseline,
  readManifest,
  readTransaction,
  releaseUpdateLock,
  restoreBackup
} from '../lib/state.mjs';
import { rollbackProject } from '../lib/update.mjs';

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-update-transaction-'));
}

async function writeLock(root, value) {
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(
    path.join(root, '.vcp/update.lock'),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );
}

test('update lock prevents a second live updater', async () => {
  const root = await tempDir();
  await acquireUpdateLock(root);
  try {
    await assert.rejects(acquireUpdateLock(root), /Another VCP update appears to be running/);
  } finally {
    await releaseUpdateLock(root);
  }
});

test('dead same-host update locks are reclaimed immediately', async () => {
  const root = await tempDir();
  await writeLock(root, {
    pid: 2_147_483_647,
    host: os.hostname(),
    startedAt: new Date().toISOString()
  });

  const lock = await acquireUpdateLock(root, { staleMs: 24 * 60 * 60 * 1000 });
  assert.equal(lock.pid, process.pid);
  await releaseUpdateLock(root);
});

test('fresh foreign-host locks are not reclaimed', async () => {
  const root = await tempDir();
  await writeLock(root, {
    pid: 12345,
    host: 'another-host.example',
    startedAt: new Date().toISOString()
  });

  await assert.rejects(
    acquireUpdateLock(root, { staleMs: 24 * 60 * 60 * 1000 }),
    /Another VCP update appears to be running/
  );
});

test('rollback refuses to race a live update lock', async () => {
  const root = await tempDir();
  await acquireUpdateLock(root);
  try {
    await assert.rejects(
      rollbackProject({ targetDir: root }),
      /Another VCP update appears to be running/
    );
  } finally {
    await releaseUpdateLock(root);
  }
});

test('future manifest schemas are rejected', async () => {
  const root = await tempDir();
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/manifest.json'), `${JSON.stringify({
    schemaVersion: 999,
    installedVersion: '0.9.0',
    install: {},
    managedFiles: {}
  })}\n`);

  await assert.rejects(readManifest(root), /newer than this CLI supports/);
});

test('corrupt transaction state is rejected explicitly', async () => {
  const root = await tempDir();
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/transaction.json'), '{broken json\n', 'utf8');
  await assert.rejects(readTransaction(root), /Cannot read update transaction/);
});

test('managed path traversal is rejected', () => {
  assert.throws(() => normalizeManagedPath('../escape.md'), /Unsafe managed path/);
  assert.throws(() => normalizeManagedPath('docs/../../escape.md'), /Unsafe managed path/);
  assert.throws(() => normalizeManagedPath('.vcp/manifest.json'), /Reserved managed path/);
});

test('baseline reads refuse symlink traversal inside VCP state', async () => {
  const root = await tempDir();
  const outside = await tempDir();
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(outside, 'secret.md'), 'outside\n', 'utf8');
  await symlink(outside, path.join(root, '.vcp/baselines'));

  await assert.rejects(
    readBaseline(root, {
      baselinePath: '.vcp/baselines/secret.md',
      baselineHash: hashContent('outside\n')
    }),
    /Refusing to follow symlink/
  );
});

test('backup identifiers cannot escape .vcp/backups', async () => {
  const root = await tempDir();
  await assert.rejects(
    restoreBackup(root, '../../outside'),
    /Unsafe VCP state path/
  );
});

test('backup ids are unique even for adjacent backups', async () => {
  const root = await tempDir();
  const manifest = { installedVersion: '0.9.0' };
  const first = await createBackup(root, [], manifest);
  const second = await createBackup(root, [], manifest);
  assert.notEqual(first.id, second.id);
});
