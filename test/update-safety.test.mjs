import assert from 'node:assert/strict';
import test from 'node:test';
import { threeWayMerge } from '../lib/merge.mjs';
import { compareVersions, resolveMigrationPath } from '../lib/migrations.mjs';
import { publicUpdateReport } from '../lib/update.mjs';

test('semantic versions compare deterministically', () => {
  assert.equal(compareVersions('0.8.0', '0.9.0'), -1);
  assert.equal(compareVersions('0.9.0', '0.9.0'), 0);
  assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
});

test('migration resolver finds the supported 0.8 -> 0.9 path', () => {
  const result = resolveMigrationPath('0.8.0', '0.9.0');
  assert.deepEqual(result.map((item) => item.id), ['0.8.0-to-0.9.0-foundation']);
});

test('three-way merge preserves independent local and upstream edits', () => {
  const base = 'alpha\nbeta\ngamma\n';
  const local = 'alpha local\nbeta\ngamma\n';
  const upstream = 'alpha\nbeta\ngamma upstream\n';
  const result = threeWayMerge(base, local, upstream);
  assert.equal(result.clean, true);
  assert.match(result.content, /alpha local/);
  assert.match(result.content, /gamma upstream/);
});

test('three-way merge reports overlapping edits as conflicts', () => {
  const result = threeWayMerge('one\ntwo\n', 'one local\ntwo\n', 'one upstream\ntwo\n');
  assert.equal(result.clean, false);
});

test('public update JSON never exposes desired or file content', () => {
  const report = publicUpdateReport({
    fromVersion: '0.8.0', toVersion: '0.9.0', cliVersion: '0.9.0',
    migrationIds: [], counts: { UPDATE: 1 }, changes: 1, conflicts: 0,
    versionChange: true, needsApply: true, upToDate: false,
    actions: [{ type: 'UPDATE', path: 'AGENTS.md', reason: 'changed', content: 'SECRET', desired: { content: 'SECRET' } }]
  });
  const encoded = JSON.stringify(report);
  assert.equal(encoded.includes('SECRET'), false);
  assert.equal('content' in report.actions[0], false);
  assert.equal('desired' in report.actions[0], false);
});
