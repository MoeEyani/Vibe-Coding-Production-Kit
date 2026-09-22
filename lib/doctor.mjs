import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { detectStack } from './stacks.mjs';

const CORE_DOCS = [
  ['product-brief', 'Product brief', 'docs/product/PRODUCT-BRIEF.md'],
  ['prd', 'Product requirements', 'docs/product/PRD.md'],
  ['architecture', 'Architecture', 'docs/architecture/ARCHITECTURE.md'],
  ['threat-model', 'Threat model', 'docs/security/THREAT-MODEL.md'],
  ['test-strategy', 'Test strategy', 'docs/testing/TEST-STRATEGY.md'],
  ['definition-ready', 'Definition of Ready', 'docs/delivery/DEFINITION-OF-READY.md'],
  ['definition-done', 'Definition of Done', 'docs/delivery/DEFINITION-OF-DONE.md']
];

const TEMPLATE_SIGNALS = {
  'product-brief': [
    'What painful, frequent, or valuable problem are we solving?',
    'Who experiences the problem? Segment primary vs secondary users.'
  ],
  prd: ['FR-001 — <Requirement name>', '- Owner:\n- Status: Draft / Review / Accepted / Superseded'],
  architecture: ['List the qualities the architecture must optimize for', '| | | | |'],
  'threat-model': ['| T-001 | | | | | | | |'],
  'test-strategy': ['| | | | | |']
};

const COMMAND_KEYS = [
  'INSTALL_COMMAND',
  'FORMAT_CHECK_COMMAND',
  'LINT_COMMAND',
  'TYPECHECK_COMMAND',
  'UNIT_TEST_COMMAND',
  'INTEGRATION_TEST_COMMAND',
  'BUILD_COMMAND',
  'E2E_COMMAND'
];

async function readableNonEmpty(file) {
  try {
    const metadata = await stat(file);
    return metadata.isFile() && metadata.size > 0;
  } catch {
    return false;
  }
}

async function read(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return '';
  }
}

function check(status, id, title, detail, remediation = null) {
  return { status, id, title, detail, remediation };
}

function parseCommands(agents) {
  const result = {};
  for (const key of COMMAND_KEYS) {
    const match = agents.match(new RegExp(`^${key}=(.*)$`, 'm'));
    result[key] = match?.[1]?.trim() ?? null;
  }
  return result;
}

function unresolvedCommands(commands) {
  const unresolved = [];
  for (const [key, value] of Object.entries(commands)) {
    if (value === null || value === '' || /^<define(?: or n\/a)?>$/i.test(value)) {
      unresolved.push(key);
    }
  }
  return unresolved;
}

function looksLikeTemplate(id, content) {
  const signals = TEMPLATE_SIGNALS[id] ?? [];
  return signals.some((signal) => content.includes(signal));
}

export async function runDoctor(targetDir) {
  const target = path.resolve(targetDir);
  const checks = [];

  let targetIsDirectory = false;
  try {
    targetIsDirectory = (await stat(target)).isDirectory();
  } catch {
    targetIsDirectory = false;
  }

  if (!targetIsDirectory) {
    return {
      target,
      stack: 'unknown',
      checks: [check('fail', 'target', 'Target directory', 'Target directory does not exist.', 'Pass an existing project directory.')],
      summary: { pass: 0, warn: 0, fail: 1 }
    };
  }

  const stack = await detectStack(target);
  checks.push(check('pass', 'target', 'Target directory', 'Project directory is readable.'));
  checks.push(check('pass', 'stack', 'Stack detection', stack === 'generic' ? 'No supported stack marker detected; generic rules apply.' : `Detected ${stack}.`));

  const agentsPath = path.join(target, 'AGENTS.md');
  if (!(await readableNonEmpty(agentsPath))) {
    checks.push(check('fail', 'agents', 'Agent instructions', 'AGENTS.md is missing or empty.', 'Run the initializer or add repository-wide agent rules.'));
  } else {
    const agents = await read(agentsPath);
    checks.push(check('pass', 'agents', 'Agent instructions', 'AGENTS.md is present.'));
    const commands = parseCommands(agents);
    const unresolved = unresolvedCommands(commands);
    if (unresolved.length === 0) {
      checks.push(check('pass', 'commands', 'Verification commands', 'All command slots are explicitly defined or marked n/a.'));
    } else {
      checks.push(check(
        'warn',
        'commands',
        'Verification commands',
        `${unresolved.length} command slot(s) still need a project-specific decision: ${unresolved.join(', ')}.`,
        'Define commands that apply to this repository; use n/a only when a check is intentionally not applicable.'
      ));
    }
  }

  let presentDocs = 0;
  let customizedDocs = 0;
  for (const [id, title, relative] of CORE_DOCS) {
    const file = path.join(target, relative);
    if (!(await readableNonEmpty(file))) {
      checks.push(check('fail', id, title, `${relative} is missing or empty.`, `Create and complete ${relative}.`));
      continue;
    }

    presentDocs += 1;
    const content = await read(file);
    if (looksLikeTemplate(id, content)) {
      checks.push(check('warn', id, title, `${relative} still contains starter-template signals.`, 'Replace template prompts/placeholders with project-specific decisions.'));
    } else {
      customizedDocs += 1;
      checks.push(check('pass', id, title, `${relative} is present and no known starter-template marker was found.`));
    }
  }

  const workflow = path.join(target, '.github/workflows/validate.yml');
  if (await readableNonEmpty(workflow)) {
    checks.push(check('pass', 'ci', 'CI validation', '.github/workflows/validate.yml is present.'));
  } else {
    checks.push(check('warn', 'ci', 'CI validation', 'Framework validation workflow is not installed.', 'Add equivalent CI gates in your provider, or install the GitHub workflow.'));
  }

  const validator = path.join(target, 'scripts/validate-framework.sh');
  if (await readableNonEmpty(validator)) {
    checks.push(check('pass', 'validator', 'Local validation', 'scripts/validate-framework.sh is available for local checks.'));
  } else {
    checks.push(check('warn', 'validator', 'Local validation', 'Local framework validation script is missing.', 'Restore scripts/validate-framework.sh or provide an equivalent command.'));
  }

  const promptPlanner = path.join(target, 'prompts/02-plan-task.md');
  const promptReviewer = path.join(target, 'prompts/04-code-review.md');
  if (await readableNonEmpty(promptPlanner) && await readableNonEmpty(promptReviewer)) {
    checks.push(check('pass', 'agent-loop', 'Plan/review loop', 'Planning and independent-review prompts are available.'));
  } else {
    checks.push(check('warn', 'agent-loop', 'Plan/review loop', 'Planning or review prompt is missing.', 'Restore the planning and code-review prompts or document an equivalent workflow.'));
  }

  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const item of checks) summary[item.status] += 1;

  return {
    target,
    stack,
    documents: { present: presentDocs, total: CORE_DOCS.length, customized: customizedDocs },
    checks,
    summary
  };
}

export function doctorExitCode(report, strict = false) {
  if (report.summary.fail > 0) return 1;
  if (strict && report.summary.warn > 0) return 1;
  return 0;
}

export function formatDoctorReport(report) {
  const icon = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };
  const lines = [
    'Vibe Coding Production Doctor',
    `Target: ${report.target}`,
    `Stack: ${report.stack}`,
    ''
  ];

  for (const item of report.checks) {
    lines.push(`[${icon[item.status]}] ${item.title}: ${item.detail}`);
    if (item.remediation && item.status !== 'pass') lines.push(`       Fix: ${item.remediation}`);
  }

  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);
  if (report.documents) {
    lines.push(`Core docs: ${report.documents.present}/${report.documents.total} present; ${report.documents.customized} without known starter-template markers.`);
  }
  return lines.join('\n');
}
