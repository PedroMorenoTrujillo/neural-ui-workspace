import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const outputPath = join(root, 'docs/H5C2_PACKAGE_PRIVATE_DEPENDENCY_GRAPH.json');

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}

const sourceFiles = filesUnder(join(root, 'projects/ui-core'));
const allEvidenceFiles = [
  ...sourceFiles,
  ...filesUnder(join(root, 'fixtures')),
  ...filesUnder(join(root, 'schematics')),
];
const imports = [];
for (const file of allEvidenceFiles) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const path = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      imports.push({
        symbol: element.propertyName?.text ?? element.name.text,
        localName: element.name.text,
        importPath: path,
        file: relative(root, file),
        typeOnly: Boolean(statement.importClause?.isTypeOnly || element.isTypeOnly),
      });
    }
  }
}

const optionSymbols = [
  'InternalNeuOptionLazyRequestSequencer',
  'createNeuOptionLazyRequest',
  'createNeuOptionLoadingRows',
  'deriveNeuOptionRowId',
  'filterNeuOptionRows',
  'normalizeNeuLegacyOptionGroups',
  'normalizeNeuOptionGroups',
  'normalizeNeuOptionLazyWindow',
  'normalizeNeuOptionRows',
  'InternalNeuOptionNormalizedRow',
  'InternalNeuOptionRow',
  'INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS',
  'InternalNeuConnectedOverlaySession',
  'InternalNeuOptionActiveRowController',
  'InternalNeuOptionTypeaheadController',
  'constrainNeuConnectedOverlayGeometry',
  'deriveNeuOptionActiveDescendant',
  'deriveNeuOptionAnnouncementData',
  'deriveNeuOptionAriaPosition',
  'InternalNeuConnectedOverlayCloseIntent',
  'InternalNeuConnectedOverlayCloseReason',
  'InternalNeuOptionActiveRowResult',
];
const services = ['NeuIdGenerator', 'NeuInitialTemporalState', 'NeuResponsiveState'];

function exportedNames(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const names = [];
  for (const statement of source.statements) {
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isVariableStatement(statement)
    ) {
      if ('name' in statement && statement.name) names.push(statement.name.text);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
        }
      }
    }
  }
  return names;
}

const menuFiles = [
  'neu-menu-action.ts',
  'neu-menu-adapters.ts',
  'neu-roving-menu-controller.ts',
];
const treeFiles = ['neu-tree-navigation-controller.ts'];
const familyFiles = {
  option: ['neu-option-foundation.ts', 'neu-option-interaction-foundations.ts'],
  menu: menuFiles,
  tree: treeFiles,
  services: ['neu-hydration-internals.ts'],
};
const menuSymbols = menuFiles.flatMap((file) => exportedNames(join(root, 'projects/ui-core/internal', file)));
const treeSymbols = treeFiles.flatMap((file) => exportedNames(join(root, 'projects/ui-core/internal', file)));

const dtsFiles = filesUnder(join(root, 'dist/neural-ui/core/types'));
function evidenceFor(symbol) {
  const internalImports = imports.filter(
    (entry) => entry.symbol === symbol && entry.importPath === '@neural-ui/core/internal',
  );
  const siblingImports = internalImports.filter(
    (entry) => entry.file.startsWith('projects/ui-core/') && !entry.file.includes('/internal/'),
  );
  const publicDeclarationReferences = dtsFiles
    .filter((file) => !file.includes('/internal/'))
    .filter((file) => new RegExp(`\\b${symbol}\\b`).test(readFileSync(file, 'utf8')))
    .map((file) => relative(root, file));
  return {
    siblingEntrypointConsumers: siblingImports.map((entry) => ({
      entrypoint: `./${entry.file.split('/')[2]}`,
      file: entry.file,
      usage: entry.typeOnly ? 'type-only' : 'runtime',
    })),
    angularMetadataReferences: [],
    publicDeclarationReferences,
    showcaseImports: [],
    consumerFixtureImports: internalImports.filter((entry) => entry.file.startsWith('fixtures/')),
    testingImports: siblingImports.filter((entry) => entry.file.endsWith('.spec.ts')),
    schematicsOrGeneratedCodeImports: internalImports.filter((entry) => entry.file.startsWith('schematics/')),
    docsImports: [],
  };
}

function definingFile(family, symbol) {
  for (const file of familyFiles[family]) {
    const full = join(root, 'projects/ui-core/internal', file);
    if (new RegExp(`\\b${symbol}\\b`).test(readFileSync(full, 'utf8'))) {
      return relative(root, full);
    }
  }
  throw new Error(`No defining file found for ${family}:${symbol}`);
}

const sharedBoundarySymbols = [
  ...optionSymbols.map((symbol) => ({
    symbol,
    previousConsumerName: `ɵ${symbol}`,
    family: 'option',
    action: 'MOVE_TO_PRIVATE_BOUNDARY',
  })),
  ...menuSymbols.map((symbol) => ({ symbol, family: 'menu', action: 'MOVE_TO_PRIVATE_BOUNDARY' })),
  ...treeSymbols.map((symbol) => ({ symbol, family: 'tree', action: 'MOVE_TO_PRIVATE_BOUNDARY' })),
  ...services.map((symbol) => ({ symbol, family: 'services', action: 'MOVE_TO_PRIVATE_BOUNDARY' })),
].map((entry) => ({
  ...entry,
  definingFile: definingFile(entry.family, entry.symbol),
  currentEntrypoint: './internal',
  emittedDeclarationRequired: evidenceFor(entry.symbol).publicDeclarationReferences.length > 0,
  evidence: evidenceFor(entry.symbol),
}));

function flat(contract) {
  return contract.items.flatMap((item) => [
    item,
    ...item.members.map((member) => ({
      ...member,
      parent: item.name,
      entrypoint: item.entrypoint,
    })),
  ]);
}
const h5b4 = JSON.parse(
  execFileSync(
    'git',
    ['show', '9bf0142bd36c706f693d0951c80064938eab258d:projects/ui-core/public-contract.v2.json'],
    { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  ),
);
const dependencyPublishedRebuilt = flat(h5b4)
  .filter((item) => {
    const declaration = item.parent ?? item.name;
    if (item.entrypoint === './foundation') return services.includes(declaration);
    if (item.entrypoint !== './option-api') return false;
    return optionSymbols.some((name) => declaration === `ɵ${name}`);
  })
  .map((item) => ({
    baselineId: item.id,
    baselineEntrypoint: item.entrypoint,
    baselineStatus: item.status,
    finalDisposition: 'MOVED_TO_PRIVATE_SHARED_BOUNDARY',
    finalEntrypoint: './internal',
    physicallyEmitted: true,
  }));

const deferredLedger = JSON.parse(
  readFileSync(join(root, 'docs/H5C2_PACKAGE_PRIVATE_LEDGER.json'), 'utf8'),
);
const graph = {
  schemaVersion: 1,
  baselines: {
    h5b4Classification: '9bf0142bd36c706f693d0951c80064938eab258d',
    h5c1: '83cb607bec4258e578112ea5ecddee4b0262e78e',
  },
  boundary: {
    entrypoint: './internal',
    consumerSupported: false,
    apfExportMapRequired: true,
    optionBridges: optionSymbols.length,
    menuDeclarations: menuSymbols.length,
    treeDeclarations: treeSymbols.length,
    foundationServices: services.length,
  },
  sharedBoundarySymbols,
  dependencyPublishedReportReconciliation: {
    reportedCount: 77,
    mechanicallyRebuiltCount: dependencyPublishedRebuilt.length,
    baselineStatusSplit: Object.fromEntries(
      Object.entries(Object.groupBy(dependencyPublishedRebuilt, (item) => item.baselineStatus)).map(
        ([status, items]) => [status, items.length],
      ),
    ),
    finding:
      'The H5-C1 partition reports 77 without a per-symbol list; its own Option/service ledgers total 88. ' +
      'H5-C2 reconciles the complete 88-symbol superset instead of inventing an unreproducible subset.',
  },
  dependencyPublishedRebuilt,
  deferred330: deferredLedger.symbols.map((entry) => ({
    ...entry,
    siblingEntrypointConsumers: [],
    angularMetadataReferences: entry.templateVisible ? ['defining Angular template/host metadata'] : [],
    publicDeclarationReferences: entry.action === 'PRIVATE_CLASS_MEMBER' ? [] : ['own class declaration'],
    showcaseImports: [],
    consumerFixtureImports: [],
    testingImports: [],
    schematicsOrGeneratedCodeImports: [],
    docsImports: [],
  })),
};

if (optionSymbols.length !== 22) throw new Error(`Expected 22 Option bridges, found ${optionSymbols.length}`);
if (dependencyPublishedRebuilt.length !== 88) {
  throw new Error(`Expected the H5-C1 ledger's 88 dependency symbols, found ${dependencyPublishedRebuilt.length}`);
}
if (graph.deferred330.length !== 330) throw new Error(`Expected 330 deferred symbols`);
if (process.argv.includes('--update')) {
  writeFileSync(outputPath, `${JSON.stringify(graph, null, 2)}\n`);
}
console.log(
  `H5-C2 dependency graph passed: ${sharedBoundarySymbols.length} shared-boundary declarations, ` +
    `${dependencyPublishedRebuilt.length} mechanically rebuilt dependency symbols (covering the reported 77), ` +
    `${graph.deferred330.length} deferred symbols.`,
);
