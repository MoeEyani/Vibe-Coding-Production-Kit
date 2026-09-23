import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  STAGE_DIR,
  acquireUpdateLock,
  clearTransaction,
  createBackup,
  listBackups,
  readTransaction,
  releaseUpdateLock,
  removeManagedFile,
  restoreBackup,
  writeManagedFile,
  writeManifest,
  writeTransaction
} from './state.mjs';
import { baselineForAction, stageActions, verifyAppliedActions, writeFinalBaselines } from './update-apply-helpers.mjs';
import { planUpdate } from './update-plan.mjs';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

async function applyProjectActions(plan) {
  for (const item of plan.actions) {
    if (['ADD','UPDATE','MERGE'].includes(item.type)) {
      await writeManagedFile(plan.root, item.path, item.content, item.desired.mode ?? 0o644);
    } else if (item.type === 'RENAME') {
      await writeManagedFile(plan.root, item.path, item.content, item.desired.mode ?? 0o644);
      if (item.fromPath !== item.path) await removeManagedFile(plan.root, item.fromPath);
    } else if (item.type === 'DELETE') {
      await removeManagedFile(plan.root, item.path);
    }
  }
}

function buildNextManifest(plan, finalEntries) {
  return {
    ...clone(plan.migratedManifest),
    schemaVersion: plan.migratedManifest.schemaVersion,
    installedVersion: plan.toVersion,
    updatedAt: new Date().toISOString(),
    install: {
      ...clone(plan.migratedManifest.install),
      stack: plan.stack
    },
    managedFiles: finalEntries
  };
}

export async function applyUpdate(options) {
  const plan = await planUpdate(options);
  if (plan.conflicts > 0) return { ...plan, blocked: true, applied: false, backupId: null };
  if (!plan.needsApply) return { ...plan, blocked: false, applied: false, backupId: null };

  let lockAcquired = false;
  let backup = null;
  let stageRoot = null;
  try {
    await acquireUpdateLock(plan.root);
    lockAcquired = true;
    backup = await createBackup(plan.root, plan.actions, plan.manifest);
    const transaction = {
      schemaVersion: 1,
      id: backup.id,
      backupId: backup.id,
      fromVersion: plan.fromVersion,
      toVersion: plan.toVersion,
      phase: 'staging',
      startedAt: new Date().toISOString()
    };
    await writeTransaction(plan.root, transaction);
    stageRoot = await stageActions(plan, backup.id);
    await writeTransaction(plan.root, { ...transaction, phase: 'applying' });

    await applyProjectActions(plan);

    const finalEntries = clone(plan.migratedManifest.managedFiles ?? {});
    const baselineContents = new Map();
    for (const item of plan.actions) baselineForAction(plan, item, finalEntries, baselineContents);
    await writeFinalBaselines(plan.root, finalEntries, baselineContents, plan);
    const nextManifest = buildNextManifest(plan, finalEntries);
    await writeManifest(plan.root, nextManifest);
    await verifyAppliedActions(plan);

    await writeTransaction(plan.root, { ...transaction, phase: 'verified' });
    await clearTransaction(plan.root);
    if (stageRoot) await rm(stageRoot, { recursive: true, force: true });
    await releaseUpdateLock(plan.root);
    lockAcquired = false;
    return { ...plan, manifest: nextManifest, blocked: false, applied: true, backupId: backup.id };
  } catch (error) {
    if (backup?.id) {
      try { await restoreBackup(plan.root, backup.id); lockAcquired = false; }
      catch (rollbackError) {
        throw new Error(`VCP update failed: ${error.message}. Automatic rollback also failed: ${rollbackError.message}`);
      }
    }
    throw new Error(`VCP update failed and was rolled back: ${error.message}`);
  } finally {
    if (stageRoot) await rm(stageRoot, { recursive: true, force: true }).catch(() => {});
    if (lockAcquired) await releaseUpdateLock(plan.root).catch(() => {});
  }
}

export async function rollbackProject({ targetDir, backupId = null }) {
  const root = path.resolve(targetDir);
  const transaction = await readTransaction(root);
  const backups = await listBackups(root);
  const selected = backupId ?? transaction?.backupId ?? backups[0];
  if (!selected) throw new Error('No VCP backup is available to roll back.');
  const restored = await restoreBackup(root, selected);
  return {
    backupId: selected,
    restoredVersion: restored.installedVersion,
    recoveredInterruptedUpdate: Boolean(transaction),
    restoredAt: new Date().toISOString()
  };
}
