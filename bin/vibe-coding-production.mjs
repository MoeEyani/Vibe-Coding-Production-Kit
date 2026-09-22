#!/usr/bin/env node
import { runCli } from '../lib/cli.mjs';

runCli(process.argv.slice(2)).catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
});
