import { neuPresetCss, type NeuPreset } from '@neural-ui/core/foundation';
const preset = { light: { '--neu-text': 'var(--app-text)' }, dark: { '--neu-text': '#fff' } } satisfies NeuPreset;
if (!neuPresetCss('compat', preset).includes('--app-text')) throw new Error('Preset generation failed');
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { provideNeuralUI } from '@neural-ui/core';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection(), provideRouter([]), provideNeuralUI()],
});
