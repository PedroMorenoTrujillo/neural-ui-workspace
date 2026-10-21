import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readmeRoot = resolve(process.argv.find(arg => arg.startsWith('--readme-root='))?.slice('--readme-root='.length) ?? workspace);
const packageRoot = join(workspace, 'dist/neural-ui/core');
const files = ['README.md', 'projects/ui-core/README.md'];
const version = JSON.parse(readFileSync(join(workspace, 'projects/ui-core/package.json'), 'utf8')).version;
const snippets = [];
const errors = [];

for (const file of files) {
  const markdown = readFileSync(join(readmeRoot, file), 'utf8');
  for (const match of markdown.matchAll(/(?:npm install|ng add) @neural-ui\/core@([^\s`]+)/g)) {
    if (match[1] !== version) errors.push(`${file}: installer uses ${match[1]}, expected ${version}`);
  }
  // These removed Table 1.x APIs must not silently survive as static HTML attributes.
  // Migration/history prose remains valid; only executable code fences are checked.
  for (const match of markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)^```/gm)) {
    const line = markdown.slice(0, match.index).split('\n').length + 1;
    if (/\b(?:NeuTableQueryState|serverSide|lazyLoadOnInit|serverStateChange|neuTableBodySection|neuTableManagedRow|neuTableBodySectionOf|selectAllChange|rowUnselect|selectedRows)\b/.test(match[2])) {
      errors.push(`${file}:${line}: removed Table 1.x API in executable example`);
    }
    if (/^(?:typescript|ts)\s*$/.test(match[1])) snippets.push({ file, line, code: match[2] });
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
}
if (!existsSync(join(packageRoot, 'package.json'))) throw new Error('Build Core before verifying README examples.');
if (snippets.length === 0) throw new Error('No README TypeScript examples found.');

const temporary = mkdtempSync(join(tmpdir(), 'neural-readme-examples-'));
try {
  const modules = join(temporary, 'node_modules');
  mkdirSync(join(modules, '@neural-ui'), { recursive: true });
  // Consumer resolution uses the compiled public package, never source aliases.
  cpSync(packageRoot, join(modules, '@neural-ui/core'), { recursive: true });
  for (const entry of readdirSync(join(workspace, 'node_modules'))) {
    if (entry !== '@neural-ui') symlinkSync(join(workspace, 'node_modules', entry), join(modules, entry));
  }
  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  const names = snippets.map((snippet, index) => {
    const name = `readme-${index + 1}.ts`;
    writeFileSync(join(temporary, name), `${snippet.code}\nexport {};\n`);
    return name;
  });
  writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'preserve', moduleResolution: 'bundler', strict: true,
      experimentalDecorators: true, skipLibCheck: true, lib: ['ES2022', 'DOM'],
      types: ['node'], outDir: './output',
    },
    angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
    files: names,
  }, null, 2));
  const result = spawnSync(process.execPath, [join(workspace, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', join(temporary, 'tsconfig.json')], { encoding: 'utf8', cwd: temporary });
  let diagnostics = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  for (let i = names.length - 1; i >= 0; i--) diagnostics = diagnostics.replaceAll(names[i], `${snippets[i].file}:${snippets[i].line} [${names[i]}]`);
  if (diagnostics.trim()) console.log(diagnostics.trim());
  if (result.error) throw result.error;
  if (result.status !== 0 || errors.length) process.exitCode = result.status || 1;
  else console.log(`README examples PASS: ${snippets.length} extracted TypeScript fences; strict ngc templates against @neural-ui/core@${version} compiled public package.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
