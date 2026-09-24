import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hashContent } from '../lib/state.mjs';
import { planUpdate } from '../lib/update.mjs';

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'vcp-update-planner-'));
}

async function writeTrackedProject({
  relative = 'docs/file.md',
  baseline = 'base\n',
  current = baseline,
  policy = 'managed',
  installedVersion = '0.9.0',
  includeEntry = true
} = {}) {
  const root = await tempDir();
  const baselinePath = `.vcp/baselines/${relative}`;
  await mkdir(path.dirname(path.join(root, baselinePath)), { recursive: true });
  await mkdir(path.dirname(path.join(root, relative)), { recursive: true });

  if (current !== null) await writeFile(path.join(root, relative), current, 'utf8');
  if (includeEntry) await writeFile(path.join(root, baselinePath), baseline, 'utf8');

  const managedFiles = includeEntry ? {
    [relative]: {
      policy,
      origin: 'template',
      mode: 420,
      baselineHash: hashContent(baseline),
      baselinePath,
      templateVersion: installedVersion
    }
  } : {};

  await mkdir(path.join(root, '.vcp'), { recursive: true });
  await writeFile(path.join(root, '.vcp/manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    installedVersion,
    installedAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    install: { agent: 'generic', stack: 'generic', includeGitHub: false },
    ignoredFiles: [],
    managedFiles
  }, null, 2)}\n`, 'utf8');

  return root;
}

function desiredBuilder(entries) {
  return async () => ({
    stack: 'generic',
    files: new Map(entries.map(([relative, content, policy = 'managed']) => [
      relative,
      { content, policy, origin: 'template', mode: 0o644 }
    ]))
  });
}

async function sameVersionPlan(root, entries) {
  return planUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [],
    desiredBuilder: desiredBuilder(entries)
  });
}

test('untouched managed files update directly when upstream changes', async () => {
  const root = await writeTrackedProject();
  const plan = await sameVersionPlan(root, [['docs/file.md', 'upstream\n']]);
  assert.equal(plan.actions[0].type, 'UPDATE');
  assert.equal(plan.actions[0].content, 'upstream\n');
});

test('local-only edits are preserved when upstream is unchanged', async () => {
  const root = await writeTrackedProject({ current: 'local\n' });
  const plan = await sameVersionPlan(root, [['docs/file.md', 'base\n']]);
  assert.equal(plan.actions[0].type, 'PRESERVE');
  assert.equal(plan.conflicts, 0);
});

test('independent local and upstream edits auto-merge', async () => {
  const baseline = 'alpha\nbeta\ngamma\n';
  const root = await writeTrackedProject({
    baseline,
    current: 'alpha local\nbeta\ngamma\n'
  });
  const plan = await sameVersionPlan(root, [[
    'docs/file.md',
    'alpha\nbeta\ngamma upstream\n'
  ]]);
  assert.equal(plan.actions[0].type, 'MERGE');
  assert.match(plan.actions[0].content, /alpha local/);
  assert.match(plan.actions[0].content, /gamma upstream/);
});

test('overlapping local and upstream edits become conflicts', async () => {
  const baseline = 'alpha\nbeta\n';
  const root = await writeTrackedProject({
    baseline,
    current: 'alpha local\nbeta\n'
  });
  const plan = await sameVersionPlan(root, [[
    'docs/file.md',
    'alpha upstream\nbeta\n'
  ]]);
  assert.equal(plan.actions[0].type, 'CONFLICT');
  assert.equal(plan.conflicts, 1);
});

test('customized preserve-owned documents are never overwritten', async () => {
  const root = await writeTrackedProject({
    policy: 'preserve',
    current: 'project decision\n'
  });
  const plan = await sameVersionPlan(root, [[
    'docs/file.md',
    'new starter template\n',
    'preserve'
  ]]);
  assert.equal(plan.actions[0].type, 'PRESERVE');
  assert.equal(plan.changes, 0);
});

test('generated files conflict when both local and upstream change', async () => {
  const root = await writeTrackedProject({
    policy: 'generated',
    current: 'local adapter\n'
  });
  const plan = await sameVersionPlan(root, [[
    'docs/file.md',
    'new generated adapter\n',
    'generated'
  ]]);
  assert.equal(plan.actions[0].type, 'CONFLICT');
});

test('deleted managed files conflict instead of being silently recreated', async () => {
  const root = await writeTrackedProject({ current: null });
  const plan = await sameVersionPlan(root, [['docs/file.md', 'upstream\n']]);
  assert.equal(plan.actions[0].type, 'CONFLICT');
});

test('new missing target files are added', async () => {
  const root = await writeTrackedProject({ includeEntry: false, current: null });
  const plan = await sameVersionPlan(root, [['docs/new.md', 'new\n']]);
  assert.equal(plan.actions[0].type, 'ADD');
});

test('matching pre-existing new files are adopted', async () => {
  const root = await writeTrackedProject({ includeEntry: false, current: null });
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs/new.md'), 'new\n', 'utf8');
  const plan = await sameVersionPlan(root, [['docs/new.md', 'new\n']]);
  assert.equal(plan.actions[0].type, 'ADOPT');
});

test('different pre-existing new files become conflicts', async () => {
  const root = await writeTrackedProject({ includeEntry: false, current: null });
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs/new.md'), 'user file\n', 'utf8');
  const plan = await sameVersionPlan(root, [['docs/new.md', 'new\n']]);
  assert.equal(plan.actions[0].type, 'CONFLICT');
});

test('explicit migration removal deletes untouched managed files', async () => {
  const root = await writeTrackedProject({ installedVersion: '0.8.0' });
  const plan = await planUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [{
      id: 'remove-file',
      from: '0.8.0',
      to: '0.9.0',
      renames: [],
      removals: ['docs/file.md']
    }],
    desiredBuilder: desiredBuilder([])
  });
  assert.equal(plan.actions[0].type, 'DELETE');
});

test('explicit migration removal detaches locally modified files', async () => {
  const root = await writeTrackedProject({
    installedVersion: '0.8.0',
    current: 'local edit\n'
  });
  const plan = await planUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [{
      id: 'remove-file',
      from: '0.8.0',
      to: '0.9.0',
      renames: [],
      removals: ['docs/file.md']
    }],
    desiredBuilder: desiredBuilder([])
  });
  assert.equal(plan.actions[0].type, 'DETACH');
});

test('explicit migration renames tracked files', async () => {
  const root = await writeTrackedProject({ installedVersion: '0.8.0' });
  const plan = await planUpdate({
    targetDir: root,
    targetVersion: '0.9.0',
    currentVersion: '0.9.0',
    migrations: [{
      id: 'rename-file',
      from: '0.8.0',
      to: '0.9.0',
      renames: [{ from: 'docs/file.md', to: 'docs/renamed.md' }],
      removals: []
    }],
    desiredBuilder: desiredBuilder([['docs/renamed.md', 'renamed target\n']])
  });
  assert.equal(plan.actions[0].type, 'RENAME');
  assert.equal(plan.actions[0].fromPath, 'docs/file.md');
  assert.equal(plan.actions[0].path, 'docs/renamed.md');
});

test('tampered baseline snapshots block planning', async () => {
  const root = await writeTrackedProject();
  await writeFile(path.join(root, '.vcp/baselines/docs/file.md'), 'tampered\n', 'utf8');
  await assert.rejects(
    sameVersionPlan(root, [['docs/file.md', 'upstream\n']]),
    /Baseline integrity check failed/
  );
});

test('running CLI refuses a target version it does not contain', async () => {
  const root = await writeTrackedProject();
  await assert.rejects(
    planUpdate({
      targetDir: root,
      targetVersion: '1.0.0',
      currentVersion: '0.9.0',
      migrations: [],
      desiredBuilder: desiredBuilder([])
    }),
    /contains templates for 0.9.0, not 1.0.0/
  );
});

test('downgrades are rejected', async () => {
  const root = await writeTrackedProject({ installedVersion: '1.0.0' });
  await assert.rejects(
    planUpdate({
      targetDir: root,
      targetVersion: '0.9.0',
      currentVersion: '0.9.0',
      migrations: [],
      desiredBuilder: desiredBuilder([])
    }),
    /Downgrades are not supported/
  );
});

test('planner leaves project files unchanged', async () => {
  const root = await writeTrackedProject({ current: 'local\n' });
  await sameVersionPlan(root, [['docs/file.md', 'upstream\n']]);
  assert.equal(await readFile(path.join(root, 'docs/file.md'), 'utf8'), 'local\n');
});
