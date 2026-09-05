import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const foundation = resolve('dist/neural-ui/core/fesm2022/neural-ui-core-foundation.mjs');
const external = ['@angular/*','@angular/cdk/*','@ng-icons/*','rxjs','rxjs/*'];
async function measure(contents) {
  const output = await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,minify:true,format:'esm',write:false,external});
  const data=Buffer.concat(output.outputFiles.map(f=>f.contents));
  return {raw:data.length,gzip:gzipSync(data).length,brotli:brotliCompressSync(data).length};
}
const css=readFileSync('../neural-ui-showcase/projects/showcase/src/preset-example.css');
const files=[];
function walk(dir){for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())walk(p);else files.push(p);}}
walk('dist/neural-ui/core');
const report={
  unused:await measure(`import {neuPresetCss} from '${foundation}';`),
  activeBrowserJS:0,
  generationHelperIfBundled:await measure(`import {neuPresetCss} from '${foundation}';console.log(neuPresetCss('forest',{light:{'--neu-text':'var(--app-text)'}}));`),
  exampleCss:{raw:css.length,gzip:gzipSync(css).length,brotli:brotliCompressSync(css).length},
  foundationTypesBytes:statSync('dist/neural-ui/core/types/neural-ui-core-foundation.d.ts').size,
  sourceMaps:files.filter(f=>f.endsWith('.map')).map(path=>({path,bytes:statSync(path).size})),
  cssAssets:files.filter(f=>/\.s?css$/.test(f)).map(path=>({path,bytes:statSync(path).size})),
  newEntrypoints:0,newRuntimeDependencies:0,
  note:'Static activation ships only generated CSS. Optional helper measurement is disclosed separately and is not required in browser. Package distribution metrics are governed by unchanged H9-B4 release policy.'
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
else console.log(JSON.stringify(report, null, 2));
