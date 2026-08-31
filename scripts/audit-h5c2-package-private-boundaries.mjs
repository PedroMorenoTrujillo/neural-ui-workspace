import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const baseline = JSON.parse(
  execFileSync(
    'git',
    [
      'show',
      '9bf0142bd36c706f693d0951c80064938eab258d:projects/ui-core/public-contract.v2.json',
    ],
    { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  ),
);
const h5c1 = JSON.parse(
  execFileSync(
    'git',
    [
      'show',
      '83cb607bec4258e578112ea5ecddee4b0262e78e:projects/ui-core/public-contract.v2.json',
    ],
    { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  ),
);

function flat(contract) {
  return contract.items.flatMap((item) => [
    item,
    ...item.members.map((member) => ({
      ...member,
      entrypoint: item.entrypoint,
      parent: item.name,
      parentKind: item.kind,
    })),
  ]);
}

const currentIds = new Set(flat(h5c1).map((item) => item.id));
const candidates = flat(baseline).filter(
  (item) =>
    item.parent &&
    item.status === 'INTERNAL/UNSUPPORTED' &&
    !item.name.startsWith('ɵ') &&
    currentIds.has(item.id) &&
    !(item.entrypoint === './option-api' && item.parent.startsWith('ɵ')),
);

function filesUnder(path) {
  const out = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

const files = filesUnder(join(root, 'projects/ui-core'));
const sources = new Map(
  files.map((file) => [
    file,
    ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true),
  ]),
);
const classes = new Map();

for (const [file, source] of sources) {
  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const name = node.name.text;
      const decorators = ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
      let angularMetadata = '';
      for (const decorator of decorators) {
        if (!ts.isCallExpression(decorator.expression)) continue;
        const callee = decorator.expression.expression.getText(source);
        if (!['Component', 'Directive'].includes(callee)) continue;
        angularMetadata += decorator.expression.arguments
          .map((argument) => argument.getText(source))
          .join('\n');
      }
      const members = new Map();
      for (const member of node.members) {
        const memberName = member.name && ts.isIdentifier(member.name) ? member.name.text : null;
        if (!memberName) continue;
        const modifiers = ts.canHaveModifiers(member)
          ? (ts.getModifiers(member) ?? []).map((modifier) => modifier.getText(source))
          : [];
        members.set(memberName, { node: member, modifiers });
      }
      const record = { file, source, node, members, angularMetadata };
      const existing = classes.get(name);
      classes.set(
        name,
        existing ? [...(Array.isArray(existing) ? existing : [existing]), record] : record,
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

const frameworkNames = new Set([
  'ngAfterContentInit',
  'ngAfterViewInit',
  'ngDoCheck',
  'ngOnChanges',
  'ngOnDestroy',
  'ngOnInit',
  'ngTemplateContextGuard',
  'registerOnChange',
  'registerOnTouched',
  'setDisabledState',
  'writeValue',
]);

function escaped(value) {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}

const results = [];
for (const item of candidates) {
  const matches = classes.get(item.parent);
  const records = matches ? (Array.isArray(matches) ? matches : [matches]) : [];
  const record = records.find((entry) => entry.members.has(item.name));
  if (!record) {
    results.push({
      ...item,
      disposition:
        item.parentKind === 'interface'
          ? 'TYPE_ONLY_INTERNALIZATION'
          : 'UNRESOLVED_SOURCE',
    });
    continue;
  }
  const member = record.members.get(item.name);
  const name = escaped(item.name);
  const templateVisible = new RegExp(`\\b${name}\\b`).test(record.angularMetadata);
  const outsideOwnClass =
    record.source.text.slice(0, record.node.pos) + record.source.text.slice(record.node.end);
  const sameFileExternal = new RegExp(`(?:\\.|\\[['"])${name}\\b`).test(outsideOwnClass);
  const otherFileExternal = [...sources.entries()].some(
    ([file, source]) =>
      file !== record.file && new RegExp(`(?:\\.|\\[['"])${name}\\b`).test(source.text),
  );
  const alreadyRestricted =
    member.modifiers.includes('private') || member.modifiers.includes('protected');
  const frameworkVisible = frameworkNames.has(item.name);
  const disposition = frameworkVisible
    ? 'FRAMEWORK_VISIBLE'
    : templateVisible
      ? 'PROTECTED_TEMPLATE_VISIBLE'
      : 'PRIVATE_CLASS_MEMBER';
  results.push({
    id: item.id,
    parent: item.parent,
    name: item.name,
    kind: item.kind,
    file: relative(root, record.file),
    modifiers: member.modifiers,
    templateVisible,
    sameFileExternal,
    otherFileExternal,
    frameworkVisible,
    disposition,
    insertionPosition: (() => {
      const decorators = ts.canHaveDecorators(member.node)
        ? (ts.getDecorators(member.node) ?? [])
        : [];
      if (!decorators.length) return member.node.getStart(record.source);
      let position = decorators.at(-1).end;
      while (/\s/.test(record.source.text[position] ?? '')) position += 1;
      return position;
    })(),
  });
}

const counts = Object.groupBy(results, (item) => item.disposition);
const dependencyRetained = new Set([
  './radio#NeuRadioGroupComponent.property:_isDisabled',
  './radio#NeuRadioGroupComponent.property:_name',
  './radio#NeuRadioGroupComponent.property:_value',
]);
const hostVisible = new Set([
  './autocomplete#NeuAutocompleteComponent.method:onDocClick',
  './autocomplete#NeuAutocompleteComponent.method:onWindowResize',
  './color-picker#NeuColorPickerComponent.method:_outsideClick',
]);
const h5c2Targets = results
  .filter((item) => item.disposition !== 'FRAMEWORK_VISIBLE')
  .map((item) => {
    let action;
    if (dependencyRetained.has(item.id)) action = 'KEEP_PHYSICALLY_PUBLISHED_DEPENDENCY';
    else if (hostVisible.has(item.id) || item.disposition === 'PROTECTED_TEMPLATE_VISIBLE') {
      action = 'PROTECTED_TEMPLATE_VISIBLE_MEMBER';
    } else if (item.disposition === 'PRIVATE_CLASS_MEMBER') {
      action = 'PRIVATE_CLASS_MEMBER';
    } else {
      action = 'TYPE_ONLY_INTERNALIZATION';
    }
    return {
      id: item.id,
      definingFile: item.file ?? 'projects/ui-core/tree-table/neu-tree-table.types.ts',
      entrypoint: item.entrypoint,
      declaration: item.parent,
      member: item.name,
      kind: item.kind,
      action,
      templateVisible: item.templateVisible ?? false,
      frameworkVisible: item.frameworkVisible ?? false,
    };
  });
const targetCounts = Object.groupBy(h5c2Targets, (item) => item.action);
const ledger = {
  schemaVersion: 1,
  baseline: '83cb607bec4258e578112ea5ecddee4b0262e78e',
  sourceClassificationBaseline: '9bf0142bd36c706f693d0951c80064938eab258d',
  summary: {
    total: h5c2Targets.length,
    actions: Object.fromEntries(
      Object.entries(targetCounts).map(([key, value]) => [key, value.length]),
    ),
  },
  symbols: h5c2Targets.sort((left, right) => left.id.localeCompare(right.id)),
};
if (process.argv.includes('--update-ledger')) {
  writeFileSync(
    join(root, 'docs/H5C2_PACKAGE_PRIVATE_LEDGER.json'),
    `${JSON.stringify(ledger, null, 2)}\n`,
  );
}
const errors = [];
const expectedActions = {
  PRIVATE_CLASS_MEMBER: 73,
  PROTECTED_TEMPLATE_VISIBLE_MEMBER: 245,
  KEEP_PHYSICALLY_PUBLISHED_DEPENDENCY: 3,
  TYPE_ONLY_INTERNALIZATION: 9,
};
if (h5c2Targets.length !== 330) errors.push(`expected 330 targets, found ${h5c2Targets.length}`);
for (const [action, expected] of Object.entries(expectedActions)) {
  const actual = targetCounts[action]?.length ?? 0;
  if (actual !== expected) errors.push(`${action}: expected ${expected}, found ${actual}`);
}
for (const target of h5c2Targets) {
  if (target.action === 'TYPE_ONLY_INTERNALIZATION') continue;
  const result = results.find((candidate) => candidate.id === target.id);
  if (!result) {
    errors.push(`${target.id}: source declaration missing`);
    continue;
  }
  if (target.action === 'PRIVATE_CLASS_MEMBER' && !result.modifiers.includes('private')) {
    errors.push(`${target.id}: expected private`);
  }
  if (
    target.action === 'PROTECTED_TEMPLATE_VISIBLE_MEMBER' &&
    !result.modifiers.includes('protected')
  ) {
    errors.push(`${target.id}: expected protected`);
  }
  if (
    target.action === 'KEEP_PHYSICALLY_PUBLISHED_DEPENDENCY' &&
    (result.modifiers.includes('private') || result.modifiers.includes('protected'))
  ) {
    errors.push(`${target.id}: sibling-composition dependency must remain physically accessible`);
  }
}

const optionApi = readFileSync(join(root, 'projects/ui-core/option-api/public_api.ts'), 'utf8');
if (/ɵ|neu-option-foundation|neu-option-interaction-foundations/.test(optionApi)) {
  errors.push('option-api still exposes an implementation foundation');
}
const foundation = readFileSync(join(root, 'projects/ui-core/foundation/neu-hydration-foundation.ts'), 'utf8');
for (const service of ['NeuIdGenerator', 'NeuInitialTemporalState', 'NeuResponsiveState']) {
  if (foundation.includes(service)) errors.push(`foundation still physically declares ${service}`);
}
const internalApi = readFileSync(join(root, 'projects/ui-core/internal/public_api.ts'), 'utf8');
const optionExports = [
  ...internalApi.matchAll(/\b(?:InternalNeu\w+|INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS|(?:create|derive|filter|normalize|constrain)Neu\w+)/g),
].map((match) => match[0]);
if (new Set(optionExports).size !== 22) {
  errors.push(`internal Option ledger expected 22 exports, found ${new Set(optionExports).size}`);
}

const sourceCorpus = files.map((file) => readFileSync(file, 'utf8')).join('\n');
for (const removedPath of ['@neural-ui/core/menu-foundation', '@neural-ui/core/tree-foundation']) {
  if (sourceCorpus.includes(removedPath)) errors.push(`source still imports ${removedPath}`);
}
for (const forbiddenRoot of ['fixtures', 'schematics']) {
  const directory = join(root, forbiddenRoot);
  if (!existsSync(directory)) continue;
  const corpus = filesUnder(directory).map((file) => readFileSync(file, 'utf8')).join('\n');
  if (corpus.includes('@neural-ui/core/internal')) {
    errors.push(`${forbiddenRoot} imports the unsupported internal entrypoint`);
  }
}

const packageJsonPath = join(root, 'dist/neural-ui/core/package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  if (!packageJson.exports?.['./internal']) errors.push('built package is missing ./internal export');
  if (packageJson.exports?.['./menu-foundation']) errors.push('built package retains ./menu-foundation');
  if (packageJson.exports?.['./tree-foundation']) errors.push('built package retains ./tree-foundation');
}

if (errors.length) {
  console.error(`H5-C2 package-private boundary audit failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `H5-C2 package-private boundaries passed: 22 Option internals, 3 services, ` +
    `and 330 deferred symbols (${expectedActions.PRIVATE_CLASS_MEMBER} private, ` +
    `${expectedActions.PROTECTED_TEMPLATE_VISIBLE_MEMBER} protected, ` +
    `${expectedActions.KEEP_PHYSICALLY_PUBLISHED_DEPENDENCY} sibling-retained, ` +
    `${expectedActions.TYPE_ONLY_INTERNALIZATION} type-only).`,
);
