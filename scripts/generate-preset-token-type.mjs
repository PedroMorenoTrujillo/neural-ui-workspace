import { readFileSync, writeFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('projects/ui-core/token-manifest.json', 'utf8'));
const path = 'projects/ui-core/foundation/neu-token-name.generated.ts';
const output = '/** Generated from public token-manifest.json; do not edit. */\nexport type NeuTokenName =\n' + manifest.tokens.filter(t => t.public).map(t => `  | '${t.token}'`).join('\n') + ';\n';
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output) throw new Error('Preset token names are stale.');
} else writeFileSync(path, output);
