import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'projects/ui-core');
const contract = JSON.parse(readFileSync(join(source, 'public-contract.v2.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'dist/neural-ui/core/package.json'), 'utf8'));
const gallery = readFileSync(join(source, 'gallery/neu-gallery.component.ts'), 'utf8');
const viewer = readFileSync(join(source, 'image-viewer/neu-image-viewer.component.ts'), 'utf8');

test('C1 physically removes ImageGallery and retains two canonical public entrypoints', () => {
  assert.equal(existsSync(join(source, 'image-gallery')), false);
  assert.equal(Object.hasOwn(pkg.exports, './image-gallery'), false);
  assert.ok(contract.entrypoints.some((entry) => entry.entrypoint === './gallery'));
  assert.ok(contract.entrypoints.some((entry) => entry.entrypoint === './image-viewer'));
  assert.ok(!contract.entrypoints.some((entry) => entry.entrypoint === './image-gallery'));
  assert.ok(!contract.items.some((item) => item.name === 'NeuImageGalleryComponent'));
});

test('C1 keeps one media item object shape and required consumer alt', () => {
  const galleryItem = contract.items.find((item) => item.id === './gallery#NeuGalleryItem');
  const viewerItem = contract.items.find((item) => item.id === './image-viewer#NeuImageViewerItem');
  assert.match(galleryItem.signature, /NeuGalleryItem = NeuImageViewerItem/);
  assert.equal(viewerItem.members.find((member) => member.name === 'src')?.signature, 'src: string;');
  assert.equal(viewerItem.members.find((member) => member.name === 'alt')?.signature, 'alt: string;');
  assert.equal(viewerItem.members.find((member) => member.name === 'caption')?.signature, 'caption?: string;');
  assert.match(viewer, /alt: ''/);
});

test('C1 freezes new Gallery inputs and keeps its existing outputs', () => {
  const bindings = contract.bindings.filter((binding) => binding.entrypoint === './gallery' && binding.declaration === 'NeuGalleryComponent');
  const inputs = bindings.filter((binding) => binding.kind === 'input');
  const outputs = bindings.filter((binding) => binding.kind === 'output');
  for (const name of ['showCounter', 'previewEnabled']) {
    assert.equal(inputs.filter((binding) => binding.publicName === name).length, 1);
  }
  assert.equal(inputs.some((binding) => binding.publicName === 'viewerEnabled'), false);
  assert.equal(outputs.length, 6);
  assert.ok(outputs.some((binding) => binding.publicName === 'previewChange'));
});

test('C1 has one private overlay engine and no second fixed Gallery preview', () => {
  assert.equal((viewer.match(/selector: 'neu-image-viewer-overlay'/g) ?? []).length, 1);
  assert.match(gallery, /NeuImageViewerDirective/);
  assert.doesNotMatch(gallery, /selector: 'neu-gallery-preview'|position:\s*fixed|NeuModalFocusDirective/);
  assert.doesNotMatch(gallery, /effect\s*\(/);
});
