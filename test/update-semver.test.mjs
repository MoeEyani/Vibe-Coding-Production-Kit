import assert from 'node:assert/strict';
import test from 'node:test';
import { compareVersions } from '../lib/migrations.mjs';

test('stable releases sort after prereleases with the same core version', () => {
  assert.equal(compareVersions('0.9.0-beta.1', '0.9.0'), -1);
  assert.equal(compareVersions('0.9.0', '0.9.0-rc.1'), 1);
});

test('SemVer prerelease identifiers use numeric and lexical precedence', () => {
  assert.equal(compareVersions('1.0.0-alpha.2', '1.0.0-alpha.10'), -1);
  assert.equal(compareVersions('1.0.0-alpha.10', '1.0.0-beta.1'), -1);
  assert.equal(compareVersions('1.0.0-beta.1', '1.0.0-beta.1.1'), -1);
});

test('build metadata does not affect precedence', () => {
  assert.equal(compareVersions('1.2.3+build.1', '1.2.3+build.99'), 0);
});

test('invalid numeric prerelease identifiers are rejected', () => {
  assert.throws(() => compareVersions('1.0.0-beta.01', '1.0.0'), /Invalid semantic version/);
});
