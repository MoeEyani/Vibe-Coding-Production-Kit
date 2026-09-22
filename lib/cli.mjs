import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { AGENT_CHOICES } from './adapters.mjs';
import { initProject } from './init.mjs';
import { STACK_CHOICES } from './stacks.mjs';
import { doctorExitCode, formatDoctorReport, runDoctor } from './doctor.mjs';
import { createTaskPack } from './task.mjs';

const HELP = `Vibe Coding Production CLI\n\nUsage:\n  vibe-coding-production init [directory] [options]\n  vcp init [directory] [options]\n  vibe-coding-production doctor [directory] [--json] [--strict]\n  vcp doctor [directory] [--json] [--strict]\n  vibe-coding-production task <slug> [--title <text>] [--dir <directory>]\n  vcp task <slug> [--title <text>] [--dir <directory>]\n\nOptions:\n  --agent <name>    generic | codex | cursor | claude | copilot | all\n  --stack <name>    auto | generic | typescript | python | go\n  --yes, -y         Non-interactive mode (defaults: current dir, generic, GitHub files on)\n  --force           Overwrite framework-managed paths after explicit opt-in\n  --no-github       Do not install GitHub issue/PR/workflow files\n  --dry-run         Show what would be installed without writing files\n  --help, -h        Show help\n  --json            Doctor: emit machine-readable JSON\n  --strict          Doctor: return non-zero when warnings exist\n  --title <text>     Task: human-readable task title\n  --dir <directory>  Task: repository directory (default: current directory)\n  --version, -v     Show version\n\nExamples:\n  npx vibe-coding-production init\n  npx vibe-coding-production init . --agent claude\n  npx vibe-coding-production init ./my-app --agent all --yes\n  npx vibe-coding-production init . --dry-run\n  npx vibe-coding-production doctor .\n  npx vibe-coding-production task accept-invite --title \"Accept invitation\"\n`;

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
    taskDir: null
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
