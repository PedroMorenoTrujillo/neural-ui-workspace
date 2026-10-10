import { neuPresetCss, type NeuPreset } from '@neural-ui/core/foundation';
const preset = { light: { '--neu-text': 'var(--app-text)' }, dark: { '--neu-text': '#fff' } } satisfies NeuPreset;
if (!neuPresetCss('compat', preset).includes('--app-text')) throw new Error('Preset generation failed');
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { provideNeuralUI } from '@neural-ui/core';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconHome } from '@neural-icons/core/icons/home';
import { iconSave } from '@neural-icons/core/icons/save';
import { iconDownload } from '@neural-icons/core/icons/download';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection(), provideRouter([]), provideNeuralUI(), provideNeuralIcons(iconHome, iconSave, iconDownload)],
});
