import { ApplicationConfig } from '@angular/core';
import { defineNeuPreset as defineRootPreset, provideNeuralUI } from '@neural-ui/core';
import {
  defineNeuPreset as defineFoundationPreset,
  type NeuPresetDefinition,
} from '@neural-ui/core/foundation';

// Compile against the packed package, not workspace aliases. A unique symbol
// duplicated into two entry points used to make these public types incompatible.
const foundationPreset = defineFoundationPreset({
  name: 'foundation-preset',
  light: { '--neu-primary': '#2563eb' },
});
const rootPreset: NeuPresetDefinition = defineRootPreset({
  name: 'root-preset',
  dark: { '--neu-primary': '#60a5fa' },
});

export const foundationPresetConfig: ApplicationConfig = {
  providers: [provideNeuralUI({ theme: { preset: foundationPreset } })],
};
export const rootPresetConfig: ApplicationConfig = {
  providers: [provideNeuralUI({ theme: { preset: rootPreset } })],
};
