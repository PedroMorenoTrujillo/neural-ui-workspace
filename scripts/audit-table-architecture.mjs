import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import ts from 'typescript';

const tableSourcePath = 'projects/ui-core/table/neu-table.component.ts';
const tableSource = readFileSync(tableSourcePath, 'utf8');
const sourceFile = ts.createSourceFile(tableSourcePath, tableSource, ts.ScriptTarget.Latest, true);

let inputs = 0;
let outputs = 0;
let supportedMethods = 0;
let totalMethods = 0;
const inputNames = new Set();

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

for (const statement of sourceFile.statements) {
  if (!ts.isClassDeclaration(statement) || statement.name?.text !== 'NeuTableComponent') continue;
  for (const member of statement.members) {
    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      ts.isCallExpression(member.initializer)
    ) {
      const expression = member.initializer.expression;
      const factory = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.expression.getText(sourceFile)
          : '';
      if (factory === 'input') {
        inputs += 1;
        if (ts.isIdentifier(member.name)) inputNames.add(member.name.text);
      }
      if (factory === 'output') outputs += 1;
    }
    if (ts.isMethodDeclaration(member)) {
      totalMethods += 1;
      if (
        !hasModifier(member, ts.SyntaxKind.PrivateKeyword) &&
        !hasModifier(member, ts.SyntaxKind.ProtectedKeyword)
      ) {
        supportedMethods += 1;
      }
    }
  }
}

const selectorPattern = /selector:\s*[`'"]([^`'"]+)[`'"]/g;
const selectors = readdirSync('projects/ui-core/table')
  .filter((file) => file.endsWith('.directive.ts'))
  .flatMap((file) => [
    ...readFileSync(`projects/ui-core/table/${file}`, 'utf8').matchAll(selectorPattern),
  ])
  .map((match) => match[1]);

const expected = { inputs: 77, outputs: 38, supportedMethods: 32, totalMethods: 292, selectors: 20 };
const actual = { inputs, outputs, supportedMethods, totalMethods, selectors: selectors.length };
const violations = Object.entries(expected)
  .filter(([key, value]) => actual[key] !== value)
  .map(([key, value]) => `public facade ${key}: expected ${value}, found ${actual[key]}`);

const requiredConfigInputs = [
  'labels',
  'filterOptions',
  'paginatorOptions',
  'exportOptions',
  'virtualizationOptions',
  'urlStateOptions',
];
const removedFacadeInputs = [
  'rowIdentity',
  'selectionMode',
  'expandable',
  'inlineEdit',
  'skeletonRows',
  'virtualScrollResizeDelay',
  'toolbarExtraRef',
  'emptyStateTemplate',
  'lazyPlaceholderTemplate',
];
for (const name of requiredConfigInputs) {
  if (!inputNames.has(name)) violations.push(`public facade is missing config input ${name}`);
}
for (const name of removedFacadeInputs) {
  if (inputNames.has(name)) violations.push(`removed facade input ${name} was reintroduced`);
}

for (const selector of [
  'ng-template[neuTableToolbar]',
  'ng-template[neuTableEmpty]',
  'ng-template[neuTableLazyPlaceholder]',
  'ng-template[neuTableBodySection]',
  'tr[neuTableManagedRow]',
]) {
  if (!selectors.includes(selector))
    violations.push(`public template selector ${selector} is missing`);
}

const coreSourcePaths = [
  'projects/ui-core/table-core/neu-table-core.component.ts',
  'projects/ui-core/table-core/neu-table-core-templates.directive.ts',
  'projects/ui-core/table-core/neu-table-core.types.ts',
];
const forbiddenSourceImports = [
  '@angular/forms',
  '@angular/router',
  '@angular/cdk',
  'rxjs',
  '@neural-ui/core/',
];
for (const path of coreSourcePaths) {
  const source = readFileSync(path, 'utf8');
  const sourceImports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  for (const dependency of forbiddenSourceImports) {
    if (sourceImports.some((specifier) => specifier.startsWith(dependency))) {
      violations.push(`${path}: forbidden core dependency ${dependency}`);
    }
  }
}

const coreFesmPath = 'dist/neural-ui/core/fesm2022/neural-ui-core-table-core.mjs';
const coreFesm = readFileSync(coreFesmPath);
const coreText = coreFesm.toString('utf8');
const runtimeImports = [...coreText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
const unexpectedRuntimeImports = runtimeImports.filter(
  (dependency) => dependency !== '@angular/core' && dependency !== '@angular/common',
);
if (unexpectedRuntimeImports.length > 0) {
  violations.push(
    `core FESM unexpected imports: ${[...new Set(unexpectedRuntimeImports)].join(', ')}`,
  );
}

const gzip = gzipSync(coreFesm, { level: 9 }).length;
const brotli = brotliCompressSync(coreFesm, {
  params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
}).length;
if (coreFesm.length > 60 * 1024) violations.push(`core FESM raw ${coreFesm.length}B exceeds 60KiB`);
if (gzip > 20 * 1024) violations.push(`core FESM gzip ${gzip}B exceeds 20KiB`);

if (violations.length > 0) {
  console.error('Table architecture audit failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `Table architecture audit passed (facade ${inputs}/${outputs}/${supportedMethods} supported methods/${selectors.length}; ${totalMethods} total methods; core ${coreFesm.length}B raw, ${gzip}B gzip, ${brotli}B Brotli; imports ${[...new Set(runtimeImports)].join(', ')}).`,
);
