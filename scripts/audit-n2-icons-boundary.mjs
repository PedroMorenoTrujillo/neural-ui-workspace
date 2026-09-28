import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../projects/ui-core/', import.meta.url));
const failures = [];

function inspect(source, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    const specifier = node.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const moduleName = specifier.text;
    if (moduleName.startsWith('@neural-icons/')) {
      failures.push(`${filename}: productive Core import/export retains Neural Icons dependency ${moduleName}`);
    }
    if (moduleName.startsWith('@ng-icons/') || moduleName === '@neural-ui/core/icon') {
      failures.push(`${filename}: retired icon runtime import ${moduleName}`);
    }
  }
  if (source.includes('NeuIconComponent') || source.includes('provideAllNeuralIcons(')) {
    failures.push(`${filename}: retired wrapper or full-catalog registration`);
  }
  if (/import\s*\(\s*['"]@neural-icons\//.test(source)) {
    failures.push(`${filename}: dynamic Neural Icons import remains`);
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.d.ts')) {
      inspect(readFileSync(path, 'utf8'), relative(root, path));
    }
  }
}

inspect("import { iconSave } from '@neural-icons/core/icons/save';", 'synthetic-subpath-value.ts');
if (failures.length !== 1) throw new Error('N2 boundary self-test did not reject a value subpath import.');
failures.length = 0;
inspect("import type { NeuralIconName } from '@neural-icons/core';", 'synthetic-root-type.ts');
if (failures.length !== 1) throw new Error('N2 boundary self-test did not reject a type-only import.');
failures.length = 0;
inspect("export type { NeuralIconName } from '@neural-icons/core';", 'synthetic-reexport.ts');
if (failures.length !== 1) throw new Error('N2 boundary self-test did not reject a type re-export.');
failures.length = 0;

walk(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('N2 icon import boundary PASS: no productive runtime/type imports or exports from Neural Icons.');
}
