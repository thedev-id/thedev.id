#!/usr/bin/env node

/**
 * Validates (and auto-fixes) subdomains.json before it gets sorted/claimed.
 *
 * Usage: node scripts/fix-subdomains.js [path/to/subdomains.json]
 *
 * - If the JSON is already valid, does nothing.
 * - If it is invalid, attempts an automatic fix for missing commas between
 *   adjacent flat entries, e.g.:
 *
 *     "ichsan": "ichsanputr.github.io"
 *     "ik3": "ik3.github.io",
 *
 *   becomes:
 *
 *     "ichsan": "ichsanputr.github.io",
 *     "ik3": "ik3.github.io",
 *
 * - Re-validates after fixing. Exits non-zero if the file still cannot be parsed.
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'subdomains.json');

const raw = fs.readFileSync(filePath, 'utf8');
const lines = raw.split('\n');

function tryParse() {
  return JSON.parse(raw);
}

try {
  const data = tryParse();
  console.log(`subdomains.json is valid JSON (${Object.keys(data).length} entries).`);
  process.exit(0);
} catch (err) {
  console.log(`subdomains.json is NOT valid JSON: ${err.message}`);

  const pairRe = /^(\s*)"([^"]+)":\s*"([^"]*)"\s*$/;
  const nextRe = /^\s*"[^"]+":/;

  const fixedLines = [...lines];
  let changed = false;

  for (let i = 0; i < fixedLines.length - 1; i++) {
    const current = fixedLines[i];
    const next = fixedLines[i + 1];
    const match = current.match(pairRe);

    if (!match) continue;
    if (next.trim() === '') continue;
    if (nextRe.test(next)) {
      fixedLines[i] = current.replace(/\s*$/, ',') + '';
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, fixedLines.join('\n'));
    console.log('Auto-fixed missing commas.');
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`subdomains.json now valid JSON (${Object.keys(data).length} entries).`);
  } catch (e) {
    console.error(`Could not auto-fix: ${e.message}`);
    process.exit(1);
  }
}
