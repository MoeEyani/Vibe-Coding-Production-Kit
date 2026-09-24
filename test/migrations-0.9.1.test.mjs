import assert from 'node:assert/strict';
import test from 'node:test';
import { MIGRATIONS, resolveMigrationPath } from '../lib/migrations.mjs';

test('0.9.0 projects have an explicit migration path to 0.9.1', () => {
  const path = resolveMigrationPath('0.9.0', '0.9.1', MIGRATIONS);
  assert.deepEqual(path.map((migration) => migration.id), [
    '0.9.0-to-0.9.1-dogfood-fixes'
  ]);
});

test('older 0.8.0 projects can compose through 0.9.0 to 0.9.1', () => {
  const path = resolveMigrationPath('0.8.0', '0.9.1', MIGRATIONS);
  assert.deepEqual(path.map((migration) => migration.id), [
    '0.8.0-to-0.9.0-foundation',
    '0.9.0-to-0.9.1-dogfood-fixes'
  ]);
});
