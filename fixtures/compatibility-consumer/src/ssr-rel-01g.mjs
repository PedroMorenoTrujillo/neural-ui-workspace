import assert from 'node:assert/strict';
await import('@angular/compiler');
const { Component, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication, provideClientHydration } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const menu = await import('@neural-ui/core/menu');
const shared = await import('@neural-ui/core/menu-shared');
const tiered = await import('@neural-ui/core/menu-tiered');
const { NeuPickListComponent, NeuOrderListComponent } = await import('@neural-ui/core/pick-list');
const { NeuTableComponent } = await import('@neural-ui/core/table');
const { NeuColorPickerComponent } = await import('@neural-ui/core/color-picker');
const { NeuKanbanComponent } = await import('@neural-ui/core/kanban');
const internal = await import('@neural-ui/core/internal');
const state = await import('@neural-ui/core/internal-state');

assert.equal(menu.NeuMenuItemDirective, shared.NeuMenuItemDirective);
assert.equal(menu.NeuTieredMenuComponent, tiered.NeuTieredMenuComponent);
assert.equal(internal.NeuInitialTemporalState, state.NeuInitialTemporalState);

class Rel01gSsr {
  rowKey = (row) => row.id;
}
Component({
  selector: 'app-root',
  imports: [
    menu.NeuMenuComponent,
    menu.NeuMenuButtonComponent,
    menu.NeuMenubarComponent,
    menu.NeuTieredMenuComponent,
    NeuPickListComponent,
    NeuOrderListComponent,
    NeuTableComponent,
    NeuColorPickerComponent,
    NeuKanbanComponent,
  ],
  template: `
    <neu-menu id="rel01g-menu" [items]="[]" />
    <neu-menu-button id="rel01g-button" [items]="[]" label="Actions" />
    <neu-menubar id="rel01g-menubar" [items]="[]" />
    <neu-tiered-menu id="rel01g-tiered" [items]="[]" />
    <neu-pick-list id="rel01g-pick" [source]="[]" [target]="[]" />
    <neu-order-list id="rel01g-order" [items]="[]" />
    <neu-table id="rel01g-table" [columns]="[]" [data]="[]" [rowKey]="rowKey" />
    <neu-color-picker id="rel01g-color" />
    <neu-kanban id="rel01g-kanban" [columns]="[]" />
  `,
})(Rel01gSsr);

const html = await renderApplication(
  (context) => bootstrapApplication(Rel01gSsr, {
    providers: [provideServerRendering(), provideClientHydration(), provideZonelessChangeDetection()],
  }, context),
  { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
);
for (const name of ['menu', 'button', 'menubar', 'tiered', 'pick', 'order', 'table', 'color', 'kanban']) {
  assert.match(html, new RegExp(`id="rel01g-${name}"`));
}
assert.match(html, /ngh=/);
console.log('REL-01G tarball SSR passed: Menu/Tiered/Menubar/Pick/Order/Table/Color/Kanban, identities, hydration annotations, zoneless');
