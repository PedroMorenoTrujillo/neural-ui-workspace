import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const external = ['@angular/*', '@angular/cdk/*', 'rxjs', 'rxjs/*'];

export function packageExportTarget(packageRoot, specifier) {
  const root = resolve(packageRoot);
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  if (manifest.sideEffects !== false && (
    !Array.isArray(manifest.sideEffects)
    || !manifest.sideEffects.every((item) => typeof item === 'string'
      && /^\.\/styles(?:\/.*)?\.s?css$/.test(item))
  )) {
    throw new Error('Compiled package does not certify JavaScript entrypoints as side-effect-free');
  }
  if (!specifier.startsWith('@neural-ui/core')) {
    throw new Error(`Not a Neural UI package specifier: ${specifier}`);
  }
  const suffix = specifier.slice('@neural-ui/core'.length);
  if (suffix && !suffix.startsWith('/')) throw new Error(`Invalid package specifier: ${specifier}`);
  const entry = manifest.exports[suffix ? `.${suffix}` : '.'];
  const target = typeof entry === 'string' ? entry : entry?.default;
  if (typeof target !== 'string' || !target.endsWith('.mjs')) {
    throw new Error(`Missing JavaScript package export for ${specifier}`);
  }
  const file = resolve(root, target);
  const fromRoot = relative(root, file);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot) || !existsSync(file)) {
    throw new Error(`Package export target does not exist inside ${root}: ${specifier}`);
  }
  return file;
}

export function assertPackageOnlyInputs(metafile, packageRoot, expectedTarget, workingDirectory = process.cwd()) {
  const root = resolve(packageRoot);
  const inputs = Object.keys(metafile.inputs).map((name) => resolve(workingDirectory, name));
  const packageInputs = inputs.filter((name) => {
    const local = relative(root, name);
    return local && !local.startsWith('..') && !isAbsolute(local);
  });
  if (!packageInputs.includes(resolve(expectedTarget))) {
    throw new Error(`Expected compiled package target was not resolved: ${expectedTarget}`);
  }
  const source = inputs.filter((name) => /(?:^|\/)projects\/ui-core\//.test(name));
  if (source.length) throw new Error(`Workspace source leaked into package bundle: ${source.join(', ')}`);
  return packageInputs;
}

export function assertPackageOnlyBundle(metafile, packageRoot, source, workingDirectory = process.cwd()) {
  const specifiers = [
    ...new Set([...source.matchAll(/(?:from\s*|import\s*)['"](@neural-ui\/core(?:\/[^'"]*)?)['"]/g)]
      .map((match) => match[1])),
  ];
  if (!specifiers.length) throw new Error('Package consumer did not import a Neural UI export');
  for (const specifier of specifiers) {
    assertPackageOnlyInputs(metafile, packageRoot, packageExportTarget(packageRoot, specifier), workingDirectory);
  }
  return specifiers;
}

export function assertDirectFesmInputs(metafile, packageRoot, source, workingDirectory = process.cwd()) {
  const targets = [...new Set([...source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+\.mjs)['"]/g)]
    .map((match) => match[1]))]
    .filter((name) => {
      const local = relative(resolve(packageRoot), resolve(name));
      return local && !local.startsWith('..') && !isAbsolute(local);
    });
  if (!targets.length) throw new Error('Direct package probe did not import a compiled FESM');
  for (const target of targets) assertPackageOnlyInputs(metafile, packageRoot, target, workingDirectory);
  const sourceInputs = Object.keys(metafile.inputs)
    .filter((name) => /(?:^|\/)projects\/ui-core\//.test(name));
  if (sourceInputs.length) {
    throw new Error(`Workspace source leaked into package bundle: ${sourceInputs.join(', ')}`);
  }
  return targets;
}

export async function measurePackageImport({ packageRoot, specifier, source }) {
  const target = packageExportTarget(packageRoot, specifier);
  const resolved = [];
  const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)]
    .filter((match) => match[2] === specifier)
    .flatMap((match) => match[1].split(',').map((part) => part.trim().split(/\s+as\s+/)[0]))
    .filter(Boolean);
  if (!imports.length) throw new Error(`No named import to verify for ${specifier}`);
  const options = {
    absWorkingDir: resolve(packageRoot, '../../..'),
    bundle: true,
    external,
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    minify: true,
    platform: 'browser',
    plugins: [{
      name: 'rel-01-compiled-package-only',
      setup(api) {
        api.onResolve({ filter: /^@neural-ui\/core(?:\/.*)?$/ }, ({ path }) => {
          const file = packageExportTarget(packageRoot, path);
          resolved.push({ specifier: path, file });
          // Resolving an absolute FESM bypasses package.json sideEffects discovery.
          // packageExportTarget verifies the published metadata before applying it.
          return { path: file, sideEffects: false };
        });
      },
    }],
    stdin: { contents: source, loader: 'js', resolveDir: resolve(packageRoot, '../../..') },
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false,
  };
  const names = [...new Set(imports)];
  await build({
    ...options,
    metafile: false,
    stdin: {
      ...options.stdin,
      contents: `import {${names.join(',')}} from '${specifier}'; export {${names.join(',')}};`,
    },
  });
  const result = await build(options);
  if (!resolved.some((entry) => entry.specifier === specifier && entry.file === target)) {
    throw new Error(`Requested package import was not resolved: ${specifier}`);
  }
  const packageInputs = assertPackageOnlyInputs(
    result.metafile, packageRoot, target, resolve(packageRoot, '../../..'),
  );
  const bytes = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return {
    size: {
      raw: bytes.byteLength,
      gzip: gzipSync(bytes, { level: 9 }).byteLength,
      brotli: brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      }).byteLength,
    },
    packageInputs: packageInputs.map((file) => relative(resolve(packageRoot), file)).sort(),
    allInputs: Object.keys(result.metafile.inputs).sort(),
    resolved,
  };
}

export async function verifyUnusedPackageExport(packageRoot, specifier, symbol) {
  const declaration = `import {${symbol}} from '${specifier}';`;
  const unused = await measurePackageImport({ packageRoot, specifier, source: declaration });
  if (unused.size.raw !== 0) {
    throw new Error(`Unused ${specifier}:${symbol} retained ${unused.size.raw} raw bytes`);
  }
  const used = await measurePackageImport({
    packageRoot,
    specifier,
    source: `${declaration} export {${symbol}};`,
  });
  if (used.size.raw === 0) throw new Error(`Used ${specifier}:${symbol} produced zero bytes`);
  let rejected = false;
  try {
    await measurePackageImport({
      packageRoot,
      specifier,
      source: `import {__n2Rel01MissingExport__} from '${specifier}'; export {__n2Rel01MissingExport__};`,
    });
  } catch (error) {
    rejected = String(error).includes('No matching export');
  }
  if (!rejected) throw new Error(`Invalid export control did not fail for ${specifier}`);
  return { specifier, symbol, unused, used, invalidExportRejected: true };
}
