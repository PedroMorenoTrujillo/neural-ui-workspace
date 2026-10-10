import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const manifestPath = 'projects/ui-core/token-manifest.json';
execFileSync(process.execPath, ['scripts/generate-token-manifest.mjs', '--check'], { stdio: 'inherit' });
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const publicTokens = manifest.tokens.filter((token) => token.public);
const missingDefaults = publicTokens.filter((token) => token.default === null);
const undocumented = publicTokens.filter((token) => !token.documented || !token.description);
const unresolvedFallbacks = publicTokens.flatMap((token) => token.fallback.filter((parent) => !manifest.tokens.some((candidate) => candidate.token === parent && candidate.default !== null)).map((parent) => `${token.token} -> ${parent}`));
const duplicateOwnership = publicTokens.filter((token, index, all) => all.findIndex((candidate) => candidate.token === token.token) !== index);

let source = '';
try {
  source = execFileSync('rg', ['-n', '--glob', '!node_modules/**', '--glob', '!dist/**', '(::ng-deep|/deep/)', 'projects'], { encoding: 'utf8' });
} catch (error) {
  if (error.status !== 1) throw error;
}
if (source.trim()) throw new Error(`Deep selector found:\n${source}`);
if (missingDefaults.length || undocumented.length || unresolvedFallbacks.length || duplicateOwnership.length) {
  throw new Error(JSON.stringify({ missingDefaults, undocumented: undocumented.map((token) => token.token), unresolvedFallbacks, duplicateOwnership: duplicateOwnership.map((token) => token.token) }, null, 2));
}

console.log(JSON.stringify({
  total: manifest.tokenCount,
  public: publicTokens.length,
  defaults: publicTokens.length,
  documented: publicTokens.length,
  internal: manifest.tokens.length - publicTokens.length,
  deepSelectors: 0,
}, null, 2));
