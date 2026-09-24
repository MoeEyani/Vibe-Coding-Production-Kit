import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { initProject } from '../lib/init.mjs';

test('init refuses to replace an already initialized VCP project even with --force', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'vcp-init-guard-'));
  await initProject({
    targetDir: root,
    agent: 'generic',
    stack: 'generic',
    includeGitHub: false
  });

  await assert.rejects(
    initProject({
      targetDir: root,
      agent: 'generic',
      stack: 'generic',
      includeGitHub: false,
      force: true
    }),
    /already initialized with VCP.*Use `vcp update`/s
  );
});
