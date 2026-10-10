import { spawnSync } from 'node:child_process';
import {
  cpSync,
  createReadStream,
  existsSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;
const dependencies = process.env.NEU_N2_DEPENDENCIES ?? join(root, 'node_modules');
const ng = join(dependencies, '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

run(node, [join(root, 'scripts/build-ui-core.mjs')], root);
const prepared = run(
  node,
  [join(root, 'scripts/prepare-h9-browser-consumer.mjs'), '--hydrate'],
  root,
);
const fixture = prepared.trim().split(/\r?\n/)[0];
if (!fixture || !existsSync(fixture)) throw new Error('N2-023 hydration fixture not created.');
cpSync(
  join(root, 'fixtures/n2-visual-hydration/h9-hydration.component.ts'),
  join(fixture, 'src/h9-hydration.component.ts'),
);

const tsPath = join(fixture, 'tsconfig.app.json');
const tsconfig = JSON.parse(readFileSync(tsPath, 'utf8'));
tsconfig.include = ['src/main.ts', 'src/main.server.ts', 'src/server.ts', 'src/h9-hydration.component.ts'];
writeFileSync(tsPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

try {
  run(ng, ['build'], fixture);
  const dist = join(fixture, 'dist');
  run(node, [join(dist, 'server/server.mjs')], fixture);
  const browserRoot = join(dist, 'browser');
  const ssrHtml = readFileSync(join(browserRoot, 'index.html'), 'utf8');
  if (!ssrHtml.includes('ngh=')) throw new Error('SSR output is missing hydration annotations.');
  for (const marker of [
    'neu-button--brand',
    'neu-button--solid',
    'neu-alert--danger',
    'neu-alert--outline',
    'neu-toolbar--density-relaxed',
    'neu-code-block--density-compact',
  ])
    if (!ssrHtml.includes(marker)) throw new Error(`SSR output is missing ${marker}.`);

  const server = createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? '/').split('?')[0]);
    let file = join(browserRoot, requested === '/' ? 'index.html' : requested.slice(1));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4391, '127.0.0.1', resolve);
  });
  try {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const diagnostics = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || /NG05\d{2}/.test(message.text())) diagnostics.push(message.text());
      });
      page.on('pageerror', (error) => diagnostics.push(error.message));
      await page.goto('http://127.0.0.1:4391', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelector('#visual-ready')?.textContent?.trim() === 'true');
      const button = page.locator('#visual-toggle');
      if ((await page.locator('button[neu-button]').count()) !== 1)
        throw new Error('Hydration duplicated visual DOM.');
      await button.click();
      await page.waitForFunction(() => document.querySelector('#visual-count')?.textContent?.trim() === '1');
      const buttonClass = await button.getAttribute('class');
      if (!buttonClass?.includes('neu-button--neutral') || !buttonClass.includes('neu-button--ghost'))
        throw new Error(`First hydrated interaction produced unexpected classes: ${buttonClass}`);
      await page.evaluate(() => {
        document.documentElement.dataset['theme'] = 'dark';
        document.documentElement.dir = 'rtl';
      });
      const rtlState = await page.evaluate(() => ({
        direction: getComputedStyle(document.documentElement).direction,
        alertClass: document.querySelector('neu-alert')?.getAttribute('class') ?? '',
        toolbarClass: document.querySelector('neu-toolbar')?.getAttribute('class') ?? '',
      }));
      if (rtlState.direction !== 'rtl') throw new Error('RTL browser smoke did not apply.');
      if (!rtlState.alertClass.includes('neu-alert--danger'))
        throw new Error('Dark-theme transition lost the semantic Alert tone.');
      if (!rtlState.toolbarClass.includes('neu-toolbar--density-relaxed'))
        throw new Error('Dark-theme transition lost the Toolbar density.');
      await page.emulateMedia({ forcedColors: 'active', contrast: 'more' });
      await button.focus();
      if (!(await button.evaluate((element) => element === document.activeElement)))
        throw new Error('Forced-colors focus smoke failed.');
      if (diagnostics.length) throw new Error(`Hydration diagnostics: ${diagnostics.join(' | ')}`);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  console.log('N2-023 Chromium SSR/hydration passed: DOM reused, 0 NG050x, first visual update exactly once, dark/RTL/forced-colors smoke passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
