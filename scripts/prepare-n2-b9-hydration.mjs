import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dependencies = resolve(process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules'));
if (!existsSync(join(dependencies, '@angular/ssr/package.json'))) {
  throw new Error('B9 hydration requires Angular SSR dependencies. Set NEU_N2_DEPENDENCIES.');
}
const fixture = mkdtempSync(join(dirname(dependencies), '.n2-b9-hydration-'));
cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {provideNeuralUI} from '@neural-ui/core';
import {B9HydrationComponent} from './n2-b9-hydration.component';
bootstrapApplication(B9HydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideNeuralUI()]});
`);
writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {provideNeuralUI} from '@neural-ui/core';
import {B9HydrationComponent} from './n2-b9-hydration.component';
export default (context:BootstrapContext) => bootstrapApplication(B9HydrationComponent,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering(),provideNeuralUI()]},context);
`);
writeFileSync(join(fixture, 'src/server.ts'), `
import {renderApplication} from '@angular/platform-server';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import bootstrap from './main.server';
const dir=new URL('../browser/',import.meta.url),csr=new URL('index.csr.html',dir);
const document=readFileSync(existsSync(csr)?csr:new URL('index.html',dir),'utf8');
const html=await renderApplication(bootstrap,{document,url:'http://localhost/',allowedHosts:['localhost']});
if(!html.includes('ngh=')) throw new Error('Missing hydration annotations');
writeFileSync(new URL('index.html',dir),html);
console.log('B9 SSR page prepared for browser hydration');
`);
writeFileSync(join(fixture, 'src/n2-b9-hydration.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuSplitterComponent} from '@neural-ui/core/splitter';
import {NeuScrollAreaComponent} from '@neural-ui/core/panel';
@Component({
  selector:'app-root',imports:[NeuSplitterComponent,NeuScrollAreaComponent],
  template:\`<main>
    <neu-splitter id="b9-ltr" [panes]="ltr()" style="width:400px;height:80px" (sizesChange)="accept($event)">
      <div ngProjectAs="neu-splitter-pane">LTR A</div><div ngProjectAs="neu-splitter-pane">LTR B</div>
    </neu-splitter>
    <neu-splitter id="b9-rtl" dir="rtl" [panes]="rtl" style="width:400px;height:80px" (sizesChange)="reject($event)">
      <div ngProjectAs="neu-splitter-pane">RTL A</div><div ngProjectAs="neu-splitter-pane">RTL B</div>
    </neu-splitter>
    <neu-splitter id="b9-vertical" orientation="vertical" [panes]="vertical" style="width:200px;height:200px">
      <div ngProjectAs="neu-splitter-pane">Vertical A</div><div ngProjectAs="neu-splitter-pane">Vertical B</div>
    </neu-splitter>
    <neu-scroll-area id="b9-native" maxWidth="120px" ariaLabel="Native content"><div style="width:400px;height:300px">Native</div></neu-scroll-area>
    <neu-scroll-area #enhanced id="b9-enhanced" dir="rtl" [enhanced]="true" maxWidth="120px" ariaLabel="Enhanced content" (scrollPositionChange)="scrolled($event.left)"><div style="width:400px;height:300px">Enhanced</div></neu-scroll-area>
    <button id="b9-scroll-to" (click)="enhanced.scrollTo({left:30})">Scroll</button>
    <output id="b9-events">{{eventsJson()}}</output><output id="b9-ready">{{ready()}}</output>
  </main>\`
})
export class B9HydrationComponent {
  readonly ltr=signal([{size:50},{size:50}]);
  readonly rtl=[{size:50},{size:50}];
  readonly vertical=[{size:50},{size:50}];
  readonly events=signal<string[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly ready=signal(false);
  constructor(){afterNextRender(()=>this.ready.set(true));}
  accept(sizes:readonly number[]){this.events.update(v=>[...v,'accept:'+sizes[0]]);this.ltr.set(sizes.map(size=>({size})));}
  reject(sizes:readonly number[]){this.events.update(v=>[...v,'reject:'+sizes[0]]);}
  scrolled(left:number){this.events.update(v=>[...v,'scroll:'+left]);}
}
`);
const configPath = join(fixture, 'angular.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
Object.assign(config.projects['compatibility-consumer'].architect.build.options, {
  server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' }, prerender: false,
});
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const tsPath = join(fixture, 'tsconfig.app.json');
const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
ts.compilerOptions.types = ['node'];
writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
console.log(fixture);
