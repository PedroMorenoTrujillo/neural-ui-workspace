import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function npmReleaseChannel(version) {
  const match = /^(1|2)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(-[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) throw new Error('Expected a Core v1 or v2 release version');
  return match[1] === '1' ? (match[2] ? 'legacy-next' : 'legacy') : (match[2] ? 'next' : 'latest');
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const manifest = JSON.parse(readFileSync(resolve('dist/release/release-manifest.json'), 'utf8'));
  console.log(npmReleaseChannel(manifest.package.version));
}
