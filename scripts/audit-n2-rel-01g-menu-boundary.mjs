import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import '@angular/compiler';
import {
  packageExportTarget,
  verifyUnusedPackageExport,
} from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, 'dist/neural-ui/core');
const menuFesm = packageExportTarget(packageRoot, '@neural-ui/core/menu');
const sharedFesm = packageExportTarget(packageRoot, '@neural-ui/core/menu-shared');
const tieredFesm = packageExportTarget(packageRoot, '@neural-ui/core/menu-tiered');

if (new Set([menuFesm, sharedFesm, tieredFesm]).size !== 3) {
  throw new Error('Menu, shared directive, and TieredMenu must have distinct package FESMs');
}

const menuSource = readFileSync(menuFesm, 'utf8');
const tieredSource = readFileSync(tieredFesm, 'utf8');
const sharedSource = readFileSync(sharedFesm, 'utf8');
const menuEdges = [menuSource, tieredSource, sharedSource].map((source) =>
  [...source.matchAll(/(?:from|import)\s*['"]@neural-ui\/core\/(menu(?:-shared|-tiered)?)['"]/g)]
    .map((match) => match[1]).sort());
if (menuEdges[0].includes('menu') || menuEdges[1].includes('menu')
  || menuEdges[1].includes('menu-tiered') || menuEdges[2].length) {
  throw new Error(`Menu package topology has a backward edge: ${JSON.stringify(menuEdges)}`);
}
if (/class NeuTiered(?:Menu|Level)Component|openTieredPath|closeTieredBranch/.test(menuSource)) {
  throw new Error('TieredMenu implementation remains in the Menu FESM');
}

const menu = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/menu', 'NeuMenuComponent');
const tiered = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/menu', 'NeuTieredMenuComponent');
const directTiered = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/menu-tiered', 'NeuTieredMenuComponent');
const shared = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/menu-shared', 'NeuMenuItemDirective');
const pick = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/pick-list', 'NeuPickListComponent');
const order = await verifyUnusedPackageExport(packageRoot, '@neural-ui/core/pick-list', 'NeuOrderListComponent');
for (const proof of [pick, order]) {
  if (proof.used.packageInputs.some((input) => /neural-ui-core-menu(?:-shared|-tiered)?\.mjs$/.test(input))) {
    throw new Error(`${proof.symbol} resolves Menu code`);
  }
}

const menuInputs = menu.used.packageInputs;
const menuBundle = await build({
  absWorkingDir: root,
  bundle: true,
  external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
  format: 'esm',
  logLevel: 'silent',
  metafile: true,
  minify: true,
  platform: 'browser',
  plugins: [{
    name: 'rel-01g-package-exports',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => ({
        path: packageExportTarget(packageRoot, path),
        sideEffects: false,
      }));
    },
  }],
  stdin: {
    contents: "import {NeuMenuComponent} from '@neural-ui/core/menu'; export {NeuMenuComponent};",
    loader: 'js',
    resolveDir: root,
  },
  treeShaking: true,
  tsconfigRaw: { compilerOptions: {} },
  write: false,
});
const tieredBytesInOutput = Object.values(menuBundle.metafile.outputs).reduce((sum, output) =>
  sum + Object.entries(output.inputs).reduce((bytes, [input, detail]) =>
    bytes + (input.endsWith('/neural-ui-core-menu-tiered.mjs') ? detail.bytesInOutput : 0), 0), 0);
if (tieredBytesInOutput !== 0) {
  throw new Error(`Using NeuMenuComponent retains ${tieredBytesInOutput} TieredMenu output bytes`);
}
for (const proof of [tiered, directTiered]) {
  if (!proof.used.packageInputs.includes('fesm2022/neural-ui-core-menu-tiered.mjs')) {
    throw new Error('TieredMenu used control failed to retain its implementation FESM');
  }
}

const [compat, implementation, sharedModule] = await Promise.all([
  import(pathToFileURL(menuFesm).href),
  import(pathToFileURL(tieredFesm).href),
  import(pathToFileURL(sharedFesm).href),
]);
if (compat.NeuTieredMenuComponent !== implementation.NeuTieredMenuComponent
  || compat.NeuMenuItemDirective !== sharedModule.NeuMenuItemDirective) {
  throw new Error('Menu compatibility aliases have different runtime identities');
}

console.log(JSON.stringify({
  menu: menu.used.size,
  tiered: tiered.used.size,
  directTiered: directTiered.used.size,
  shared: shared.used.size,
  pick: pick.used.size,
  order: order.used.size,
  menuPackageInputs: menuInputs,
  tieredBytesInMenuOutput: tieredBytesInOutput,
  tieredPackageInputs: tiered.used.packageInputs,
  rootUnused: [menu, tiered, directTiered, shared, pick, order].every((proof) => proof.unused.size.raw === 0),
  invalidExportsRejected: [menu, tiered, directTiered, shared, pick, order].every((proof) => proof.invalidExportRejected),
  identity: true,
  menuEdges,
}));
