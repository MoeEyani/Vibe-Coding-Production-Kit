function parseCore(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(version ?? '');
  if (!match) throw new Error(`Invalid semantic version: ${version}`);
  return match.slice(1, 4).map(Number);
}

export function compareVersions(left, right) {
  const a = parseCore(left);
  const b = parseCore(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] < b[index]) return -1;
    if (a[index] > b[index]) return 1;
  }
  return 0;
}

export const MIGRATIONS = [
  {
    id: '0.8.0-to-0.9.0-foundation',
    from: '0.8.0',
    to: '0.9.0',
    renames: [],
    removals: [],
    manifest(manifest) { return manifest; }
  }
];

export function resolveMigrationPath(fromVersion, toVersion, migrations = MIGRATIONS) {
  if (compareVersions(fromVersion, toVersion) === 0) return [];
  if (compareVersions(fromVersion, toVersion) > 0) throw new Error(`Downgrades are not supported: ${fromVersion} -> ${toVersion}.`);

  const byFrom = new Map();
  for (const migration of migrations) {
    if (byFrom.has(migration.from)) throw new Error(`Multiple migrations start from ${migration.from}.`);
    byFrom.set(migration.from, migration);
  }

  const path = [];
  let current = fromVersion;
  const visited = new Set();
  while (compareVersions(current, toVersion) < 0) {
    if (visited.has(current)) throw new Error(`Migration cycle detected at ${current}.`);
    visited.add(current);
    const migration = byFrom.get(current);
    if (!migration) throw new Error(`No migration path from ${current} to ${toVersion}.`);
    if (compareVersions(migration.to, toVersion) > 0) throw new Error(`Migration ${migration.id} overshoots target ${toVersion}.`);
    path.push(migration);
    current = migration.to;
  }
  if (current !== toVersion) throw new Error(`Migration path ended at ${current}, expected ${toVersion}.`);
  return path;
}
