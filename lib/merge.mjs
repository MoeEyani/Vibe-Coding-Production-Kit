const MAX_LCS_CELLS = 4_000_000;

function lcsTable(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Uint32Array(cols));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

function diffHunks(baseLines, nextLines) {
  const table = lcsTable(baseLines, nextLines);
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < baseLines.length || j < nextLines.length) {
    if (i < baseLines.length && j < nextLines.length && baseLines[i] === nextLines[j]) {
      ops.push({ type: 'equal', line: baseLines[i] });
      i += 1;
      j += 1;
    } else if (j < nextLines.length && (i === baseLines.length || table[i][j + 1] >= table[i + 1][j])) {
      ops.push({ type: 'insert', line: nextLines[j] });
      j += 1;
    } else {
      ops.push({ type: 'delete', line: baseLines[i] });
      i += 1;
    }
  }

  const hunks = [];
  let baseIndex = 0;
  let current = null;
  function flush() {
    if (!current) return;
    hunks.push(current);
    current = null;
  }
  for (const op of ops) {
    if (op.type === 'equal') {
      flush();
      baseIndex += 1;
      continue;
    }
    if (!current) current = { start: baseIndex, end: baseIndex, lines: [] };
    if (op.type === 'delete') {
      current.end += 1;
      baseIndex += 1;
    } else {
      current.lines.push(op.line);
    }
  }
  flush();
  return hunks;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function hunksConflict(a, b) {
  if (a.start === b.start && a.end === b.end && arraysEqual(a.lines, b.lines)) return false;
  const aInsert = a.start === a.end;
  const bInsert = b.start === b.end;
  if (aInsert && bInsert) return a.start === b.start;
  if (aInsert) return a.start > b.start && a.start < b.end;
  if (bInsert) return b.start > a.start && b.start < a.end;
  return Math.max(a.start, b.start) < Math.min(a.end, b.end);
}

function splitLines(text) {
  if (text.length === 0) return { lines: [], hasFinalNewline: false };
  const normalized = text.replaceAll('\r\n', '\n');
  const hasFinalNewline = normalized.endsWith('\n');
  const lines = normalized.split('\n');
  if (hasFinalNewline) lines.pop();
  return { lines, hasFinalNewline };
}

function mergeWouldExceedLimit(baseLines, candidateLines) {
  return (baseLines.length + 1) * (candidateLines.length + 1) > MAX_LCS_CELLS;
}

export function threeWayMerge(baseText, currentText, nextText) {
  if (currentText === baseText) return { clean: true, content: nextText, kind: 'upstream-only' };
  if (nextText === baseText) return { clean: true, content: currentText, kind: 'user-only' };
  if (currentText === nextText) return { clean: true, content: currentText, kind: 'same-change' };

  const baseSplit = splitLines(baseText);
  const currentSplit = splitLines(currentText);
  const nextSplit = splitLines(nextText);

  if (
    mergeWouldExceedLimit(baseSplit.lines, currentSplit.lines)
    || mergeWouldExceedLimit(baseSplit.lines, nextSplit.lines)
  ) {
    return {
      clean: false,
      reason: 'File is too large for bounded automatic three-way merge; resolve it manually.'
    };
  }

  const currentHunks = diffHunks(baseSplit.lines, currentSplit.lines);
  const nextHunks = diffHunks(baseSplit.lines, nextSplit.lines);

  for (const left of currentHunks) {
    for (const right of nextHunks) {
      if (hunksConflict(left, right)) {
        return {
          clean: false,
          reason: `Overlapping edits around base lines ${Math.min(left.start, right.start) + 1}-${Math.max(left.end, right.end) + 1}.`
        };
      }
    }
  }

  const all = [];
  for (const hunk of currentHunks) all.push({ ...hunk, source: 'current' });
  for (const hunk of nextHunks) {
    const duplicate = all.find((candidate) => (
      candidate.start === hunk.start
      && candidate.end === hunk.end
      && arraysEqual(candidate.lines, hunk.lines)
    ));
    if (!duplicate) all.push({ ...hunk, source: 'next' });
  }
  all.sort((a, b) => a.start - b.start || a.end - b.end || a.source.localeCompare(b.source));

  const output = [];
  let cursor = 0;
  for (const hunk of all) {
    if (hunk.start < cursor) {
      return { clean: false, reason: 'Internal merge overlap detected.' };
    }
    output.push(...baseSplit.lines.slice(cursor, hunk.start));
    output.push(...hunk.lines);
    cursor = hunk.end;
  }
  output.push(...baseSplit.lines.slice(cursor));

  const finalNewline = currentSplit.hasFinalNewline
    || nextSplit.hasFinalNewline
    || baseSplit.hasFinalNewline;
  return {
    clean: true,
    content: output.join('\n') + (finalNewline ? '\n' : ''),
    kind: 'auto-merge'
  };
}
