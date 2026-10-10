import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDirectFesmInputs, verifyUnusedPackageExport } from './lib/rel-01-package-bundle-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await verifyUnusedPackageExport(join(root, 'dist/neural-ui/core'), '@neural-ui/core', 'provideNeuralUI');
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const kanban = join(fesm, 'neural-ui-core-kanban.mjs');
const cases = {
  basic: `import {NeuKanbanComponent} from '${kanban}'; export const component=NeuKanbanComponent;`,
  board10x20: `import {NeuKanbanComponent} from '${kanban}'; export const component=NeuKanbanComponent; export const columns=Array.from({length:10},(_,c)=>({id:String(c),title:String(c),cards:Array.from({length:20},(_,i)=>({id:c+'-'+i,title:String(i)}))}));`,
  rich: `import {NeuKanbanComponent} from '${kanban}'; export const component=NeuKanbanComponent; export const columns=[{id:'todo',title:'Todo',wipLimit:2,cards:[{id:'a',title:'A',priority:'high',tags:['x'],assignee:{name:'Ada'}}]}];`,
  rootUnused: `import {provideNeuralUI} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'js' },
    tsconfigRaw: { compilerOptions: {} },
    bundle: true, format: 'esm', platform: 'browser', minify: true,
    write: false, metafile: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
    plugins: [{
      name: 'n2-c5-private-dependencies',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/(foundation|internal)$/ }, (args) => ({
          path: join(fesm, `neural-ui-core-${args.path.split('/').at(-1)}.mjs`),
        }));
      },
    }],
  });
  assertDirectFesmInputs(result.metafile, join(root, 'dist/neural-ui/core'), contents);
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  const inputs = Object.keys(result.metafile.inputs);
  const forbidden = inputs.filter((file) => /neural-ui-core-(table|tree-table|drag-drop)\.mjs$/.test(file));
  if (forbidden.length) throw new Error(`C5 retained facade: ${forbidden.join(', ')}`);
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
    sourceInputs: inputs.filter((file) => /neural-ui-core-(kanban|foundation|internal)\.mjs$/.test(file)),
  };
}
if (results.rootUnused.raw !== 0) throw new Error(`C5 root-unused retained ${results.rootUnused.raw} B`);
console.log(JSON.stringify(results, null, 2));
