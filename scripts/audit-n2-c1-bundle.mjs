import { build } from 'esbuild';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fesm = join(root, 'dist/neural-ui/core/fesm2022');
const gallery = join(fesm, 'neural-ui-core-gallery.mjs');
const viewer = join(fesm, 'neural-ui-core-image-viewer.mjs');
const cases = {
  galleryBasic: `import {NeuGalleryComponent} from '${gallery}'; export const component=NeuGalleryComponent;`,
  galleryThumbnails: `import {NeuGalleryComponent} from '${gallery}'; export const component=NeuGalleryComponent;`,
  galleryPreview: `import {NeuGalleryComponent} from '${gallery}'; export const component=NeuGalleryComponent;`,
  galleryAdvanced: `import {NeuGalleryComponent} from '${gallery}'; export const component=NeuGalleryComponent;`,
  imageViewerStandalone: `import {NeuImageViewerDirective} from '${viewer}'; export const directive=NeuImageViewerDirective;`,
  combined: `import {NeuGalleryComponent} from '${gallery}'; import {NeuImageViewerDirective} from '${viewer}'; export const surfaces=[NeuGalleryComponent,NeuImageViewerDirective];`,
  rootUnused: `import {NeuGalleryComponent,NeuImageViewerDirective} from '${join(fesm, 'neural-ui-core.mjs')}';`,
};

const results = {};
for (const [name, contents] of Object.entries(cases)) {
  const result = await build({
    stdin: { contents, sourcefile: 'consumer.ts', resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    metafile: true,
    external: ['@angular/*', '@angular/cdk/*', 'rxjs', '@neural-icons/*'],
    plugins: [{
      name: 'n2-c1-private-internal',
      setup(plugin) {
        plugin.onResolve({ filter: /^@neural-ui\/core\/internal$/ }, () => ({
          path: join(fesm, 'neural-ui-core-internal.mjs'),
        }));
      },
    }],
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  results[name] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}
if (results.rootUnused.raw !== 0) throw new Error(`C1 root-unused retained ${results.rootUnused.raw} B`);
if (['galleryBasic', 'galleryThumbnails', 'galleryPreview', 'galleryAdvanced'].some(
  (name) => JSON.stringify(results[name]) !== JSON.stringify(results.galleryBasic),
)) throw new Error('C1 Angular component variants unexpectedly differ');
console.log(JSON.stringify(results, null, 2));
console.log('The four Gallery modes share one static Angular component/template; input values are runtime data, not separate tree-shakeable variants.');
