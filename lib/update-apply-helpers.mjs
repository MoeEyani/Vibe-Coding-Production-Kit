import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BASELINES_DIR, STAGE_DIR, hashContent, readBaseline, readManagedFile, replaceBaselines } from './state.mjs';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function baselineForAction(plan, actionItem, finalEntries, baselineContents) {
  const oldEntry = plan.manifest.managedFiles[actionItem.fromPath ?? actionItem.path];
  if (['ADD','UPDATE','MERGE','ADOPT','RENAME','NOOP'].includes(actionItem.type)) {
    const desired = actionItem.desired;
    finalEntries[actionItem.path] = {
      policy: desired.policy,
      origin: desired.origin,
      mode: desired.mode,
      baselineHash: hashContent(desired.content),
      baselinePath: path.posix.join(BASELINES_DIR, actionItem.path),
      templateVersion: plan.toVersion
    };
    baselineContents.set(actionItem.path, desired.content);
    if (actionItem.fromPath && actionItem.fromPath !== actionItem.path) delete finalEntries[actionItem.fromPath];
    return;
  }
  if (actionItem.type === 'DELETE' || actionItem.type === 'DETACH') {
    delete finalEntries[actionItem.fromPath ?? actionItem.path];
    return;
  }
  if (actionItem.type === 'PRESERVE' && oldEntry) {
    finalEntries[actionItem.path] = clone(oldEntry);
  }
}

export async function writeFinalBaselines(root, entries, baselineContents, plan) {
  const resolved = new Map(baselineContents);
  for (const [relative] of Object.entries(entries)) {
    if (resolved.has(relative)) continue;
    const oldEntry = plan.manifest.managedFiles[relative];
    if (!oldEntry) throw new Error(`Missing baseline content for ${relative}.`);
    resolved.set(relative, await readBaseline(root, oldEntry));
  }
  await replaceBaselines(root, entries, resolved);
}

export async function stageActions(plan, id) {
  const stageRoot = path.join(plan.root, STAGE_DIR, id);
  await rm(stageRoot, { recursive: true, force: true });
  for (const item of plan.actions) {
    if (!['ADD','UPDATE','MERGE','RENAME'].includes(item.type)) continue;
    const destination = path.join(stageRoot, item.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, item.content, 'utf8');
    await chmod(destination, item.desired.mode ?? 0o644);
  }
  return stageRoot;
}

export async function verifyAppliedActions(plan) {
  for (const item of plan.actions) {
    if (['ADD','UPDATE','MERGE','RENAME'].includes(item.type)) {
      const current = await readManagedFile(plan.root, item.path);
      if (!current.exists || current.content !== item.content) throw new Error(`Post-apply verification failed for ${item.path}.`);
      if (item.type === 'RENAME') {
        const old = await readManagedFile(plan.root, item.fromPath);
        if (old.exists) throw new Error(`Post-apply verification found stale rename source ${item.fromPath}.`);
      }
    } else if (item.type === 'DELETE') {
      const current = await readManagedFile(plan.root, item.path);
      if (current.exists) throw new Error(`Post-apply verification expected ${item.path} to be deleted.`);
    }
  }
}
