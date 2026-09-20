import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import {
  controlledSlices,
  invariants,
  legacyLedger,
  tableCoreTarget,
  targetDirectives,
  targetInputs,
  targetMethods,
  targetOutputs,
  targetTypes,
} from '../n2-table-contract-manifest.mjs';

const candidateRoot = 'projects/ui-core/table/next/public';
const typesPath = `${candidateRoot}/neu-table.types.ts`;
const componentPath = `${candidateRoot}/neu-table.component-contract.ts`;
const directivesPath = `${candidateRoot}/neu-table-template-contracts.ts`;
const currentComponentPath = 'projects/ui-core/table/neu-table.component.ts';

function source(path) {
  const text = readFileSync(path, 'utf8');
  return {
    text,
    file: ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true),
  };
}

function exportedDeclarations(path, predicate) {
  const { file } = source(path);
  return file.statements
    .filter(
      (statement) =>
        predicate(statement) &&
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
    )
    .map((statement) => statement.name?.text)
    .filter(Boolean);
}

function memberName(member) {
  return member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
}

function normalized(value) {
  return value.replace(/\s+/g, '');
}

export function collectCurrentTableMembers() {
  const { file } = source(currentComponentPath);
  const result = { input: [], output: [], method: [] };
  const declaration = file.statements.find(
    (statement) => ts.isClassDeclaration(statement) && statement.name?.text === 'NeuTableComponent',
  );
  if (!declaration || !ts.isClassDeclaration(declaration)) return result;

  for (const member of declaration.members) {
    const name = memberName(member);
    if (!name) continue;
    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      ts.isCallExpression(member.initializer)
    ) {
      const expression = member.initializer.expression;
      const factory = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.expression.getText(file)
          : '';
      if (factory === 'input' || factory === 'output') result[factory].push(name);
    }
    if (
      ts.isMethodDeclaration(member) &&
      !member.modifiers?.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.PrivateKeyword ||
          modifier.kind === ts.SyntaxKind.ProtectedKeyword,
      )
    ) {
      result.method.push(name);
    }
  }
  return result;
}

export function validateLegacyLedger() {
  const violations = [];
  const current = collectCurrentTableMembers();
  const allowed = new Set(['KEEP', 'CHANGE', 'MERGE', 'RENAME', 'REMOVE', 'INTERNALIZE']);

  for (const kind of ['input', 'output', 'method']) {
    const actual = current[kind];
    const entries = legacyLedger.filter((entry) => entry.kind === kind);
    const names = entries.map((entry) => entry.name);
    if (names.length !== new Set(names).size) violations.push(`${kind} ledger contains duplicates`);
    for (const name of actual) {
      if (!names.includes(name)) violations.push(`${kind} ${name} has no ledger entry`);
    }
    for (const name of names) {
      if (!actual.includes(name)) violations.push(`${kind} ledger contains stale member ${name}`);
    }
    for (const entry of entries) {
      if (!allowed.has(entry.disposition)) {
        violations.push(`${kind} ${entry.name} has invalid disposition ${entry.disposition}`);
      }
      for (const field of ['target', 'reason', 'migration']) {
        if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
          violations.push(`${kind} ${entry.name} is missing ${field}`);
        }
      }
    }
  }

  return violations;
}

function symlinkViolations(path) {
  const violations = [];
  for (const name of readdirSync(path)) {
    const child = join(path, name);
    const stat = lstatSync(child);
    if (stat.isSymbolicLink()) violations.push(relative('.', child));
    if (stat.isDirectory()) violations.push(...symlinkViolations(child));
  }
  return violations;
}

export function validateTargetContracts() {
  const violations = [];
  const actualTypes = exportedDeclarations(
    typesPath,
    (statement) => ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement),
  );
  const actualDirectives = exportedDeclarations(directivesPath, ts.isClassDeclaration);
  if (JSON.stringify(actualTypes) !== JSON.stringify(targetTypes)) {
    violations.push(
      `type export ledger differs: expected ${targetTypes.length}, found ${actualTypes.length}`,
    );
  }
  if (JSON.stringify(actualDirectives) !== JSON.stringify(targetDirectives)) {
    violations.push(
      `directive export ledger differs: expected ${targetDirectives.length}, found ${actualDirectives.length}`,
    );
  }

  const { text: componentText, file: componentFile } = source(componentPath);
  const component = componentFile.statements.find(
    (statement) => ts.isClassDeclaration(statement) && statement.name?.text === 'NeuTableComponent',
  );
  if (!component || !ts.isClassDeclaration(component)) {
    violations.push('candidate NeuTableComponent contract is missing');
  } else {
    const properties = component.members.filter(ts.isPropertyDeclaration);
    const methods = component.members.filter(ts.isMethodDeclaration);
    const inputMembers = properties.filter((member) =>
      member.type?.getText(componentFile).startsWith('InputSignal<'),
    );
    const outputMembers = properties.filter((member) =>
      member.type?.getText(componentFile).startsWith('OutputEmitterRef<'),
    );
    const checkMembers = (actual, expected, label) => {
      const names = actual.map(memberName);
      if (JSON.stringify(names) !== JSON.stringify(expected.map((entry) => entry.name))) {
        violations.push(`${label} names/order differ from the frozen manifest`);
      }
      for (const entry of expected) {
        const member = actual.find((candidate) => memberName(candidate) === entry.name);
        if (!member) continue;
        const actualType = member.type?.getText(componentFile) ?? '';
        if (normalized(actualType) !== normalized(entry.type)) {
          violations.push(`${label} ${entry.name} type differs: ${actualType}`);
        }
        if (
          !member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword)
        ) {
          violations.push(`${label} ${entry.name} is not readonly`);
        }
      }
    };
    checkMembers(inputMembers, targetInputs, 'input');
    checkMembers(outputMembers, targetOutputs, 'output');
    const methodNames = methods.map(memberName);
    if (JSON.stringify(methodNames) !== JSON.stringify(targetMethods.map((entry) => entry.name))) {
      violations.push('method names/order differ from the frozen manifest');
    }
  }

  const candidateText = [typesPath, componentPath, directivesPath]
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  if (/\bany\b/.test(candidateText)) violations.push('candidate contracts contain any');
  if (/\bEvent\b/.test(candidateText)) violations.push('candidate contracts contain DOM Event');
  if (/@angular\/(?:forms|router|cdk)/.test(candidateText)) {
    violations.push('candidate contracts import Forms, Router or CDK');
  }
  if (/table-core|localStorage|sessionStorage/.test(candidateText)) {
    violations.push('candidate contracts depend on TableCore or browser storage');
  }

  const manifestMembers = [...targetInputs, ...targetOutputs, ...targetMethods];
  for (const member of manifestMembers) {
    for (const field of ['owner', 'semantics', 'type', 'direction', 'category']) {
      if (typeof member[field] !== 'string' || member[field].trim() === '') {
        violations.push(`target member ${member.name} is missing ${field}`);
      }
    }
  }
  if (targetInputs.length !== 24 || targetOutputs.length !== 14 || targetMethods.length !== 4) {
    violations.push('target surface is not 24 inputs / 14 outputs / 4 methods');
  }
  if (targetTypes.length + targetDirectives.length + 1 !== 82) {
    violations.push('target export ledger is not exactly 82 symbols');
  }
  if (
    new Set(manifestMembers.map((member) => `${member.category}:${member.name}`)).size !==
    manifestMembers.length
  ) {
    violations.push('target member/category ledger contains duplicates');
  }

  for (const [input, proposal] of controlledSlices) {
    if (targetInputs.filter((entry) => entry.name === input).length !== 1) {
      violations.push(`controlled slice ${input} does not have one applied owner`);
    }
    if (
      targetOutputs.filter((entry) => entry.name === proposal && entry.category === 'PROPOSAL')
        .length !== 1
    ) {
      violations.push(`controlled slice ${input} does not have one proposal`);
    }
  }
  if (targetOutputs.filter((entry) => entry.name === 'dataRequest').length !== 1) {
    violations.push('remote data transport is not unique');
  }
  if (
    targetInputs.find((entry) => entry.name === 'rowKey')?.type ===
    targetInputs.find((entry) => entry.name === 'rowTrackBy')?.type
  ) {
    violations.push('rowKey and rowTrackBy collapsed into one contract');
  }
  for (const forbidden of [
    'first',
    'rows',
    'sortField',
    'sortOrder',
    'multiSortMeta',
    'lazyRequest',
    'serverStateChange',
    'stateStorage',
    'urlState',
  ]) {
    if (manifestMembers.some((entry) => entry.name === forbidden)) {
      violations.push(`legacy parallel state member ${forbidden} is present in target`);
    }
  }
  const typesText = readFileSync(typesPath, 'utf8');
  if (
    !/interface NeuTableRange\s*{[\s\S]*readonly start: number;[\s\S]*readonly end: number;[\s\S]*}/.test(
      typesText,
    )
  ) {
    violations.push('half-open range start/end contract is missing');
  }
  if (/\b(?:length|lastIndex): number;/.test(typesText)) {
    violations.push('range contracts contain ambiguous length/lastIndex');
  }

  const currentPublicApi = readFileSync('projects/ui-core/table/public_api.ts', 'utf8');
  if (currentPublicApi.includes('/next/') || currentPublicApi.includes("'./next")) {
    violations.push('candidate contracts leaked into the product entrypoint during N2-011A');
  }
  if (
    tableCoreTarget.publicTarget !== 'REMOVE' ||
    tableCoreTarget.physicalRemovalPhase !== 'N2-011K'
  ) {
    violations.push('TableCore target/removal phase is not frozen');
  }
  if (
    actualTypes.some((name) => name.includes('TableCore')) ||
    actualDirectives.some((name) => name.includes('TableCore'))
  ) {
    violations.push('candidate public target exposes TableCore');
  }

  const expectedInvariants = new Set([
    'ONE QUERY OWNER',
    'ONE REMOTE CHANNEL',
    'ONE SELECTION OWNER',
    'ROW KEY != TRACK BY',
    'HALF-OPEN RANGES',
    'NO ROUTER OWNERSHIP',
    'NO STORAGE OWNERSHIP',
    'NO PUBLIC TABLECORE TARGET',
    'NO LEGACY STATE PARALLELISM',
  ]);
  if (
    invariants.length !== expectedInvariants.size ||
    invariants.some((item) => !expectedInvariants.has(item))
  ) {
    violations.push('invariant ledger differs from the authorized minimum');
  }

  for (const path of [candidateRoot, 'fixtures/n2-table-contracts']) {
    for (const symlink of symlinkViolations(path))
      violations.push(`symlink is forbidden: ${symlink}`);
  }

  return violations;
}
