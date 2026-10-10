import assert from 'node:assert/strict';
await import('@angular/compiler');
const { Component, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication, provideClientHydration } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { NeuDateInputComponent } = await import('@neural-ui/core/date-input');
const { NeuNotificationCenterComponent } = await import('@neural-ui/core/notification-center');
const { NeuMegaMenuComponent } = await import('@neural-ui/core/mega-menu');
const { NeuKanbanComponent } = await import('@neural-ui/core/kanban');
const { NeuColorPickerComponent } = await import('@neural-ui/core/color-picker');
const internal = await import('@neural-ui/core/internal');
const canonical = await import('@neural-ui/core/internal-state');

assert.equal(internal.NeuInitialTemporalState, canonical.NeuInitialTemporalState);
assert.equal(internal.NeuResponsiveState, canonical.NeuResponsiveState);

class Rel01eSsr {}
Component({
  selector: 'app-root',
  imports: [
    NeuDateInputComponent,
    NeuNotificationCenterComponent,
    NeuMegaMenuComponent,
    NeuKanbanComponent,
    NeuColorPickerComponent,
  ],
  template: `
    <neu-date-input id="rel01e-date" />
    <neu-notification-center id="rel01e-notification" />
    <neu-mega-menu id="rel01e-mega" [items]="[]" />
    <neu-kanban id="rel01e-kanban" [columns]="[]" />
    <neu-color-picker id="rel01e-color" />
  `,
})(Rel01eSsr);

const html = await renderApplication(
  (context) => bootstrapApplication(Rel01eSsr, {
    providers: [provideServerRendering(), provideClientHydration(), provideZonelessChangeDetection()],
  }, context),
  { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
);
for (const id of ['rel01e-date', 'rel01e-notification', 'rel01e-mega', 'rel01e-kanban', 'rel01e-color']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /ngh=/);
console.log('REL-01E tarball SSR passed: five affected components, class identity, hydration annotations, zoneless');
