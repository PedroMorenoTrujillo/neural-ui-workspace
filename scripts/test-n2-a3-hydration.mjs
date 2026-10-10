import { spawnSync } from 'node:child_process';
import { cpSync, createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;
const ng = join(root, 'node_modules/.bin/ng');
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 120000, env: { ...process.env, NO_COLOR: '1' } });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')}: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

// A child directory resolves the workspace dependencies without copying or symlinking node_modules.
const fixture = mkdtempSync(join(root, '.n2-a3-hydration-'));
try {
  console.log('A3 hydration: preparing fixture');
  cpSync(join(root, 'fixtures/compatibility-consumer'), fixture, { recursive: true });
  const packageRoot = join(root, 'dist/neural-ui/core');
  const consumerPackage = join(fixture, 'node_modules/@neural-ui/core');
  mkdirSync(join(consumerPackage, 'fesm2022'), { recursive: true });
  mkdirSync(join(consumerPackage, 'types'), { recursive: true });
  cpSync(join(packageRoot, 'package.json'), join(consumerPackage, 'package.json'));
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  for (const name of ['avatar', 'avatar-group', 'card', 'divider', 'skeleton', 'spinner']) {
    const entry = manifest.exports[`./${name}`];
    for (const target of [entry.types, entry.default]) {
      cpSync(join(packageRoot, target), join(consumerPackage, target));
    }
  }
  console.log('A3 hydration: package copied');
  cpSync(join(root, 'fixtures/n2-a3-hydration/a3-hydration.component.ts'), join(fixture, 'src/h9-hydration.component.ts'));
  writeFileSync(join(fixture, 'src/main.ts'), `import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { H9HydrationComponent } from './h9-hydration.component';
bootstrapApplication(H9HydrationComponent, { providers: [provideZonelessChangeDetection(), provideClientHydration()] });\n`);
  writeFileSync(join(fixture, 'src/main.server.ts'), `import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication, provideClientHydration, BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { H9HydrationComponent } from './h9-hydration.component';
export default (context: BootstrapContext) => bootstrapApplication(H9HydrationComponent, { providers: [provideZonelessChangeDetection(), provideClientHydration(), provideServerRendering()] }, context);\n`);
  writeFileSync(join(fixture, 'src/server.ts'), `import { renderApplication } from '@angular/platform-server';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import bootstrap from './main.server';
const dir = new URL('../browser/', import.meta.url);
const csr = new URL('index.csr.html', dir);
const document = readFileSync(existsSync(csr) ? csr : new URL('index.html', dir), 'utf8');
const html = await renderApplication(bootstrap, { document, url: 'http://localhost/', allowedHosts: ['localhost'] });
writeFileSync(new URL('index.html', dir), html);\n`);
  const configPath = join(fixture, 'angular.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  Object.assign(config.projects['compatibility-consumer'].architect.build.options, { server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' }, prerender: false });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  const tsPath = join(fixture, 'tsconfig.app.json');
  const tsconfig = JSON.parse(readFileSync(tsPath, 'utf8'));
  tsconfig.compilerOptions.types = ['node'];
  tsconfig.include = ['src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/h9-hydration.component.ts'];
  writeFileSync(tsPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  console.log('A3 hydration: building consumer');
  run(ng, ['build'], fixture);
  console.log('A3 hydration: rendering SSR');
  run(node, [join(fixture, 'dist/server/server.mjs')], fixture);
  const browserRoot = join(fixture, 'dist/browser');
  const ssrHtml = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  for (const marker of ['ngh=', 'neu-avatar-group', 'neu-card', 'neu-divider', 'neu-skeleton', 'neu-spinner', 'Ada Lovelace']) {
    if (!ssrHtml.includes(marker)) throw new Error(`SSR lacks ${marker}`);
  }
  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  console.log('A3 hydration: checking Chromium');
  try {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const diagnostics = [];
      page.on('console', (message) => { if (message.type() === 'error' || /NG05\d{2}/.test(message.text())) diagnostics.push(message.text()); });
      page.on('pageerror', (error) => diagnostics.push(error.message));
      const port = server.address().port;
      await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
      if (await page.locator('neu-avatar').count() !== 2) throw new Error('Hydration duplicated avatars.');
      if (await page.locator('neu-card').count() !== 1) throw new Error('Hydration duplicated card.');
      await page.locator('#a3-update').click();
      await page.waitForFunction(() => document.querySelector('#a3-ready')?.textContent?.trim() === 'Alan Turing');
      if (await page.locator('neu-avatar .neu-avatar[aria-label="Alan Turing"]').count() !== 1) throw new Error('First hydrated update failed.');
      if (diagnostics.length) throw new Error(`Hydration diagnostics: ${diagnostics.join(' | ')}`);
    } finally { await browser.close(); }
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
  console.log('A3 SSR + Chromium hydration PASS: 0 NG050x; DOM reused; first signal update once.');
} finally { rmSync(fixture, { recursive: true, force: true }); }
