import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uiCore = join(root, 'projects/ui-core');

function componentFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...componentFiles(path));
      continue;
    }

    if (entry.endsWith('.component.ts')) {
      files.push(path);
    }
  }

  return files;
}

const requiredMethods = [
  'writeValue',
  'registerOnChange',
  'registerOnTouched',
  'setDisabledState',
];

const violations = [];
const cvaComponents = [];

for (const file of componentFiles(uiCore)) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('ControlValueAccessor') && !source.includes('NG_VALUE_ACCESSOR')) {
    continue;
  }

  const rel = relative(root, file);
  cvaComponents.push(rel);

  if (!source.includes('NG_VALUE_ACCESSOR')) {
    violations.push(`${rel}: missing NG_VALUE_ACCESSOR provider`);
  }

  if (!/implements\s+[^{}]*ControlValueAccessor/.test(source)) {
    violations.push(`${rel}: missing implements ControlValueAccessor`);
  }

  for (const method of requiredMethods) {
    if (!new RegExp(`\\b${method}\\s*\\(`).test(source)) {
      violations.push(`${rel}: missing ${method}()`);
    }
  }

  if (!/setDisabledState\s*\([^)]*\)\s*:\s*void\s*\{[\s\S]*?(disabled|isDisabled|_disabled|_cvaDisabled)/.test(source)) {
    violations.push(`${rel}: setDisabledState does not appear to update disabled state`);
  }
}

if (violations.length) {
  console.error('ui-core CVA contract audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`ui-core CVA contract audit passed (${cvaComponents.length} CVA components)`);
