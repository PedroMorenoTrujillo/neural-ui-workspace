import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = mkdtempSync(join(tmpdir(), 'neural-h9-browser-'));
const dependencies = resolve(process.env.NEU_H9_DEPENDENCIES ?? join(root, 'node_modules'));
const hydrate = process.argv.includes('--hydrate');
if (hydrate && !existsSync(join(dependencies, '@angular/ssr/package.json'))) {
 throw new Error('Hydration requires an Angular 22 test consumer with @angular/ssr and @types/node. Set NEU_H9_DEPENDENCIES to its node_modules.');
}
cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, {recursive:true});
mkdirSync(join(fixture, 'node_modules'), {recursive:true});
for (const name of readdirSync(dependencies)) {
 if (name === '@neural-ui' || name === '.package-lock.json') continue;
 cpSync(join(dependencies, name), join(fixture, 'node_modules', name), {
  recursive: true,
  dereference: true,
  preserveTimestamps: true,
 });
}
mkdirSync(join(fixture, 'node_modules/@neural-ui'), {recursive:true});
// Copy a completed package so concurrent library builds cannot invalidate the consumer.
cpSync(join(root, 'dist/neural-ui/core'), join(fixture, 'node_modules/@neural-ui/core'), {recursive:true});
writeFileSync(join(fixture, 'src/styles.css'), "@import '@angular/cdk/overlay-prebuilt.css';\nbody {font-family:sans-serif; margin:0;}\n");
const name = hydrate ? 'H9HydrationComponent' : 'H9EventContractComponent';
const file = hydrate ? 'h9-hydration.component' : 'h9-event-contract.component';
if (!hydrate) writeFileSync(join(fixture,'src/app.component.ts'), `import {Component} from '@angular/core';
import {${name}} from './${file}';
@Component({selector:'app-root',imports:[${name}],template:'<h9-event-contract />'}) export class AppComponent {}`);
const mainName = hydrate ? name : 'AppComponent';
const mainFile = hydrate ? file : 'app.component';
writeFileSync(join(fixture,'src/main.ts'), `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralUI} from '@neural-ui/core';
import {${mainName}} from './${mainFile}';
bootstrapApplication(${mainName},{providers:[provideZonelessChangeDetection(),${hydrate?'provideClientHydration(),':''}provideNeuralUI()]});`);
if (hydrate) {
 writeFileSync(join(fixture,'src/main.server.ts'), `import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralUI} from '@neural-ui/core';
import {${name}} from './${file}';
export default (context:BootstrapContext) => bootstrapApplication(${name},{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralUI()]},context);`);
 writeFileSync(join(fixture,'src/server.ts'), `import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
if(!html.includes('ngh=')) throw new Error('Missing hydration annotations');
writeFileSync(new URL('index.html',dir),html);
console.log('H9 SSR page prepared for actual browser hydration');`);
 const configPath=join(fixture,'angular.json'), config=JSON.parse(readFileSync(configPath,'utf8'));
 Object.assign(config.projects['compatibility-consumer'].architect.build.options,{server:'src/main.server.ts',ssr:{entry:'src/server.ts'},prerender:false});
 writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
 const tsPath=join(fixture,'tsconfig.app.json'),ts=JSON.parse(readFileSync(tsPath,'utf8'));
 ts.compilerOptions.types=['node'];writeFileSync(tsPath,JSON.stringify(ts,null,2)+'\n');
}
console.log(fixture);
console.log('Run node_modules/.bin/ng build in that directory.');
if(hydrate) console.log('Then run node dist/server/server.mjs to create the SSR HTML.');
console.log(`Serve dist/browser on localhost:${hydrate?4390:4389} and run scripts/${hydrate?'test-h9-hydration-browser.mjs':'test-h9-event-browser.mjs'} from Library.`);
