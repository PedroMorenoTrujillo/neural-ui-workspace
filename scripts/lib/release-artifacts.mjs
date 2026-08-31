import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, sep } from 'node:path';

const sourceMapPatterns = [
  /^[\t ]*\/\/[#@][\t ]*sourceMappingURL=([^\s]+)[\t ]*(?:\r?\n|$)/gm,
  /\/\*[#@][\t ]*sourceMappingURL=([^*]+?)[\t ]*\*\//gs,
];

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256File(path) {
  return sha256(readFileSync(path));
}

export function walkFiles(root) {
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = `${root}${sep}${entry.name}`;
      return entry.isDirectory() ? walkFiles(path) : [path];
    })
    .sort();
}

export function toPosix(path) {
  return path.split(sep).join('/');
}

export function fileRecords(root) {
  return walkFiles(root).map((path) => ({
    path: toPosix(relative(root, path)),
    bytes: statSync(path).size,
    sha256: sha256File(path),
  }));
}

export function fingerprint(records) {
  const canonical = [...records]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(({ path, bytes, sha256: hash }) => `${path}\0${bytes}\0${hash}\n`)
    .join('');
  return sha256(canonical);
}

export function findSourceMapReferences(source) {
  const references = [];
  for (const pattern of sourceMapPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      references.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        url: match[1].trim(),
      });
    }
  }
  return references.sort((left, right) => left.start - right.start);
}

export function stripSourceMapReferences(source) {
  const references = findSourceMapReferences(source);
  let stripped = source;
  for (const reference of [...references].reverse()) {
    stripped = stripped.slice(0, reference.start) + stripped.slice(reference.end);
  }

  let removedBytes = 0;
  const removals = references.map((reference) => {
    const startAfter = reference.start - removedBytes;
    removedBytes += reference.end - reference.start;
    return {
      startAfter,
      text: reference.text,
      url: reference.url,
    };
  });
  return { stripped, removals };
}

export function restoreSourceMapReferences(source, removals) {
  let restored = source;
  for (const removal of [...removals].sort((left, right) => right.startAfter - left.startAfter)) {
    restored =
      restored.slice(0, removal.startAfter) + removal.text + restored.slice(removal.startAfter);
  }
  return restored;
}

export function isSourceMapCarrier(path) {
  return /\.(?:cjs|mjs|js|css)$/i.test(path);
}

export function categoryFor(path) {
  if (path.endsWith('.map')) return 'maps';
  if (/\.(?:cjs|mjs|js)$/i.test(path)) return 'javascript';
  if (path.endsWith('.d.ts')) return 'typings';
  if (/\.(?:css|scss|sass)$/i.test(path)) return 'styles';
  if (path.endsWith('.json')) return 'metadata';
  return 'assets';
}

export function summarizeFiles(records) {
  const summary = {};
  for (const record of records) {
    const category = categoryFor(record.path);
    summary[category] ??= { files: 0, bytes: 0 };
    summary[category].files += 1;
    summary[category].bytes += record.bytes;
  }
  return summary;
}
