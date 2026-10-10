await import('@angular/compiler');

const { Component, CSP_NONCE, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { defineNeuPreset: defineRootPreset, provideNeuralUI } = await import('@neural-ui/core');
const { defineNeuPreset: defineFoundationPreset } = await import('@neural-ui/core/foundation');

class PresetSsrApp {}
Component({ selector: 'app-root', standalone: true, template: 'Preset ready' })(PresetSsrApp);

for (const [name, definePreset] of [
  ['root-preset', defineRootPreset],
  ['foundation-preset', defineFoundationPreset],
]) {
  const preset = definePreset({
    name,
    light: { '--neu-primary': '#2563eb' },
    dark: { '--neu-primary': '#60a5fa' },
  });
  const html = await renderApplication(
    (context) => bootstrapApplication(PresetSsrApp, {
      providers: [
        provideServerRendering(),
        provideZonelessChangeDetection(),
        { provide: CSP_NONCE, useValue: 'preset-ssr-nonce' },
        provideNeuralUI({ theme: { preset } }),
        provideNeuralUI({ theme: { preset } }),
      ],
    }, context),
    { document: '<!doctype html><html><head></head><body><app-root></app-root></body></html>', url: '/' },
  );
  if (!html.includes(`data-neu-preset="${name}"`) ||
      !html.includes('--neu-primary: #2563eb;') ||
      !html.includes('--neu-primary: #60a5fa;') ||
      !html.includes('nonce="preset-ssr-nonce"') ||
      (html.match(/data-neu-preset-style=/g) ?? []).length !== 1) {
    throw new Error(`Packed ${name} registration, modes, nonce or idempotence failed.`);
  }
}
console.log('Packed root/foundation presets: AOT-compatible types and SSR registration passed.');
