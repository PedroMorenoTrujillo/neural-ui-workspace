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
    const isTypeOnly = node.isTypeOnly || (ts.isImportDeclaration(node) && (
      node.importClause?.isTypeOnly ||
      (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) &&
        node.importClause.namedBindings.elements.length > 0 &&
        node.importClause.namedBindings.elements.every((element) => element.isTypeOnly))
    ));
    if (moduleName === '@neural-icons/core' && !isTypeOnly) {
      failures.push(`${filename}: runtime Core root import retains the full icon catalog`);
    }
    if (moduleName.startsWith('@ng-icons/') || moduleName === '@neural-ui/core/icon') {
      failures.push(`${filename}: retired icon runtime import ${moduleName}`);
    }
  }
  if (source.includes('NeuIconComponent') || source.includes('provideAllNeuralIcons(')) {
    failures.push(`${filename}: retired wrapper or full-catalog registration`);
  }
  if (/import\s*\(\s*['"]@neural-icons\/core['"]\s*\)/.test(source)) {
    failures.push(`${filename}: dynamic Core root import retains the full icon catalog`);
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

inspect("import { iconSave } from '@neural-icons/core';", 'synthetic-root-value.ts');
if (failures.length !== 1) throw new Error('A0.2 boundary self-test did not reject a root value import.');
failures.length = 0;
inspect("import type { NeuralIconName } from '@neural-icons/core';", 'synthetic-root-type.ts');
if (failures.length) throw new Error('A0.2 boundary self-test rejected a type-only import.');
const typeOnlyJs = ts.transpileModule(
  "import type { NeuralIconName } from '@neural-icons/core'; export type Example = NeuralIconName;",
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
if (typeOnlyJs.includes('@neural-icons/core')) {
  throw new Error('A0.2 type-only Core root import was not erased from JavaScript.');
}

walk(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('N2 icon import boundary PASS: no runtime Core root imports or retired icon graph.');
}
