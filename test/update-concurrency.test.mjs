import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ignorePath } from '../lib/manage.mjs';
import { acquireUpdateLock, releaseUpdateLock } from '../lib/state.mjs';
import { applyUpdate } from '../lib/update.mjs';

async function tempProject() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'vcp-update-concurrency-'));
  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    installedVersion: '0.9.0',
    installedAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    install: { agent: 'generic', stack: 'generic', includeGitHub: false },
    ignoredFiles: [],
    managedFiles: {}
  }, null, 2)}\n`, 'utf8');
  return root;
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('a second updater cannot plan against stale state while the first updater holds the lock', async () => {
  const root = await tempProject();
  const entered = deferred();
  const releasePlanner = deferred();
  let secondPlannerCalls = 0;

  const first = applyUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [],
    desiredBuilder: async () => {
      entered.resolve();
      await releasePlanner.promise;
      return { stack: 'generic', files: new Map() };
    }
  });

  await entered.promise;

  await assert.rejects(
    applyUpdate({
      targetDir: root,
      targetVersion: '0.9.0',
      currentVersion: '0.9.0',
      migrations: [],
      desiredBuilder: async () => {
        secondPlannerCalls += 1;
        return { stack: 'generic', files: new Map() };
      }
    }),
    /Another VCP update appears to be running/
  );

  assert.equal(secondPlannerCalls, 0);
  releasePlanner.resolve();
  const result = await first;
  assert.equal(result.upToDate, true);

  await acquireUpdateLock(root);
  await releaseUpdateLock(root);
});

test('manage mutations are rejected while an updater holds the lifecycle lock', async () => {
  const root = await tempProject();
  await acquireUpdateLock(root);
  try {
    await assert.rejects(
      ignorePath({ targetDir: root, relativePath: 'AGENTS.md' }),
      /Another VCP update appears to be running/
    );
  } finally {
    await releaseUpdateLock(root);
  }
});
