import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uiCore = join(root, 'projects/ui-core');

const allowedNativeControlDirs = new Set([
  'autocomplete',
  'accordion',
  'alert',
  'bottom-sheet',
  'button',
  'calendar',
  'checkbox',
  'chip',
  'code-block',
  'color-picker',
  'command-palette',
  'confirm-dialog',
  'confirm-popup',
  'context-menu',
  'date-input',
  'data-view',
  'empty-state',
  'filter-bar',
  'image-gallery',
  'image-viewer',
  'input',
  'input-mask',
  'input-otp',
  'listbox',
  'menu',
  'modal',
  'multiselect',
  'nav',
  'notification-center',
  'number-input',
  'pagination',
  'panel',
  'password',
  'pick-list',
  'popover',
  'radio',
  'rating',
  'rich-text-editor',
  'select',
  'sidebar',
  'split-button',
  'stepper',
  'switch',
  'table',
  'tabs',
  'tags',
  'textarea',
  'timeline-grid',
  'toast',
  'toggle-button-group',
  'toolbar',
  'tree-select',
  'tree-table',
  'tree',
  'uploader',
]);

const allowedInlineSvgDirs = new Set([
  'accordion',
  'button',
  'checkbox',
  'chip',
  'code-block',
  'date-input',
  'input',
  'knob',
  'multiselect',
  'pagination',
  'password',
  'rating',
  'select',
  'spinner',
  'split-button',
  'stats-card',
  'stepper',
  'table',
  'timeline',
  'tree-table',
  'tree',
  'uploader',
]);

const allowedFragments = [
  'class="neu-table__edit-control"',
  "[type]=\"col.editor === 'number' ? 'number' : col.editor === 'date' ? 'date' : 'text'\"",
  'type="search"',
  "type='search'",
  'class="neu-table__search-clear"',
  'class="neu-table__export-btn"',
  'class="neu-table__selection-clear"',
  'class="neu-table__expand-btn"',
];

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

function componentDir(path) {
  return relative(uiCore, path).split('/')[0];
}

function isAllowed(path, snippet) {
  if (/<button\b[\s\S]*?\bneu-button\b/.test(snippet)) {
    return true;
  }

  if (allowedNativeControlDirs.has(componentDir(path))) {
    return true;
  }

  return allowedFragments.some((fragment) => snippet.includes(fragment));
}

function isInlineSvgAllowed(path, snippet) {
  if (allowedInlineSvgDirs.has(componentDir(path))) {
    return true;
  }

  return allowedFragments.some((fragment) => snippet.includes(fragment));
}

const violations = [];

for (const file of componentFiles(uiCore)) {
  const source = readFileSync(file, 'utf8');
  const checks = [
    { label: 'native checkbox', pattern: /type=["']checkbox["']/g },
    { label: 'native select', pattern: /<select\b/g },
    { label: 'native button', pattern: /<button\b/g },
  ];

  for (const check of checks) {
    for (const match of source.matchAll(check.pattern)) {
      const start = Math.max(0, match.index - 160);
      const end = Math.min(source.length, match.index + 240);
      const snippet = source.slice(start, end);

      if (isAllowed(file, snippet)) {
        continue;
      }

      const line = source.slice(0, match.index).split('\n').length;
      violations.push({
        file: relative(root, file),
        line,
        label: check.label,
      });
    }
  }

  for (const match of source.matchAll(/<svg\b/g)) {
    const start = Math.max(0, match.index - 160);
    const end = Math.min(source.length, match.index + 240);
    const snippet = source.slice(start, end);

    if (isInlineSvgAllowed(file, snippet)) {
      continue;
    }

    const line = source.slice(0, match.index).split('\n').length;
    violations.push({
      file: relative(root, file),
      line,
      label: 'inline svg',
    });
  }
}

if (violations.length) {
  console.error('Native visible controls or inline SVG found outside NeuralUI allowlists:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.label}`);
  }
  process.exit(1);
}

console.log('ui-core primitive audit passed');
