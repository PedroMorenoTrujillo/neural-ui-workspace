import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { TraceMap, decodedMappings, originalPositionFor } from '@jridgewell/trace-mapping';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = resolve(workspaceRoot, 'dist/neural-ui/core');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
const classCache = new Map();
const mapCache = new Map();

function packagePlugin() {
  return {
    name: 'neural-package',
    setup(api) {
      api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
        const suffix = path.slice('@neural-ui/core'.length);
        const target = manifest.exports[suffix ? `.${suffix}` : '.']?.default;
        if (!target) throw new Error(`Missing package export ${path}`);
        return { path: resolve(packageRoot, target), sideEffects: false };
      });
    },
  };
}

function ownerForSource(source, line) {
  if (!classCache.has(source)) {
    const text = readFileSync(source, 'utf8');
    const classes = text.split('\n').flatMap((value, index) => {
      const match = /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/.exec(value);
      return match ? [{ line: index + 1, name: match[1] }] : [];
    });
    classCache.set(source, classes);
  }
  const classes = classCache.get(source);
  const owner = classes.filter((entry) => entry.line <= line).at(-1);
  return owner?.name ?? 'module-level';
}

function sourceOwner(input, line, column) {
  const inputPath = resolve(workspaceRoot, input);
  if (input.startsWith('projects/ui-core/')) {
    return `${input}#${ownerForSource(inputPath, line)}`;
  }
  if (!inputPath.startsWith(packageRoot) || !inputPath.endsWith('.mjs')) {
    return input.includes('node_modules') ? input.split('node_modules/').at(-1).split('/').slice(0, 2).join('/') : input;
  }
  const mapPath = `${inputPath}.map`;
  if (!mapCache.has(mapPath)) {
    try { mapCache.set(mapPath, new TraceMap(JSON.parse(readFileSync(mapPath, 'utf8')))); }
    catch { mapCache.set(mapPath, null); }
  }
  const sourceMap = mapCache.get(mapPath);
  if (!sourceMap) return relative(workspaceRoot, inputPath);
  const original = originalPositionFor(sourceMap, { line, column });
  if (!original.source || !original.line) return relative(workspaceRoot, inputPath);
  const sourcePath = resolve(dirname(inputPath), original.source);
  const sourceLabel = relative(workspaceRoot, sourcePath);
  if (!sourceLabel.startsWith('projects/ui-core/')) return sourceLabel;
  return `${sourceLabel}#${ownerForSource(sourcePath, original.line)}`;
}

async function audit(label, symbol, entrypoint) {
  const contents = `import { ${symbol} } from '@neural-ui/core/${entrypoint}'; export { ${symbol} };`;
  const result = await build({
    absWorkingDir: workspaceRoot,
    bundle: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'],
    format: 'esm',
    minify: true,
    outfile: 'rel-01f-output.js',
    platform: 'browser',
    plugins: [packagePlugin()],
    sourcemap: 'external',
    stdin: { contents, loader: 'js', resolveDir: workspaceRoot },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  });
  const js = result.outputFiles.find((file) => file.path.endsWith('.js')).text;
  const map = JSON.parse(result.outputFiles.find((file) => file.path.endsWith('.js.map')).text);
  const lines = js.split('\n');
  const decoded = decodedMappings(new TraceMap(map));
  const buckets = new Map();
  let unmapped = 0;
  for (let lineIndex = 0; lineIndex < decoded.length; lineIndex++) {
    const segments = decoded[lineIndex];
    const length = lines[lineIndex]?.length ?? 0;
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const bytes = Math.max(0, (segments[index + 1]?.[0] ?? length) - segment[0]);
      if (segment.length < 4) { unmapped += bytes; continue; }
      const input = map.sources[segment[1]];
      const label = sourceOwner(input, segment[2] + 1, segment[3]);
      buckets.set(label, (buckets.get(label) ?? 0) + bytes);
    }
  }
  console.log(JSON.stringify({ label, outputBytes: Buffer.byteLength(js), unmapped, owners: [...buckets].sort((a, b) => b[1] - a[1]) }));
}

await audit('menu', 'NeuMenuComponent', 'menu');
await audit('pick-list-only', 'NeuPickListComponent', 'pick-list');
await audit('order-list-only', 'NeuOrderListComponent', 'pick-list');
