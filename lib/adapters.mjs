export const AGENT_CHOICES = ['generic', 'codex', 'cursor', 'claude', 'copilot', 'all'];

const claude = `# Claude Code project instructions

@AGENTS.md

Use \`AGENTS.md\` as the repository-wide source of truth. Read the relevant product, architecture, security, testing, and delivery documents before changing code. Keep this file thin; project policy belongs in \`AGENTS.md\`.
`;

const copilot = `# GitHub Copilot repository instructions

Follow the repository-wide engineering rules in \`AGENTS.md\`. Before implementing, read the relevant requirements, architecture, security, testing, and delivery documents. Plan before editing, keep changes narrowly scoped, run the configured verification commands, and review the final diff against the Definition of Done.

Do not duplicate or contradict \`AGENTS.md\`; update the source of truth instead.
`;

export function adapterFiles(agent) {
  const files = new Map();

  if (agent === 'claude' || agent === 'all') {
    files.set('CLAUDE.md', claude);
  }

  if (agent === 'copilot' || agent === 'all') {
    files.set('.github/copilot-instructions.md', copilot);
  }

  // Codex and Cursor both support AGENTS.md directly. Generic relies on it too.
  return files;
}

export function agentNote(agent) {
  switch (agent) {
    case 'codex':
      return 'Codex will use the generated AGENTS.md directly.';
    case 'cursor':
      return 'Cursor will use the generated AGENTS.md directly.';
    case 'claude':
      return 'CLAUDE.md was added as a thin adapter that imports AGENTS.md.';
    case 'copilot':
      return '.github/copilot-instructions.md was added as a thin adapter.';
    case 'all':
      return 'Adapters were added for Claude Code and GitHub Copilot; Codex and Cursor use AGENTS.md directly.';
    default:
      return 'Use AGENTS.md as the repository-wide instruction source.';
  }
}
