#!/usr/bin/env node
/**
 * Copies a phase skill's templates/ folder into a project and fills {{PLACEHOLDERS}}.
 *
 *   node copyTemplates.mjs --from <skill>/templates --to <projectDir> [--vars <vars.json>] [--force]
 *
 * - Placeholders are `{{UPPER_SNAKE}}` keys from the vars JSON (default: <projectDir>/.claude/expo-setup.json).
 * - Existing files are skipped unless --force (the skill decides what may be overwritten).
 * - Binary files are copied byte for byte.
 * - Prints every file written/skipped and any placeholder left unfilled.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const from = opt('from');
const to = opt('to');
const force = args.includes('--force');
if (!from || !to) {
  console.error('usage: --from <templatesDir> --to <projectDir> [--vars <json>] [--force]');
  process.exit(1);
}
const varsPath = opt('vars') ?? path.join(to, '.claude', 'expo-setup.json');
const vars = fs.existsSync(varsPath) ? JSON.parse(fs.readFileSync(varsPath, 'utf8')) : {};

const written = [];
const skipped = [];
const unfilled = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else copyFile(abs);
  }
}

function copyFile(abs) {
  const rel = path.relative(from, abs);
  const dest = path.join(to, rel);
  if (fs.existsSync(dest) && !force) {
    skipped.push(rel);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const buf = fs.readFileSync(abs);
  if (buf.includes(0)) {
    fs.writeFileSync(dest, buf);
  } else {
    const text = buf.toString('utf8').replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g, (match, key) => {
      if (key in vars) return String(vars[key]);
      unfilled.set(key, [...(unfilled.get(key) ?? []), rel]);
      return match;
    });
    fs.writeFileSync(dest, text);
  }
  written.push(rel);
}

walk(from);
console.log(`written (${written.length}):`);
for (const f of written) console.log(`  + ${f}`);
if (skipped.length) {
  console.log(`skipped — already exist (${skipped.length}); merge by hand or rerun with --force:`);
  for (const f of skipped) console.log(`  = ${f}`);
}
if (unfilled.size) {
  console.log('unfilled placeholders — fill these by hand:');
  for (const [key, files] of unfilled) console.log(`  {{${key}}} in ${[...new Set(files)].join(', ')}`);
}
