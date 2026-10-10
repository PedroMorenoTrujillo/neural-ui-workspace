import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import ts from 'typescript';
import { rolldown } from 'rolldown';

/**
 * Share the already-eager Table helpers in one static runtime. Existing helper
 * entry files remain export-compatible facades for lazy feature consumers.
 * A public facade preserves exactly the existing exports and declaration path;
 * the actual Table implementation stays in neural-ui-core-table.mjs. Dynamic
 * features and external secondary entrypoints are never followed.
 */
export async function consolidateUiCoreTable(packageRoot) {
  const entry = resolve(packageRoot, 'fesm2022/neural-ui-core-table.mjs');
  const directory = dirname(entry);
  const manifestPath = resolve(packageRoot, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const facadeName = 'neural-ui-core-table-public';
  const facadeTarget = `./fesm2022/${facadeName}.mjs`;
  if (manifest.exports['./table'].default === facadeTarget) return;
  const allowed = new Set();
  const visit = (file) => {
    if (allowed.has(file)) return;
    if (dirname(file) !== directory || !existsSync(file))
      throw new Error(`Unexpected Table static dependency: ${file}`);
    allowed.add(file);
    const code = readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const statement of source.statements) {
      if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) ||
          !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (specifier.startsWith('.')) visit(resolve(dirname(file), specifier));
    }
  };
  visit(entry);
  if (allowed.size < 2) return;
  const bundle = await rolldown({
    input: Object.fromEntries([...allowed].map((file) => [
      file === entry ? facadeName : basename(file, '.mjs'), file,
    ])),
    preserveEntrySignatures: 'strict',
    external(id, importer) {
      const file = id.startsWith('.') && importer ? resolve(dirname(importer), id) : id;
      return !allowed.has(file);
    },
    plugins: [{ name: 'original-table-source-maps', load(id) {
      if (!allowed.has(id)) return null;
      return {
        code: readFileSync(id, 'utf8'),
        map: existsSync(`${id}.map`) ? readFileSync(`${id}.map`, 'utf8') : null,
      };
    } }],
  });
  try {
    await bundle.write({
      dir: directory, format: 'esm', sourcemap: true,
      entryFileNames: '[name].mjs',
      chunkFileNames: (chunk) => chunk.name === 'neural-ui-core-table'
        ? 'neural-ui-core-table.mjs' : '[name]-[hash].mjs',
      codeSplitting: { groups: [{
        name: 'neural-ui-core-table', test: (id) => allowed.has(id),
      }] },
    });
  } finally {
    await bundle.close();
  }
  // Export-only facades have no mapped source and Rolldown emits no replacement
  // map for them. Remove only obsolete maps of the generated modules we rewrote.
  for (const file of allowed) {
    const mapPath = `${file}.map`;
    if (existsSync(mapPath) &&
        !readFileSync(file, 'utf8').includes(`sourceMappingURL=${basename(mapPath)}`)) {
      unlinkSync(mapPath);
    }
  }
  manifest.exports['./table'].default = facadeTarget;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Consolidated ${allowed.size} already-static Table modules; dynamic features remain external.`);
}
