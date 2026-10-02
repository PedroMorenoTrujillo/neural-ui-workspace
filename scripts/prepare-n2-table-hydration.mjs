import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dependencies = resolve(process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules'));
if (!existsSync(join(dependencies, '@angular/ssr/package.json'))) {
  throw new Error('N2 Table hydration requires Angular SSR dependencies.');
}
const fixture = mkdtempSync(join(dirname(dependencies), '.n2-table-hydration-'));
cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
cpSync(join(root, 'projects/ui-core/styles'), join(fixture, 'src/styles'), { recursive: true });
const resolutionPath = join(fixture, 'tsconfig.json');
const resolution = JSON.parse(readFileSync(resolutionPath, 'utf8'));
resolution.compilerOptions.paths = {
  '@neural-ui/core': [join(root, 'dist/neural-ui/core')],
  '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')],
};
writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`);
cpSync(join(root, 'projects/ui-core/table'), join(fixture, 'src/neu-table'), {
  recursive: true,
  dereference: true,
});
rmSync(join(fixture, 'src/neu-table/neu-table.spec.ts'));
rmSync(join(fixture, 'src/neu-table/neu-table.performance.spec.ts'));
cpSync(
  join(root, 'fixtures/n2-table-hydration.component.ts'),
  join(fixture, 'src/n2-table-hydration.component.ts'),
);
writeFileSync(
  join(fixture, 'src/index.html'),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>N2 Table hydration</title><base href="/"></head><body><n2-table-hydration></n2-table-hydration></body></html>\n',
);
writeFileSync(
  join(fixture, 'src/main.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {N2TableHydrationComponent} from './n2-table-hydration.component';
bootstrapApplication(N2TableHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});\n`,
);
writeFileSync(
  join(fixture, 'src/main.server.ts'),
  `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {N2TableHydrationComponent} from './n2-table-hydration.component';
export default (context:BootstrapContext) => bootstrapApplication(N2TableHydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);\n`,
);
writeFileSync(
  join(fixture, 'src/server.ts'),
  `import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
for(const marker of ['id="n2-custom-filter"','id="n2-custom-next"','id="n2-custom-state"']) {
  if(!html.includes(marker)) throw new Error('Missing custom template SSR evidence: '+marker);
}
for(const value of ['ngh=','<table','SSR Name','0:Linus','data-row-key="1"','data-row-key="2"','data-row-key="3"','data-column-pin="start"','data-column-pin="end"','data-selected="true"','aria-disabled="true"','aria-sort="descending"','aria-label="Search table"','aria-label="Filter Identifier"','type="checkbox"','type="radio"','Show Status','SSR empty','SSR loading','SSR error','id="n2-h-editor"','Hydrated detail Ada','Hydrated group active 2']){
  if(!html.includes(value)) throw new Error('Missing SSR evidence: '+value);
}
const section=(id:string)=>html.match(new RegExp('<section id="'+id+'">(.*?)</section>','s'))?.[1]??'';
const rowCount=(id:string)=>(section(id).match(/data-row-key=/g)??[]).length;
if(rowCount('n2-table-client-virtual')!==50) throw new Error('Client virtual SSR bootstrap must render exactly 50 rows.');
if(rowCount('n2-table-remote-virtual-satisfied')!==50) throw new Error('Satisfied remote virtual SSR bootstrap must render exactly 50 rows.');
if(rowCount('n2-table-remote-virtual-unsatisfied')!==0) throw new Error('Unsatisfied remote virtual SSR must not invent rows.');
if(!section('n2-table-client-virtual').includes('aria-rowcount="200"')) throw new Error('Missing client virtual aria-rowcount.');
if(!section('n2-table-remote-virtual-satisfied').includes('aria-rowcount="1000"')) throw new Error('Missing remote virtual aria-rowcount.');
if(!html.includes('<output id="n2-virtual-events">[]</output>')||!html.includes('<output id="n2-virtual-ranges">[]</output>')) throw new Error('SSR virtual outputs must remain silent.');
if(!html.includes('<output id="n2-h-events">[]</output>')) throw new Error('SSR H outputs must remain silent.');
if(!html.includes('<output id="n2-export-state">idle</output>')) throw new Error('SSR must not execute or load export.');
writeFileSync(new URL('index.html',dir),html);
console.log('N2 Table SSR document prepared with deterministic virtual bootstrap, applied query UI, client pipeline, remote bypass and all metadata states');\n`,
);
const configPath = join(fixture, 'angular.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
config.cli = { cache: { enabled: false } };
Object.assign(config.projects['compatibility-consumer'].architect.build.options, {
  server: 'src/main.server.ts',
  ssr: { entry: 'src/server.ts' },
  prerender: false,
});
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const tsPath = join(fixture, 'tsconfig.app.json');
const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
ts.compilerOptions.types = ['node'];
ts.include = [
  'src/main.ts',
  'src/main.server.ts',
  'src/server.ts',
  'src/n2-table-hydration.component.ts',
  'src/neu-table/**/*.ts',
];
ts.exclude = ['src/neu-table/**/*.spec.ts'];
writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
console.log(fixture);
