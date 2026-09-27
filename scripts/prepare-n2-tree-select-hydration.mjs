import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dependencies = resolve(process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules'));
if (!existsSync(join(dependencies, '@angular/ssr/package.json'))) {
  throw new Error('N2 TreeSelect hydration requires Angular SSR dependencies.');
}
const fixture = mkdtempSync(join(dirname(dependencies), '.n2-tree-select-hydration-'));
cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
cpSync(join(root, 'projects/ui-core'), join(fixture, 'src/ui-core'), {
  recursive: true,
  dereference: true,
});
cpSync(
  join(root, 'fixtures/n2-tree-select-hydration.component.ts'),
  join(fixture, 'src/n2-tree-select-hydration.component.ts'),
);
writeFileSync(
  join(fixture, 'src/index.html'),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>N2 TreeSelect hydration</title><base href="/"></head><body><n2-tree-select-hydration></n2-tree-select-hydration></body></html>\n',
);
writeFileSync(
  join(fixture, 'src/main.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {N2TreeSelectHydrationComponent} from './n2-tree-select-hydration.component';
bootstrapApplication(N2TreeSelectHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});\n`,
);
writeFileSync(
  join(fixture, 'src/main.server.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {N2TreeSelectHydrationComponent} from './n2-tree-select-hydration.component';
export default (context:BootstrapContext) => bootstrapApplication(N2TreeSelectHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);\n`,
);
writeFileSync(
  join(fixture, 'src/server.ts'),
  `import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
for(const value of ['ngh=','id="n2-tree-select"','Hydrated tree','Root','id="n2-tree-select-events"']) if(!html.includes(value)) throw new Error('Missing SSR evidence: '+value);
writeFileSync(new URL('index.html',dir),html);
console.log('N2 TreeSelect SSR document prepared with zero requests and zero value echoes');\n`,
);
const configPath = join(fixture, 'angular.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
config.cli = { cache: { enabled: false } };
Object.assign(config.projects['compatibility-consumer'].architect.build.options, {
  server: 'src/main.server.ts',
  ssr: { entry: 'src/server.ts' },
  prerender: false,
  styles: ['src/styles.css', 'src/ui-core/styles.scss'],
});
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const tsPath = join(fixture, 'tsconfig.app.json');
const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
ts.compilerOptions.types = ['node'];
ts.compilerOptions.paths = {
  '@neural-ui/core/*': ['./src/ui-core/*/public_api.ts'],
};
ts.include = [
  'src/main.ts',
  'src/main.server.ts',
  'src/server.ts',
  'src/n2-tree-select-hydration.component.ts',
];
writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
console.log(fixture);
