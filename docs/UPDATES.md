# Safe lifecycle updates

VCP v0.9 introduces repository-native lifecycle state so a project can evolve with the kit without blindly overwriting project decisions.

## The contract

`vcp init` creates `.vcp/manifest.json` plus baseline snapshots for files VCP manages. The manifest records the installed VCP version, install profile, ownership policy, baseline hash, baseline path, file mode, and template version.

Runtime-only update artifacts are ignored through `.vcp/.gitignore`:

- `backups/`
- `stage/`
- `update.lock`
- `transaction.json`

The manifest and baselines are intentionally persistent. They are the evidence needed to distinguish upstream template changes from project-local changes.

## Ownership policies

VCP does not treat every file the same.

- `managed` — VCP may update an untouched file and three-way merge independent local/upstream edits.
- `generated` — VCP may regenerate an untouched adapter, but local + upstream edits become a conflict rather than being overwritten.
- `preserve` — project-owned product/architecture/security decisions are preserved once customized. An untouched starter can still be safely refreshed.
- ignored — `vcp manage ignore <path>` detaches a file from VCP management without deleting local content.

Reattach a current VCP file with:

```bash
vcp manage track AGENTS.md
```

## Check for a new version

```bash
vcp update . --check
```

The command compares the installed manifest version, the running CLI, and—unless `--offline` is used—the latest npm version.

Machine-readable form:

```bash
vcp update . --check --json
```

A newer npm version is not applied by an older CLI. VCP prints a version-pinned `npx` command so the target templates and migration code come from the version being installed.

## Preview before writing

```bash
vcp update . --dry-run
```

The planner classifies each path as one of:

- `NOOP`
- `ADD`
- `UPDATE`
- `MERGE`
- `RENAME`
- `DELETE`
- `ADOPT`
- `DETACH`
- `PRESERVE`
- `IGNORED`
- `CONFLICT`

`--json` intentionally omits file contents and desired-template contents so update plans can be stored in CI logs without copying project text into the report.

## Apply

```bash
vcp update .
```

The apply path is transactional:

1. acquire `.vcp/update.lock`;
2. create a backup of every path the transaction may touch plus the manifest/baselines;
3. write transaction state;
4. stage new file content;
5. apply safe filesystem operations;
6. rebuild baseline state;
7. write the new manifest;
8. verify applied paths;
9. clear transaction state and release the lock.

A plan containing any `CONFLICT` is blocked before project files are changed.

If apply fails after backup creation, VCP attempts an automatic rollback and reports if rollback itself cannot complete.

## Roll back

Restore the newest VCP backup:

```bash
vcp rollback .
```

Or a specific backup:

```bash
vcp rollback . --backup <id>
```

Rollback restores files, the manifest, and baseline snapshots. It also clears interrupted transaction/lock state.

## Three-way merge

For mergeable files VCP compares:

- baseline: the VCP version originally installed;
- local: the current project file;
- target: the new VCP template.

Independent edits can merge automatically. Overlapping edits are reported as `CONFLICT`; VCP does not choose a winner or silently overwrite project changes.

## Deleted and renamed files

Version migrations explicitly declare renames/removals. An unmodified managed file removed upstream can be deleted safely. A locally modified or `preserve` file is detached instead of deleted.

A rename refuses to overwrite an unrelated destination and treats overlapping local/upstream edits as a conflict.

## Recovery and Doctor

`vcp doctor` checks lifecycle state in addition to the normal engineering-system checks. It can surface:

- missing/corrupt manifests;
- unsupported manifest schema versions;
- baseline integrity problems;
- interrupted update transactions.

If a previous update was interrupted, inspect the repository and use `vcp rollback` before starting another update.

## Safety boundaries

Update paths are repository-relative and validated against traversal and symlink escapes. VCP state paths under `.vcp` receive the same no-symlink treatment. A lock prevents two update processes from mutating the same project concurrently; stale locks are only reclaimed after the owning process is gone and the lock is old enough.
