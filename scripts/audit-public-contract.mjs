import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const sourceRoot = join(root, 'projects/ui-core');
const distRoot = join(root, 'dist/neural-ui/core');
const snapshotPath = join(root, 'projects/ui-core/public-contract.snapshot.json');
const update = process.argv.includes('--update');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const sourceFiles = walk(sourceRoot).filter(
  (path) => /\.ts$/.test(path) && !/\.spec\.ts$/.test(path),
);
const components = {};
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      continue;
    }
    const decorators = ts.canHaveDecorators(statement) ? (ts.getDecorators(statement) ?? []) : [];
    const angularDecorator = decorators
      .map((decorator) => decorator.expression)
      .find(
        (expression) =>
          ts.isCallExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          ['Component', 'Directive'].includes(expression.expression.text),
      );
    if (!angularDecorator || !ts.isCallExpression(angularDecorator)) continue;
    const metadata = angularDecorator.arguments[0];
    if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;
    const selectorProperty = metadata.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) &&
        ts.isIdentifier(property.name) &&
        property.name.text === 'selector',
    );
    if (!selectorProperty || !ts.isPropertyAssignment(selectorProperty)) continue;
    const selectorInitializer = selectorProperty.initializer;
    if (!ts.isStringLiteralLike(selectorInitializer)) continue;
    const selector = selectorInitializer.text;
    if (!/(?:^|\[|\s|,)neu(?:-|[A-Z])/.test(selector)) continue;

    const inputs = [];
    const outputs = [];
    for (const member of statement.members) {
      if (!ts.isPropertyDeclaration(member) || !member.initializer || !member.name) continue;
      if (!ts.isIdentifier(member.name) && !ts.isStringLiteralLike(member.name)) continue;
      if (!ts.isCallExpression(member.initializer)) continue;
      const expression = member.initializer.expression;
      const callName = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)
          ? expression.expression.text
          : null;
      if (callName === 'input') inputs.push(member.name.text);
      if (callName === 'output') outputs.push(member.name.text);
    }

    const contractKey = `${relative(sourceRoot, path)}#${statement.name.text}`;
    components[contractKey] = {
      selector,
      inputs: unique(inputs),
      outputs: unique(outputs),
    };
  }
}

const packageJsonPath = join(distRoot, 'package.json');
if (!existsSync(packageJsonPath)) {
  console.error('Contract audit requires a compiled package. Run npm run build first.');
  process.exit(1);
}
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const tokensSource = readFileSync(join(sourceRoot, 'styles/_tokens.scss'), 'utf8');
const snapshot = {
  schemaVersion: 2,
  package: packageJson.name,
  exports: unique(Object.keys(packageJson.exports ?? {})),
  tokens: unique([...tokensSource.matchAll(/--(neu-[a-z0-9-]+)\s*:/g)].map((m) => `--${m[1]}`)),
  components: Object.fromEntries(Object.entries(components).sort(([a], [b]) => a.localeCompare(b))),
};
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

if (update) {
  writeFileSync(snapshotPath, serialized);
  console.log(`Public contract snapshot updated: ${relative(root, snapshotPath)}`);
  process.exit(0);
}
if (!existsSync(snapshotPath)) {
  console.error(
    'Public contract snapshot is missing. Run npm run snapshot:contracts after reviewing the API.',
  );
  process.exit(1);
}
const expected = readFileSync(snapshotPath, 'utf8');
if (expected !== serialized) {
  console.error(
    'Public API contract changed. Review the diff and update the snapshot only for an approved additive change.',
  );
  process.exit(1);
}
console.log(
  `Public contract audit passed (${snapshot.exports.length} exports, ${snapshot.tokens.length} tokens).`,
);
