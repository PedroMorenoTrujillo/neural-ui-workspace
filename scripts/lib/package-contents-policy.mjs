import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync(new URL('../package-contents-policy.json', import.meta.url), 'utf8'));
const publicFiles = new Map();
for (const category of policy.categories) {
  if (category.classification !== 'PUBLIC NECESSARY' || !category.reason?.trim()) {
    throw new Error('Every public package category requires a justification');
  }
  for (const path of category.files) {
    if (publicFiles.has(path)) throw new Error(`Duplicate package policy path: ${path}`);
    publicFiles.set(path, category.reason);
  }
}

export function classifyPackageFile(path) {
  if (publicFiles.has(path)) return 'PUBLIC NECESSARY';
  if (path.endsWith('.map') && publicFiles.has(path.slice(0, -4))) {
    return 'DEBUG ARTIFACT SEPARATE';
  }
  return 'INTERNAL NOT PUBLISHED';
}

/** Checks npm's actual inventory, never a size budget or a permissive extension glob. */
export function assertPackageContents(paths, { allowDebug = false } = {}) {
  const actual = new Set(paths);
  if (actual.size !== paths.length) throw new Error('Duplicate npm package paths');
  const rejected = paths.filter((path) => {
    const classification = classifyPackageFile(path);
    return classification !== 'PUBLIC NECESSARY' &&
      !(allowDebug && classification === 'DEBUG ARTIFACT SEPARATE');
  });
  const missing = [...publicFiles.keys()].filter((path) => !actual.has(path));
  if (rejected.length || missing.length) {
    throw new Error([
      ...rejected.map((path) => `${classifyPackageFile(path)}: ${path}`),
      ...missing.map((path) => `Missing PUBLIC NECESSARY: ${path}`),
    ].join('\n'));
  }
  return { publicFiles: publicFiles.size, debugFiles: paths.length - publicFiles.size };
}
