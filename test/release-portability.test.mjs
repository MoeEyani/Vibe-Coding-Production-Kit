import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { normalizeTemplateText } from '../lib/template.mjs';

test('published shell entrypoint is LF-only and has a portable shebang', async () => {
  const shell = await readFile(path.resolve('scripts/validate-framework.sh'));
  assert.equal(shell.includes(13), false);
  assert.match(shell.toString('utf8'), /^#!\/usr\/bin\/env bash\n/);
});

test('template text normalization canonicalizes CRLF before hashing or installation', () => {
  assert.equal(normalizeTemplateText('alpha\r\nbeta\r\n'), 'alpha\nbeta\n');
  assert.equal(normalizeTemplateText('alpha\rbeta\r'), 'alpha\nbeta\n');
});

test('repository attributes force text files to LF checkouts', async () => {
  const attributes = await readFile(path.resolve('.gitattributes'), 'utf8');
  assert.match(attributes, /^\* text=auto eol=lf/m);
});
