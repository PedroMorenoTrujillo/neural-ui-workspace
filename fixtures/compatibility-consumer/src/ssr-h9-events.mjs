import assert from 'node:assert/strict';
await import('@angular/compiler');
const core = await import('@angular/core');
const { bootstrapApplication, provideClientHydration } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const imports = [];
for (const [entry, name] of [
  ['modal', 'NeuDialogComponent'],
  ['bottom-sheet', 'NeuBottomSheetComponent'],
  ['date-input', 'NeuDateInputComponent'],
  ['tree-select', 'NeuTreeSelectComponent'],
  ['virtual-list', 'NeuVirtualListComponent'],
  ['autocomplete', 'NeuAutocompleteComponent'],
  ['input-tags', 'NeuInputTagsComponent'],
  ['color-picker', 'NeuColorPickerComponent'],
]) {
  imports.push((await import(`@neural-ui/core/${entry}`))[name]);
}
const events = [];
class H9SSR {
  record(name) {
    events.push(name);
  }
}
core.Component({
  selector: 'app-root',
  standalone: true,
  imports,
  template: `
 <neu-dialog [open]="true" title="SSR event dialog" (opened)="record('dialogOpened')" (hidden)="record('dialogHidden')" />
 <neu-bottom-sheet [open]="true" title="SSR event sheet" (opened)="record('sheetOpened')" (hidden)="record('sheetHidden')" />
 <neu-date-input (viewChange)="record('view')" (opened)="record('dateOpened')" />
 <neu-tree-select (filter)="record('filter')" (opened)="record('treeOpened')" />
 <neu-virtual-list [items]="['SSR row']" (rangeChange)="record('range')" />
 <neu-autocomplete (select)="record('select')" /><neu-input-tags (select)="record('tagSelect')" />
 <neu-color-picker mode="oklch" [showAlpha]="true" [showChannels]="true"
   (opened)="record('colorOpened')" (closed)="record('colorClosed')"
   (colorChange)="record('colorChange')" (colorChangeEnd)="record('colorEnd')" />
`,
})(H9SSR);
const zoneless =
  core.provideZonelessChangeDetection ?? core.provideExperimentalZonelessChangeDetection;
const html = await renderApplication(
  (context) =>
    bootstrapApplication(
      H9SSR,
      {
        providers: [provideServerRendering(), provideClientHydration(), zoneless()],
      },
      context,
    ),
  { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
);
assert.ok(html.includes('SSR event dialog'));
assert.ok(html.includes('SSR event sheet'));
assert.ok(html.includes('neu-color-picker'));
assert.ok(html.includes('oklch('));
assert.ok(html.includes('ngh='), 'SSR must include hydration annotations');
assert.deepEqual(events, [], 'server rendering and destruction must not emit browser lifecycle');
console.log(
  'H9 affected overlays/selection/virtualization SSR with hydration annotations passed; zero server outputs',
);
