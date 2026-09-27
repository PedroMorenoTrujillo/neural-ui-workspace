import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { parse } from '@babel/parser';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(workspaceRoot, 'dist/neural-ui/core');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
const baseExternal = ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'];
const historicalExternal = [...baseExternal, '@ng-icons/*'];
const iconBoundaryExternal = [...baseExternal, '@neural-icons/*'];

function dropClassFamilies(source, names) {
  const removed = new Set(names);
  const ast = parse(source, { sourceType: 'module' });
  const edits = [];
  for (const statement of ast.program.body) {
    if (statement.type === 'ClassDeclaration' && removed.has(statement.id?.name)) {
      edits.push([statement.start, statement.end, '']);
    } else if (statement.type === 'ExpressionStatement') {
      const original = source.slice(statement.start, statement.end);
      if (original.includes('ɵɵngDeclareClassMetadata') && names.some((name) => original.includes(`type: ${name},`))) {
        edits.push([statement.start, statement.end, '']);
      }
    } else if (statement.type === 'ExportNamedDeclaration' && statement.specifiers.length) {
      const kept = statement.specifiers.filter((specifier) => !removed.has(specifier.local.name));
      if (kept.length !== statement.specifiers.length) {
        const replacement = kept.length ? `export { ${kept.map((specifier) => specifier.local.name).join(', ')} };` : '';
        edits.push([statement.start, statement.end, replacement]);
      }
    }
  }
  let result = source;
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  return result;
}

function packagePlugin(dropClasses = []) {
  return {
    name: 'neural-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const target = manifest.exports[suffix ? `.${suffix}` : '.']?.default;
        if (!target) throw new Error(`Package export missing: ${path}`);
        return { path: resolve(packageRoot, target), sideEffects: false };
      });
      if (dropClasses.length) {
        api.onLoad({ filter: /neural-ui-core-(?:menu|pick-list)\.mjs$/ }, ({ path }) => ({
          contents: dropClassFamilies(readFileSync(path, 'utf8'), dropClasses),
          loader: 'js',
          resolveDir: dirname(path),
        }));
      }
    },
  };
}

function source(imports) {
  return imports
    .map(([symbol, entrypoint], index) =>
      `import { ${symbol} as retained${index} } from '@neural-ui/core/${entrypoint}'; export { retained${index} };`,
    )
    .join('\n');
}

function size(bytes) {
  return [
    bytes.byteLength,
    gzipSync(bytes, { level: 9 }).byteLength,
    brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).byteLength,
  ];
}

async function measure(label, imports, external, historical = false, dropClasses = []) {
  const options = {
    ...(!historical ? { absWorkingDir: workspaceRoot, tsconfigRaw: { compilerOptions: {} } } : {}),
    bundle: true,
    external,
    format: 'esm',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [packagePlugin(dropClasses)],
    stdin: { contents: source(imports), loader: 'js', resolveDir: workspaceRoot },
    treeShaking: true,
    write: false,
  };
  const result = await build(options);
  if (Object.keys(result.metafile.inputs).some((name) => /(?:^|\/)projects\/ui-core\//.test(name))) {
    throw new Error(`${label} resolved workspace source instead of the built package`);
  }
  const historicalResult = historical ? await build({ ...options, metafile: false }) : result;
  const outputs = historicalResult.outputFiles.map(({ contents }) => contents);
  if (historical && !Buffer.concat(outputs).equals(Buffer.concat(result.outputFiles.map(({ contents }) => contents)))) {
    throw new Error(`${label} changed bytes when metafile collection was enabled`);
  }
  const bytes = Buffer.concat(outputs);
  const attributed = new Map();
  const externalImports = new Set();
  let dynamicImports = 0;
  for (const output of Object.values(result.metafile.outputs)) {
    for (const [input, detail] of Object.entries(output.inputs)) {
      const name = input.includes('/dist/neural-ui/core/fesm2022/')
        ? input.slice(input.lastIndexOf('/') + 1)
        : input.includes('/node_modules/')
          ? input.split('/node_modules/').at(-1).split('/').slice(0, 2).join('/')
          : input;
      attributed.set(name, (attributed.get(name) ?? 0) + detail.bytesInOutput);
    }
    for (const dep of output.imports) {
      if (dep.external) externalImports.add(dep.path);
      if (dep.kind === 'dynamic-import') dynamicImports++;
    }
  }
  console.log(JSON.stringify({
    label,
    size: size(bytes),
    outputCount: outputs.length,
    dynamicImports,
    inputs: [...attributed].sort((a, b) => b[1] - a[1]),
    externalImports: [...externalImports].sort(),
    temporal: bytes.includes('neu-temporal-state-'),
    responsive: bytes.includes('matchMedia'),
    retainedNames: [
      'NeuMenuComponent',
      'NeuTieredMenuComponent',
      'NeuTieredLevelComponent',
      'NeuMegaMenuComponent',
      'NeuPickListComponent',
      'NeuOrderListComponent',
      'NeuDragDropGroupDirective',
      'NeuButtonComponent',
    ].filter((name) => bytes.includes(name)),
  }));
}

const menu = [['NeuMenuComponent', 'menu']];
const pick = [['NeuPickListComponent', 'pick-list']];
const order = [['NeuOrderListComponent', 'pick-list']];
const both = [...pick, ...order];
for (const [name, imports] of [['menu', menu], ['pick-list-order-list', both]]) {
  await measure(`${name}:historical-harness`, imports, historicalExternal, true);
  await measure(`${name}:current-harness`, imports, baseExternal);
  await measure(`${name}:icons-external-diagnostic`, imports, iconBoundaryExternal);
}
await measure('pick-list-only:current', pick, baseExternal);
await measure('order-list-only:current', order, baseExternal);
await measure('menu:virtual-drop-tiered', menu, baseExternal, false, ['NeuTieredLevelComponent', 'NeuTieredMenuComponent']);
await measure('menu:virtual-main-only', menu, baseExternal, false, [
  'NeuTieredLevelComponent', 'NeuTieredMenuComponent', 'NeuMenuButtonComponent', 'NeuMenubarComponent',
]);
await measure('pick-list-only:virtual-drop-order', pick, baseExternal, false, [
  'NeuOrderListComponent', 'NeuOrderListItemDirective',
]);
await measure('order-list-only:virtual-drop-pick', order, baseExternal, false, [
  'NeuPickListComponent', 'NeuPickListItemDirective',
]);
