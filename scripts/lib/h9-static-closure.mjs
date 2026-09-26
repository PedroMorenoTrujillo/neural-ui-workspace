import { resolve } from 'node:path';

// An initial consumer retains its entry and recursively imported static chunks.
// Dynamic imports are deliberately excluded, regardless of whether their source
// files appear in esbuild's complete metafile.
export function outputClosure(metafile, { includeDynamic = false } = {}) {
  const outputs = metafile.outputs;
  const entries = Object.entries(outputs)
    .filter(([, value]) => value.entryPoint === '<stdin>')
    .map(([key]) => key);
  if (entries.length !== 1) throw new Error(`Expected one consumer entry, found ${entries.length}`);

  const retained = new Set();
  const visit = (key) => {
    if (retained.has(key)) return;
    const output = outputs[key];
    if (!output) throw new Error(`Missing output in bundle graph: ${key}`);
    retained.add(key);
    for (const dependency of output.imports ?? []) {
      if (dependency.external || (!includeDynamic && dependency.kind === 'dynamic-import'))
        continue;
      if (!outputs[dependency.path]) {
        throw new Error(`Missing local output dependency: ${dependency.path}`);
      }
      visit(dependency.path);
    }
  };
  entries.forEach(visit);
  return [...retained].sort();
}

export function bytesForOutputs(result, outputKeys, workingDirectory) {
  const byPath = new Map(result.outputFiles.map((file) => [file.path, file.contents]));
  return Buffer.concat(
    outputKeys.map((key) => {
      const path = resolve(workingDirectory, key);
      const bytes = byPath.get(path);
      if (!bytes) throw new Error(`Missing output bytes: ${key}`);
      return bytes;
    }),
  );
}

export function assertTableInitialBoundary(metafile, initialKeys) {
  const inputs = (keys) => keys.flatMap((key) => Object.keys(metafile.outputs[key]?.inputs ?? {}));
  const initial = inputs(initialKeys);
  if (!initial.some((name) => /neural-ui-core-table\.mjs$/.test(name))) {
    throw new Error('Table core FESM is absent from initial static closure');
  }
  const optional = {
    'advanced-filter': /neu-table-advanced-filter-builder\.component-/,
    editor: /neu-table-active-editor\.component-/,
    csv: /neu-table-csv-export-/,
    json: /neu-table-json-export-/,
    xlsx: /neu-table-xlsx-export-/,
  };
  const allKeys = outputClosure(metafile, { includeDynamic: true });
  const lazyKeys = allKeys.filter((key) => !initialKeys.includes(key));
  const lazy = inputs(lazyKeys);
  for (const [name, pattern] of Object.entries(optional)) {
    if (initial.some((input) => pattern.test(input))) {
      throw new Error(`Table ${name} implementation leaked into initial static closure`);
    }
    if (!lazy.some((input) => pattern.test(input))) {
      throw new Error(`Table ${name} implementation missing from dynamic closure`);
    }
  }
  return { initialOutputs: initialKeys.length, lazyOutputs: lazyKeys.length, lazyKeys };
}

export function assertButtonIconBoundary(metafile) {
  const bundled = Object.keys(metafile.inputs).filter((name) =>
    /(?:^|\/)@neural-icons\//u.test(name),
  );
  if (bundled.length)
    throw new Error(`Button component-only bundle retained icon package: ${bundled.join(', ')}`);
  const external = Object.values(metafile.outputs)
    .flatMap((output) => output.imports ?? [])
    .some((dependency) => dependency.external && dependency.path.startsWith('@neural-icons/'));
  if (!external) throw new Error('Button icon dependency was not externalized');
}
