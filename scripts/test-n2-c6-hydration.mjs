import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packaged = process.env.N2_C6_PACKAGED_HYDRATION === '1';
const fixture = mkdtempSync(join(packaged ? tmpdir() : root, '.n2-c6-hydration-'));
const npmCache = packaged ? mkdtempSync(join(tmpdir(), '.n2-c6-npm-cache-')) : null;
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000,
    env: { ...process.env, ...(npmCache ? { npm_config_cache: npmCache } : {}),
      PATH: `/opt/homebrew/bin:/usr/bin:/bin:${process.env.PATH}` },
  });
  if (result.status !== 0)
    throw new Error(`${command} failed:\n${result.stdout?.slice(-5000)}\n${result.stderr?.slice(-5000)}`);
  return result.stdout;
}

try {
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  if (packaged) {
    const workspacePackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const packageTarball = run('npm', ['pack', join(root, 'dist/neural-ui/core'),
      '--pack-destination', fixture]).trim().split('\n').at(-1);
    assert.ok(packageTarball?.endsWith('.tgz'), 'npm pack did not return a tarball');
    const packagePath = join(fixture, 'package.json');
    const consumerPackage = JSON.parse(readFileSync(packagePath, 'utf8'));
    const angularVersion = workspacePackage.dependencies['@angular/core'];
    const buildVersion = workspacePackage.devDependencies['@angular/build'];
    consumerPackage.dependencies = {
      '@angular/cdk': workspacePackage.dependencies['@angular/cdk'],
      '@angular/common': angularVersion,
      '@angular/compiler': angularVersion,
      '@angular/core': angularVersion,
      '@angular/forms': angularVersion,
      '@angular/platform-browser': angularVersion,
      '@angular/platform-server': angularVersion,
      '@angular/router': angularVersion,
      '@angular/ssr': buildVersion,
      '@neural-ui/core': `file:${join(fixture, packageTarball)}`,
      '@neural-icons/core': workspacePackage.dependencies['@neural-icons/core'],
      '@neural-icons/angular': workspacePackage.dependencies['@neural-icons/angular'],
      rxjs: workspacePackage.dependencies.rxjs,
      tslib: workspacePackage.dependencies.tslib,
    };
    consumerPackage.devDependencies = {
      '@types/node': '^22.0.0',
      '@angular/build': buildVersion,
      '@angular/cli': workspacePackage.devDependencies['@angular/cli'],
      '@angular/compiler-cli': workspacePackage.devDependencies['@angular/compiler-cli'],
      typescript: workspacePackage.devDependencies.typescript,
    };
    writeFileSync(packagePath, `${JSON.stringify(consumerPackage, null, 2)}\n`);
    run('npm', ['install', '--no-audit', '--no-fund'], fixture);
  }
  writeFileSync(join(fixture, 'src/styles.css'), `
:root { color-scheme: light; --neu-primary: #2563eb; --neu-primary-dark: #1d4ed8;
  --neu-surface: #ffffff; --neu-surface-2: #f8fafc; --neu-border: #cbd5e1;
  --neu-text: #0f172a; --neu-text-muted: #475569; --neu-focus-ring: 0 0 0 2px #2563eb; }
body { margin: 1rem; font-family: system-ui, sans-serif; }
output { display: block; overflow-wrap: anywhere; }
`);
  writeFileSync(join(fixture, 'src/main.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration} from '@angular/platform-browser';
import {C6Component} from './n2-c6.component';
bootstrapApplication(C6Component,{providers:[provideZonelessChangeDetection(),provideClientHydration()]});
`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication,provideClientHydration,BootstrapContext} from '@angular/platform-browser';
import {provideServerRendering} from '@angular/platform-server';
import {C6Component} from './n2-c6.component';
export default (context:BootstrapContext) => bootstrapApplication(C6Component,{providers:[provideZonelessChangeDetection(),provideClientHydration(),provideServerRendering()]},context);
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
`);
  writeFileSync(join(fixture, 'src/n2-c6.component.ts'), `
import {Component,afterNextRender,computed,signal} from '@angular/core';
import {NeuTreeComponent,type NeuTreeNode,type NeuTreeHierarchy,type NeuTreeSelection,type NeuTreeSelectionChange,type NeuTreeExpandedKeysChange,type NeuTreeChildrenRequest,type NeuTreeNodeMove,type NeuTreeNodeAction} from '@neural-ui/core/tree';
@Component({selector:'app-root',imports:[NeuTreeComponent],template:\`<main>
  <button id="c6-toggle" type="button" (click)="show.set(!show())">Toggle</button>
  <button id="c6-accept" type="button" (click)="accept()">Accept</button>
  <button id="c6-accept-selection" type="button" (click)="acceptSelection()">Accept selection</button>
  <button id="c6-rtl" type="button" (click)="rtl.set(!rtl())">RTL</button>
  <button id="c6-reconstruct" type="button" (click)="reconstruct()">Reconstruct</button>
  <button id="c6-loading" type="button" (click)="setLazyState('loading')">Loading</button>
  <button id="c6-error" type="button" (click)="setLazyState('error')">Error</button>
  <button id="c6-typeahead" type="button" (click)="loadTypeahead()">Typeahead</button>
  <button id="c6-expand-typeahead" type="button" (click)="expanded.set(['folder'])">Expand typeahead</button>
  <button id="c6-deep" type="button" (click)="loadDeep()">Deep</button>
  <div [attr.dir]="rtl()?'rtl':'ltr'">
  @if(show()){<neu-tree [nodes]="nodes()" [hierarchy]="hierarchy()" [expandedKeys]="expanded()"
    [selection]="selection()" [searchable]="true" [reorderable]="!deepMode()"
    (expandedKeysChange)="recordExpansion($event)" (selectionChange)="recordSelection($event)"
    (childrenRequest)="recordRequest($event)" (nodeAction)="recordAction($event)" (nodeMove)="recordMove($event)" />}
  </div>
  <output id="c6-events">{{eventsJson()}}</output><output id="c6-requests">{{requestsJson()}}</output>
  <output id="c6-moves">{{movesJson()}}</output><output id="c6-selections">{{selectionsJson()}}</output>
  <output id="c6-actions">{{actionsJson()}}</output>
  <output id="c6-ready">{{ready()}}</output>
</main>\`})
export class C6Component {
  readonly show=signal(true);
  readonly ready=signal(false);
  readonly rtl=signal(false);
  readonly deepMode=signal(false);
  readonly nodes=signal<readonly NeuTreeNode<{name:string},string>[]>([
    {key:'root',data:{name:'Root'},label:'Root'},
    {key:'child',data:{name:'Child'},label:'Child'},
    {key:'lazy',data:{name:'Lazy'},label:'Lazy'},
    {key:'disabled',data:{name:'Disabled'},label:'Disabled',disabled:true},
  ]);
  readonly hierarchy=signal<NeuTreeHierarchy<string>>({revision:1,roots:['root','lazy','disabled'],children:[
    {parentKey:'root',state:'loaded',keys:['child']},{parentKey:'lazy',state:'unloaded'},
  ]});
  readonly expanded=signal<readonly string[]>(['root']);
  readonly selection=signal<NeuTreeSelection<string>>({mode:'checkbox',keys:[]});
  readonly events=signal<readonly NeuTreeExpandedKeysChange<string>[]>([]);
  readonly requests=signal<readonly NeuTreeChildrenRequest<string>[]>([]);
  readonly moves=signal<readonly NeuTreeNodeMove<string>[]>([]);
  readonly selections=signal<readonly NeuTreeSelectionChange<string>[]>([]);
  readonly actions=signal<readonly NeuTreeNodeAction<string>[]>([]);
  readonly eventsJson=computed(()=>JSON.stringify(this.events()));
  readonly requestsJson=computed(()=>JSON.stringify(this.requests()));
  readonly movesJson=computed(()=>JSON.stringify(this.moves()));
  readonly selectionsJson=computed(()=>JSON.stringify(this.selections()));
  readonly actionsJson=computed(()=>JSON.stringify(this.actions()));
  constructor(){afterNextRender(()=>this.ready.set(true));}
  recordExpansion(event:NeuTreeExpandedKeysChange<string>){this.events.update(events=>[...events,event]);}
  recordRequest(event:NeuTreeChildrenRequest<string>){this.requests.update(events=>[...events,event]);}
  recordMove(event:NeuTreeNodeMove<string>){this.moves.update(events=>[...events,event]);}
  recordSelection(event:NeuTreeSelectionChange<string>){this.selections.update(events=>[...events,event]);}
  recordAction(event:NeuTreeNodeAction<string>){this.actions.update(events=>[...events,event]);}
  accept(){const event=this.events().at(-1);if(event)this.expanded.set(event.keys);}
  acceptSelection(){const event=this.selections().at(-1);if(event)this.selection.set(event.selection);}
  reconstruct(){this.nodes.update(nodes=>nodes.map(node=>({ ...node,data:{...node.data},label:node.key==='child'?'Child updated':node.label })));}
  setLazyState(state:'loading'|'error'){
    this.hierarchy.update(h=>({...h,children:h.children.map(r=>r.parentKey==='lazy'?{parentKey:'lazy',state,requestId:1}:r)}));
  }
  loadTypeahead(){
    const labels=['Alpha','Beta','Berlin','Bravo','Folder','Hidden'];
    const keys=['alpha','beta','berlin','bravo','folder','hidden'];
    this.nodes.set(keys.map((key,index)=>({key,data:{name:labels[index]},label:labels[index]})));
    this.hierarchy.set({revision:3,roots:keys.slice(0,5),children:[
      {parentKey:'folder',state:'loaded',keys:['hidden']},
    ]});
    this.expanded.set([]);
    this.selection.set({mode:'none'});
  }
  loadDeep(){
    const deep=Array.from({length:1001},(_,index)=>({key:String(index),data:{name:String(index)},label:'Depth '+index}));
    this.nodes.set(deep);
    this.hierarchy.set({revision:2,roots:['0'],children:deep.slice(0,-1).map((node,index)=>({parentKey:node.key,state:'loaded',keys:[String(index+1)]}))});
    this.expanded.set(deep.map(node=>node.key));
    this.selection.set({mode:'none'});
    this.deepMode.set(true);
  }
}
`);
  const angularPath = join(fixture, 'angular.json');
  const angular = JSON.parse(readFileSync(angularPath, 'utf8'));
  Object.assign(angular.projects['compatibility-consumer'].architect.build.options, {
    server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' }, prerender: false,
  });
  writeFileSync(angularPath, `${JSON.stringify(angular, null, 2)}\n`);
  const appTsPath = join(fixture, 'tsconfig.app.json');
  const appTs = JSON.parse(readFileSync(appTsPath, 'utf8'));
  appTs.compilerOptions.types = ['node'];
  appTs.include = ['src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/n2-c6.component.ts'];
  writeFileSync(appTsPath, `${JSON.stringify(appTs, null, 2)}\n`);
  const tsPath = join(fixture, 'tsconfig.json');
  const ts = JSON.parse(readFileSync(tsPath, 'utf8'));
  if (packaged) delete ts.compilerOptions.paths;
  else ts.compilerOptions.paths = {
    '@neural-ui/core': [join(root, 'dist/neural-ui/core')],
    '@neural-ui/core/*': [join(root, 'dist/neural-ui/core/*')],
  };
  writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
  run(join(packaged ? fixture : root, 'node_modules/.bin/ng'), ['build'], fixture);
  run(process.execPath, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const html = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'neu-tree', 'role="tree"', 'role="group"', 'Root', 'Child', 'aria-level="2"'])
    assert.ok(html.includes(marker), `SSR missing ${marker}`);
  assert.match(html, /<output id="c6-events"[^>]*>\[\]<\/output>/);
  assert.match(html, /<output id="c6-requests"[^>]*>\[\]<\/output>/);
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    }[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const { chromium } = createRequire(import.meta.url)(process.env.NEU_PLAYWRIGHT_MODULE ?? '@playwright/test');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/*.js', async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'commit' });
      await page.locator('neu-tree').waitFor({ state: 'attached' });
      await page.evaluate(() => { window.__c6Nodes = ['main', 'neu-tree', '[role="tree"]', '[data-neu-tree-index="1"]']
        .map((selector) => document.querySelector(selector)); });
      release();
      await page.waitForFunction(() => document.querySelector('#c6-ready')?.textContent === 'true');
      assert.equal(await page.evaluate(() => window.__c6Nodes.every((node, index) =>
        node === document.querySelector(['main', 'neu-tree', '[role="tree"]',
          '[data-neu-tree-index="1"]'][index]))), true, 'SSR DOM not reused');
      const events = async () => JSON.parse(await page.locator('#c6-events').textContent());
      const requests = async () => JSON.parse(await page.locator('#c6-requests').textContent());
      assert.deepEqual(await events(), []);
      assert.deepEqual(await requests(), []);
      await page.locator('[data-neu-tree-index="0"]').focus();
      await page.evaluate(() => {
        window.__c6TypeaheadFocus = 0;
        document.querySelector('neu-tree')?.addEventListener('focusin', () => { window.__c6TypeaheadFocus += 1; });
      });
      await page.keyboard.press('c');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-neu-tree-index') === '1');
      assert.equal(await page.evaluate(() => window.__c6TypeaheadFocus), 1, 'First hydrated character focused more than once');
      assert.equal(await page.locator('[data-neu-tree-index="1"]').getAttribute('aria-level'), '2');
      assert.equal(await page.locator('[data-neu-tree-index="1"]').getAttribute('aria-checked'), 'false');
      assert.deepEqual(await events(), [], 'First hydrated character emitted expansion');
      assert.deepEqual(await requests(), [], 'First hydrated character emitted a request');
      if (process.env.N2_C6_SCREENSHOT_DIR)
        await page.screenshot({ path: join(process.env.N2_C6_SCREENSHOT_DIR, 'tree-desktop.png'), fullPage: true });
      await page.locator('[data-neu-tree-index="2"]').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('#c6-events')?.textContent !== '[]');
      assert.equal((await events()).length, 1);
      assert.deepEqual(await requests(), [], 'Request before parent acceptance');
      await page.locator('#c6-accept').click();
      await page.waitForFunction(() => document.querySelector('#c6-requests')?.textContent !== '[]');
      assert.equal((await requests()).length, 1);
      assert.equal((await requests())[0].reason, 'expand');
      assert.equal((await requests())[0].parentKey, 'lazy');
      const source = await page.locator('[data-neu-tree-index="0"] > .neu-tree__row .neu-tree__drag-handle').boundingBox();
      const target = await page.locator('[data-neu-tree-index="2"] .neu-tree__drop--after').boundingBox();
      assert.ok(source && target, 'Missing Tree pointer geometry');
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 16 });
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('#c6-moves')?.textContent !== '[]', null, { timeout: 5000 });
      const moves = JSON.parse(await page.locator('#c6-moves').textContent());
      assert.equal(moves.length, 1);
      assert.equal(moves[0].sourceKey, 'root');
      assert.equal(moves[0].targetKey, 'lazy');
      assert.equal(moves[0].position, 'after');
      const selections = async () => JSON.parse(await page.locator('#c6-selections').textContent());
      const actions = async () => JSON.parse(await page.locator('#c6-actions').textContent());
      const moveEvents = async () => JSON.parse(await page.locator('#c6-moves').textContent());
      await page.locator('[data-neu-tree-index="1"] > .neu-tree__row .neu-tree__checkbox').click();
      await page.waitForFunction(() => document.querySelector('#c6-selections')?.textContent !== '[]');
      assert.equal((await selections()).length, 1);
      assert.equal(await page.locator('[data-neu-tree-index="1"]').getAttribute('aria-checked'), 'false',
        'Rejected selection changed applied state');
      await page.locator('#c6-accept-selection').click();
      await page.waitForFunction(() => document.querySelector('[data-neu-tree-index="0"]')?.getAttribute('aria-checked') === 'mixed');
      assert.equal(await page.locator('[data-neu-tree-index="0"]').getAttribute('aria-checked'), 'mixed');
      assert.equal(await page.locator('[data-neu-tree-index="1"]').getAttribute('aria-checked'), 'true');
      await page.locator('[data-neu-tree-index="3"]').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      assert.deepEqual(await actions(), []);
      assert.equal((await selections()).length, 1, 'Disabled node emitted selection');
      assert.equal(await page.locator('[data-neu-tree-index="3"]').getAttribute('aria-disabled'), 'true');
      await page.locator('[data-neu-tree-index="1"]').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#c6-actions')?.textContent !== '[]');
      assert.deepEqual(await actions(), [{ key: 'child' }], 'Nested action must emit once');
      await page.locator('#c6-rtl').click();
      await page.waitForFunction(() => document.querySelector('main > div')?.getAttribute('dir') === 'rtl');
      await page.locator('[data-neu-tree-index="0"]').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => JSON.parse(document.querySelector('#c6-events')?.textContent ?? '[]').length >= 2);
      assert.equal((await events()).at(-1).key, 'root');
      assert.equal((await events()).at(-1).expanded, false, 'RTL back arrow must propose collapse');
      await page.locator('#c6-reconstruct').click();
      await page.waitForFunction(() => document.querySelector('[data-neu-tree-index="1"] > .neu-tree__row')?.textContent?.includes('Child updated'));
      assert.match(await page.locator('[data-neu-tree-index="1"] > .neu-tree__row').textContent(), /Child updated/);
      await page.locator('#c6-loading').click();
      await page.waitForFunction(() => document.querySelector('[data-neu-tree-index="2"]')?.getAttribute('aria-busy') === 'true');
      assert.equal(await page.locator('[data-neu-tree-index="2"]').getAttribute('aria-busy'), 'true');
      await page.locator('#c6-error').click();
      await page.locator('[data-neu-tree-index="2"] .neu-tree__retry').click();
      await page.waitForFunction(() => JSON.parse(document.querySelector('#c6-requests')?.textContent ?? '[]').length === 2);
      assert.equal((await requests()).length, 2);
      assert.equal((await requests())[1].reason, 'retry');
      await page.setViewportSize({ width: 375, height: 800 });
      assert.equal(await page.locator('[role="tree"]').count(), 1);
      assert.equal(await page.locator('[role="treeitem"]').count(), 4);
      if (process.env.N2_C6_SCREENSHOT_DIR)
        await page.screenshot({ path: join(process.env.N2_C6_SCREENSHOT_DIR, 'tree-mobile-rtl.png'), fullPage: true });
      for (let index = 0; index < 100; index += 1) {
        await page.locator('#c6-toggle').click();
        await page.locator('neu-tree').waitFor({ state: 'detached' });
        await page.locator('#c6-toggle').click();
        await page.locator('neu-tree').waitFor({ state: 'attached' });
      }
      await page.locator('#c6-typeahead').click();
      await page.waitForFunction(() => document.querySelectorAll('[role="treeitem"]').length === 5);
      const outputCounts = [await events(), await requests(), await selections(), await actions(), await moveEvents()].map((value) => value.length);
      await page.locator('[data-neu-tree-index="0"]').focus();
      await page.keyboard.press('b');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-neu-tree-index') === '1');
      await page.keyboard.press('e');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-neu-tree-index') === '2');
      await page.keyboard.press('z');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-neu-tree-index')), '2', 'No-match moved focus');
      await page.waitForTimeout(550);
      await page.locator('[data-neu-tree-index="0"]').focus();
      await page.keyboard.press('h');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-neu-tree-index')), '0', 'Collapsed child was searched');
      await page.waitForTimeout(550);
      await page.locator('#c6-expand-typeahead').click();
      await page.waitForFunction(() => document.querySelectorAll('[role="treeitem"]').length === 6);
      await page.locator('[data-neu-tree-index="0"]').focus();
      await page.keyboard.press('h');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-neu-tree-index') === '5');
      assert.equal(await page.locator('[data-neu-tree-index="5"]').getAttribute('aria-level'), '2');
      await page.locator('#c6-toggle').click();
      await page.locator('neu-tree').waitFor({ state: 'detached' });
      await page.waitForTimeout(550);
      assert.deepEqual([await events(), await requests(), await selections(), await actions(), await moveEvents()].map((value) => value.length), outputCounts,
        'Typeahead emitted a business output or late destroy side effect');
      await page.locator('#c6-toggle').click();
      await page.locator('neu-tree').waitFor({ state: 'attached' });
      await page.locator('#c6-deep').click();
      await page.waitForFunction(() => document.querySelectorAll('[role="treeitem"]').length === 1001,
        null, { timeout: 10000 });
      assert.equal(await page.locator('[data-neu-tree-index="1000"]').getAttribute('aria-level'), '1001');
      assert.ok(await page.locator('[role="group"]').count() <= 32, 'Deep DOM grouping is unbounded');
      assert.equal(errors.filter((error) => /NG050\d|NG0\d+|TypeError|ReferenceError/.test(error)).length,
        0, errors.join('\n'));
      console.log(`C6 ${packaged ? 'packed consumer ' : ''}SSR/hydration PASS: DOM reuse, 0 NG050x, zoneless, first-character and hierarchical typeahead, five semantic paths, pointer DnD, checkbox/disabled/RTL/reconstruct/mobile/deep 1001, 100 create/destroy.`);
    } finally { release(); await browser.close(); }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
  if (npmCache) rmSync(npmCache, { recursive: true, force: true });
}
