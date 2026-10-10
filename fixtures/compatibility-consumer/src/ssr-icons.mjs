await import('@angular/compiler');

const { Component, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { NeuButtonComponent } = await import('@neural-ui/core/button');
const { NeuAlertComponent } = await import('@neural-ui/core/alert');
const { NeuralIcon } = await import('@neural-icons/angular');
const { provideNeuIconResolver } = await import('@neural-ui/core/foundation');
const { iconSave } = await import('@neural-icons/core/icons/save');
const { iconDownload } = await import('@neural-icons/core/icons/download');

class IconSsrApp {}
Component({
  selector: 'app-root',
  standalone: true,
  imports: [NeuButtonComponent, NeuAlertComponent],
  template: `<neu-alert tone="success">Ready</neu-alert>
    <button neu-button icon="save">Save</button>
    <button neu-button icon="download" iconPosition="end">Download</button>
    <button neu-button icon="save" [iconOnly]="true" ariaLabel="Save item"></button>
    <button neu-button icon="trash" [iconOnly]="true" ariaLabel="Missing icon"></button>`,
})(IconSsrApp);

const html = await renderApplication(
  (context) => bootstrapApplication(IconSsrApp, {
    providers: [provideServerRendering(), provideZonelessChangeDetection(),
      provideNeuIconResolver(({ key, size, strokeWidth }) => {
        const icon = { save: iconSave, download: iconDownload }[key];
        return icon ? { component: NeuralIcon, inputs: { icon, size, strokeWidth } } : null;
      })],
  }, context),
  { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
);
if (!html.includes('Ready') || !html.includes('Save item') || !html.includes('Download')) {
  throw new Error('A0.2 SSR content missing.');
}
const svgCount = (html.match(/<svg\b/g) ?? []).length;
if (svgCount !== 3) throw new Error(`A0.2 expected three application-resolved SVGs, got ${svgCount}.`);
if (html.includes('ng050')) throw new Error('A0.2 SSR contains a hydration mismatch marker.');
console.log(`A0.2 Angular 22 zoneless SSR PASS: ${svgCount} SVGs; missing name has no geometry.`);
