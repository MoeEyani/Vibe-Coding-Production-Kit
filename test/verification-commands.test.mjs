import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseAgentVerificationCommands,
  parseTaskVerificationCommands
} from '../lib/verification-commands.mjs';

test('agent verification parser excludes reasoned non-applicable values', () => {
  const commands = parseAgentVerificationCommands([
    'INSTALL_COMMAND=npm install',
    'FORMAT_CHECK_COMMAND=n/a — no formatter configured',
    'LINT_COMMAND=npm run check',
    'TYPECHECK_COMMAND=n/a - plain JavaScript',
    'UNIT_TEST_COMMAND=npm test',
    'INTEGRATION_TEST_COMMAND=not applicable — no integrations',
    'BUILD_COMMAND=n/a — no build step',
    'E2E_COMMAND=n/a — no UI'
  ].join('\n'));

  assert.deepEqual(commands, [
    { key: 'INSTALL_COMMAND', value: 'npm install' },
    { key: 'LINT_COMMAND', value: 'npm run check' },
    { key: 'UNIT_TEST_COMMAND', value: 'npm test' }
  ]);
});

test('task verification parser excludes reasoned non-applicable values before verify can execute them', () => {
  const task = `# Task — Parser regression\n\n## Verification commands\n\n- \`LINT_COMMAND\`: \`npm run check\`\n- \`TYPECHECK_COMMAND\`: \`n/a — plain JavaScript\`\n- \`UNIT_TEST_COMMAND\`: \`npm test\`\n- \`BUILD_COMMAND\`: \`not applicable — no build step\`\n`;

  assert.deepEqual(parseTaskVerificationCommands(task), [
    { key: 'LINT_COMMAND', command: 'npm run check' },
    { key: 'UNIT_TEST_COMMAND', command: 'npm test' }
  ]);
});
