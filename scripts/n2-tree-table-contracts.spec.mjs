import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import {
  hierarchyErrorCodes,
  targetDirectives,
  targetInputs,
  targetMethods,
  targetOutputs,
  targetTypes,
} from './n2-tree-table-contract-manifest.mjs';

const root = 'projects/ui-core/tree-table';
const typesPath = `${root}/public/neu-tree-table.types.ts`;
const directivesPath = `${root}/public/neu-tree-table-template-contracts.ts`;
const componentPath = `${root}/public/neu-tree-table.component-contract.ts`;
const typesSource = readFileSync(typesPath, 'utf8');
const directivesSource = readFileSync(directivesPath, 'utf8');
const componentSource = readFileSync(componentPath, 'utf8');

function sourceFile(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function exportedTypeNames() {
  return sourceFile(typesPath, typesSource)
    .statements.filter(
      (node) =>
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
        node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
    )
    .map((node) => node.name.text);
}

function exportedClassNames(path, source) {
  return sourceFile(path, source)
    .statements.filter(
      (node) =>
        ts.isClassDeclaration(node) &&
        node.name &&
        node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
    )
    .map((node) => node.name.text);
}

function membersByType(typeName) {
  const component = sourceFile(componentPath, componentSource).statements.find(
    (node) => ts.isClassDeclaration(node) && node.name?.text === 'NeuTreeTableComponent',
  );
  assert.ok(component && ts.isClassDeclaration(component));
  return component.members
    .filter(
      (member) =>
        ts.isPropertyDeclaration(member) &&
        member.name &&
        ts.isIdentifier(member.name) &&
        member.type?.getText().startsWith(typeName),
    )
    .map((member) => member.name.getText());
}

function publicMethods() {
  const component = sourceFile(componentPath, componentSource).statements.find(
    (node) => ts.isClassDeclaration(node) && node.name?.text === 'NeuTreeTableComponent',
  );
  assert.ok(component && ts.isClassDeclaration(component));
  return component.members
    .filter(
      (member) =>
        ts.isMethodDeclaration(member) &&
        member.name &&
        ts.isIdentifier(member.name) &&
        !member.modifiers?.some((modifier) =>
          [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(modifier.kind),
        ),
    )
    .map((member) => member.name.getText());
}

test('freezes the exact 66 + 11 + 1 and 22/12/4 candidate surface', () => {
  assert.deepEqual(exportedTypeNames(), targetTypes);
  assert.deepEqual(exportedClassNames(directivesPath, directivesSource), targetDirectives);
  assert.deepEqual(exportedClassNames(componentPath, componentSource), ['NeuTreeTableComponent']);
  assert.deepEqual(membersByType('InputSignal'), targetInputs);
  assert.deepEqual(membersByType('OutputEmitterRef'), targetOutputs);
  assert.deepEqual(publicMethods(), targetMethods);
});

test('keeps hierarchy inside featureError with a closed P1 code domain and no new output', () => {
  assert.match(typesSource, /readonly feature: 'hierarchy'/);
  for (const code of hierarchyErrorCodes) assert.match(typesSource, new RegExp(`'${code}'`));
  assert.doesNotMatch(typesSource, /readonly code:\s*string/);
  assert.equal(targetOutputs.length, 12);
  assert.ok(targetOutputs.includes('featureError'));
  assert.equal(
    targetOutputs.filter((name) => /hierarchy|diagnostic|treeError/i.test(name)).length,
    0,
  );
});

test('keeps public state readonly, generic and free of any, DOM Event and legacy aliases', () => {
  assert.doesNotMatch(typesSource, /\bany\b/);
  assert.doesNotMatch(typesSource, /\bEvent\b/);
  assert.doesNotMatch(typesSource, /\b(?:lazyLoad|nodeLoad|virtualLoad|serverRequest)\b/);
  for (const declaration of sourceFile(typesPath, typesSource).statements) {
    if (!ts.isInterfaceDeclaration(declaration)) continue;
    for (const member of declaration.members) {
      if (ts.isPropertySignature(member)) {
        assert.ok(
          member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword),
        );
      }
    }
  }
});

test('keeps the candidate isolated from the productive TreeTable entrypoint', () => {
  const productive = readFileSync('projects/ui-core/tree-table/public_api.ts', 'utf8');
  assert.doesNotMatch(productive, /tree-table\/next|neu-tree-table\.component-contract/);
});
