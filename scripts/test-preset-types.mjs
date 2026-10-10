import ts from 'typescript';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
const dir = mkdtempSync(join(tmpdir(), 'neural-preset-types-'));
const source = join(dir, 'consumer.ts');
const entry = resolve('dist/neural-ui/core/types/neural-ui-core.js');
function diagnostics(body) {
  writeFileSync(source, `import { defineNeuPreset } from '${entry}';\n${body}`);
  const program = ts.createProgram([source], {
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  return ts.getPreEmitDiagnostics(program);
}
try {
  const valid = diagnostics(
    `const p = defineNeuPreset({ name: 'consumer', light: { '--neu-text': 'var(--consumer-text)', '--neu-radius': 0 }, dark: { '--neu-text': '#fff' } });`,
  );
  if (valid.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(valid, {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: () => dir,
        getNewLine: () => '\n',
      }),
    );
  for (const token of ['--neu-does-not-exist', '--neu-cp-color', '--external-token']) {
    const invalid = diagnostics(
      `const p = defineNeuPreset({ name: 'consumer', light: { '${token}': 'red' } });`,
    );
    if (!invalid.some((d) => [2353, 2561].includes(d.code)))
      throw new Error(`Invalid token compiled: ${token}`);
  }
  console.log(
    'Public app-config preset types: valid CSS/external values pass; unknown/private/external names fail compilation.',
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
