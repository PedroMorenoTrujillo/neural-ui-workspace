import { DOCUMENT } from '@angular/common';
import {
  CSP_NONCE,
  EnvironmentProviders,
  Provider,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { NEURAL_LOCALE, NEURAL_NOW, NEURAL_TIME_ZONE, NeuNow } from '@neural-ui/core/foundation';
import { ɵNEU_PRESET_INSTALL, type NeuPresetDefinition } from './foundation/neu-preset';

export interface NeuralUIConfig {
  /** Locale determinista por defecto. Si se omite, usa LOCALE_ID. / Deterministic default locale. Falls back to LOCALE_ID. */
  locale?: string;
  /** Zona horaria IANA opcional para superficies con formato horario. / Optional IANA timezone for time formatting surfaces. */
  timeZone?: string;
  /** Reloj inicial inyectable para SSR, pruebas y aplicaciones deterministas. / Injectable initial clock for SSR and tests. */
  now?: NeuNow;
  /** Configuración visual global. / Global visual configuration. */
  theme?: NeuralUIThemeConfig;
}

export interface NeuralUIThemeConfig {
  /** Preset tipado que se registra y activa al arrancar. / Typed preset registered and activated at startup. */
  preset?: NeuPresetDefinition;
}

/**
 * Registra los providers de configuración de Neural UI.
 * Los iconos estructurales tienen fallback en Core; la aplicación puede configurar
 * un proveedor opcional mediante provideNeuIconResolver de @neural-ui/core/foundation.
 * @example
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNeuralUI(),
 *   ],
 * };
 *
 */
export function provideNeuralUI(config: NeuralUIConfig = {}): EnvironmentProviders {
  const preset = config.theme?.preset;
  const deterministicProviders: Provider[] = [];
  if (config.locale)
    deterministicProviders.push({ provide: NEURAL_LOCALE, useValue: config.locale });
  if (config.timeZone)
    deterministicProviders.push({ provide: NEURAL_TIME_ZONE, useValue: config.timeZone });
  if (config.now) deterministicProviders.push({ provide: NEURAL_NOW, useValue: config.now });

  return makeEnvironmentProviders([
    ...deterministicProviders,
    ...(preset
      ? [
          provideEnvironmentInitializer(() =>
            preset[ɵNEU_PRESET_INSTALL](inject(DOCUMENT), inject(CSP_NONCE, { optional: true })),
          ),
        ]
      : []),
  ]);
}
