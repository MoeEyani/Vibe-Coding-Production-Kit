import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { AGENT_CHOICES } from './adapters.mjs';
import { initProject } from './init.mjs';
import { STACK_CHOICES } from './stacks.mjs';
import { doctorExitCode, formatDoctorReport, runDoctor } from './doctor.mjs';
import { createTaskPack } from './task.mjs';
import { CONTEXT_MODES, createContextPack, DEFAULT_CONTEXT_MAX_BYTES } from './context.mjs';
import { formatReadinessReport, readinessExitCode, READINESS_STAGES, runTaskReadiness } from './readiness.mjs';

const HELP = `Vibe Coding Production CLI

Usage:
  vibe-coding-production init [directory] [options]
  vcp init [directory] [options]
  vibe-coding-production doctor [directory] [--json] [--strict]
  vcp doctor [directory] [--json] [--strict]
  vibe-coding-production task <slug> [--title <text>] [--dir <directory>]
  vcp task <slug> [--title <text>] [--dir <directory>]
  vibe-coding-production ready <task> [--stage <name>] [--dir <directory>] [--json] [--strict]
  vcp ready <task> [--stage <name>] [--dir <directory>] [--json] [--strict]
  vibe-coding-production context <task> [--mode <name>] [--include <path>] [--output <path>]
  vcp context <task> [--mode <name>] [--include <path>] [--output <path>]

Options:
  --agent <name>     generic | codex | cursor | claude | copilot | all
  --stack <name>     auto | generic | typescript | python | go
  --yes, -y          Non-interactive mode (defaults: current dir, generic, GitHub files on)
  --force            Overwrite a managed output only after explicit opt-in
  --no-github        Do not install GitHub issue/PR/workflow files
  --dry-run          Preview without writing files
  --help, -h         Show help
  --json             Doctor/ready: emit machine-readable JSON
  --strict           Doctor/ready: return non-zero when warnings exist
  --title <text>     Task: human-readable task title
  --dir <directory>  Task/ready/context: repository directory (default: current directory)
  --stage <name>     Ready: plan | implement
  --mode <name>      Context: plan | implement | review | security | release
  --include <path>   Context: add a repository-local file; repeatable
  --output <path>    Context: write pack inside the repository instead of stdout
  --max-bytes <n>    Context: maximum rendered bytes (default: ${DEFAULT_CONTEXT_MAX_BYTES}; 0 disables)
  --version, -v      Show version

Examples:
  npx vibe-coding-production init
  npx vibe-coding-production doctor .
  npx vibe-coding-production task accept-invite --title "Accept invitation"
  npx vibe-coding-production ready accept-invite --stage plan
  npx vibe-coding-production context accept-invite --mode plan
  npx vibe-coding-production ready accept-invite --stage implement
`;

function parseArgs(args) {
  const parsed = {
    command: null,
    targetDir: null,
    agent: null,
    stack: null,
    yes: false,
    force: false,
    includeGitHub: true,
    dryRun: false,
    help: false,
    version: false,
    json: false,
    strict: false,
    title: null,
    taskDir: null,
    contextMode: 'plan',
    contextIncludes: [],
    contextOutput: null,
    contextMaxBytes: DEFAULT_CONTEXT_MAX_BYTES,
    readinessStage: 'plan'
  };

  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--json') parsed.json = true;
    else if (arg === '--strict') parsed.strict = true;
    else if (arg === '--version' || arg === '-v') parsed.version = true;
    else if (arg === '--yes' || arg === '-y') parsed.yes = true;
    else if (arg === '--force') parsed.force = true;
    else if (arg === '--no-github') parsed.includeGitHub = false;
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--title') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--title requires a value.');
      parsed.title = value;
      index += 1;
    } else if (arg.startsWith('--title=')) {
      parsed.title = arg.slice('--title='.length);
    } else if (arg === '--dir') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--dir requires a value.');
      parsed.taskDir = value;
      index += 1;
    } else if (arg.startsWith('--dir=')) {
      parsed.taskDir = arg.slice('--dir='.length);
    } else if (arg === '--stage') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--stage requires a value.');
      parsed.readinessStage = value.toLowerCase();
      index += 1;
    } else if (arg.startsWith('--stage=')) {
      parsed.readinessStage = arg.slice('--stage='.length).toLowerCase();
    } else if (arg === '--mode') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--mode requires a value.');
      parsed.contextMode = value.toLowerCase();
      index += 1;
    } else if (arg.startsWith('--mode=')) {
      parsed.contextMode = arg.slice('--mode='.length).toLowerCase();
    } else if (arg === '--include') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--include requires a value.');
      parsed.contextIncludes.push(value);
      index += 1;
    } else if (arg.startsWith('--include=')) {
      parsed.contextIncludes.push(arg.slice('--include='.length));
    } else if (arg === '--output') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--output requires a value.');
      parsed.contextOutput = value;
      index += 1;
    } else if (arg.startsWith('--output=')) {
      parsed.contextOutput = arg.slice('--output='.length);
    } else if (arg === '--max-bytes') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--max-bytes requires a value.');
      parsed.contextMaxBytes = Number(value);
      index += 1;
    } else if (arg.startsWith('--max-bytes=')) {
      parsed.contextMaxBytes = Number(arg.slice('--max-bytes='.length));
    } else if (arg === '--stack') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--stack requires a value.');
      parsed.stack = value.toLowerCase();
      index += 1;
    } else if (arg.startsWith('--stack=')) {
      parsed.stack = arg.slice('--stack='.length).toLowerCase();
    } else if (arg === '--agent') {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) throw new Error('--agent requires a value.');
      parsed.agent = value.toLowerCase();
      index += 1;
    } else if (arg.startsWith('--agent=')) {
      parsed.agent = arg.slice('--agent='.length).toLowerCase();
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  parsed.command = positional[0] ?? null;
  parsed.targetDir = positional[1] ?? null;
  if (positional.length > 2) throw new Error(`Unexpected argument: ${positional[2]}`);
  return parsed;
}

async function promptForOptions(parsed) {
  if (parsed.yes) {
    return {
      targetDir: parsed.targetDir ?? '.',
      agent: parsed.agent ?? 'generic',
      stack: parsed.stack ?? 'auto',
      includeGitHub: parsed.includeGitHub,
      force: parsed.force,
      dryRun: parsed.dryRun
    };
  }

  const rl = createInterface({ input, output });
  try {
    const targetAnswer = parsed.targetDir ?? await rl.question('Target directory [.]: ');
    const targetDir = targetAnswer.trim() || '.';

    let agent = parsed.agent;
    if (!agent) {
      const answer = await rl.question('AI tool [generic/codex/cursor/claude/copilot/all] (generic): ');
      agent = answer.trim().toLowerCase() || 'generic';
    }

    let stack = parsed.stack;
    if (!stack) {
      const stackAnswer = await rl.question('Stack [auto/generic/typescript/python/go] (auto): ');
      stack = stackAnswer.trim().toLowerCase() || 'auto';
    }

    let includeGitHub = parsed.includeGitHub;
    if (parsed.includeGitHub) {
      const githubAnswer = await rl.question('Install GitHub PR/issue/validation files? [Y/n]: ');
      includeGitHub = !['n', 'no'].includes(githubAnswer.trim().toLowerCase());
    }

    return { targetDir, agent, stack, includeGitHub, force: parsed.force, dryRun: parsed.dryRun };
  } finally {
    rl.close();
  }
}

function validateAgent(agent) {
  if (!AGENT_CHOICES.includes(agent)) {
    throw new Error(`Unknown agent "${agent}". Choose one of: ${AGENT_CHOICES.join(', ')}.`);
  }
}

function validateStack(stack) {
  if (!STACK_CHOICES.includes(stack)) {
    throw new Error(`Unknown stack \"${stack}\". Choose one of: ${STACK_CHOICES.join(', ')}.`);
  }
}

function printResult(result) {
  const verb = result.dryRun ? 'Would install' : 'Installed';
  console.log(`\n${verb} Vibe Coding Production Kit in ${result.target}`);
  console.log(`Files/paths: ${result.files.length}`);
  console.log(result.note);
  console.log(`Stack profile: ${result.stack}`);
  if (!result.dryRun) {
    console.log('\nNext:');
    console.log('  1. Fill docs/product/PRODUCT-BRIEF.md');
    console.log('  2. Fill docs/product/PRD.md and acceptance criteria');
    console.log('  3. Customize AGENTS.md with your real project commands');
    console.log('  4. Start each coding task with prompts/02-plan-task.md');
  }
}

export async function runCli(args) {
  const parsed = parseArgs(args);

  if (parsed.version) {
    const { default: pkg } = await import('../package.json', { with: { type: 'json' } });
    console.log(pkg.version);
    return;
  }

  if (parsed.help || parsed.command === null) {
    console.log(HELP);
    return;
  }

  if (parsed.command === 'doctor') {
    const report = await runDoctor(path.resolve(parsed.targetDir ?? '.'));
    console.log(parsed.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report));
    process.exitCode = doctorExitCode(report, parsed.strict);
    return;
  }

  if (parsed.command === 'task') {
    const slug = parsed.targetDir;
    if (!slug) throw new Error('Task command requires a slug, for example: vcp task accept-invite.');
    const result = await createTaskPack({
      targetDir: path.resolve(parsed.taskDir ?? '.'),
      slug,
      title: parsed.title,
      force: parsed.force,
      dryRun: parsed.dryRun
    });
    const verb = result.dryRun ? 'Would create' : 'Created';
    console.log(`${verb} task pack: ${result.relative}`);
    console.log(`Verification commands discovered from AGENTS.md: ${result.commandCount}`);
    return;
  }

  if (parsed.command === 'ready') {
    const task = parsed.targetDir;
    if (!task) throw new Error('Ready command requires a task slug or task file path.');
    if (!READINESS_STAGES.includes(parsed.readinessStage)) {
      throw new Error(`Unknown readiness stage "${parsed.readinessStage}". Choose one of: ${READINESS_STAGES.join(', ')}.`);
    }
    const report = await runTaskReadiness({
      targetDir: path.resolve(parsed.taskDir ?? '.'),
      task,
      stage: parsed.readinessStage
    });
    console.log(parsed.json ? JSON.stringify(report, null, 2) : formatReadinessReport(report));
    process.exitCode = readinessExitCode(report, parsed.strict);
    return;
  }

  if (parsed.command === 'context') {
    const task = parsed.targetDir;
    if (!task) throw new Error('Context command requires a task slug or task file path.');
    if (!CONTEXT_MODES.includes(parsed.contextMode)) {
      throw new Error(`Unknown context mode "${parsed.contextMode}". Choose one of: ${CONTEXT_MODES.join(', ')}.`);
    }
    const result = await createContextPack({
      targetDir: path.resolve(parsed.taskDir ?? '.'),
      task,
      mode: parsed.contextMode,
      includes: parsed.contextIncludes,
      output: parsed.contextOutput,
      maxBytes: parsed.contextMaxBytes,
      force: parsed.force,
      dryRun: parsed.dryRun
    });
    if (result.output) {
      const verb = result.dryRun ? 'Would write' : 'Wrote';
      console.log(`${verb} ${result.mode} context pack: ${result.output}`);
      console.log(`Context files: ${result.files.length}; rendered bytes: ${result.bytes}`);
    } else {
      console.log(result.content);
    }
    return;
  }

  if (parsed.command !== 'init') {
    throw new Error(`Unknown command: ${parsed.command}\n\n${HELP}`);
  }

  const options = await promptForOptions(parsed);
  validateAgent(options.agent);
  validateStack(options.stack);

  const result = await initProject({
    targetDir: path.resolve(options.targetDir),
    agent: options.agent,
    stack: options.stack,
    includeGitHub: options.includeGitHub,
    force: options.force,
    dryRun: options.dryRun
  });

  printResult(result);
}
