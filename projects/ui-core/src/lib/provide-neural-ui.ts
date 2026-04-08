import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideCheckCircle,
  lucideChevronLeft,
  lucideChevronRight,
  lucideExternalLink,
  lucideInbox,
  lucideInfo,
  lucideMinus,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';

export interface NeuralUIConfig {
  /** Tamaño por defecto de los iconos. Por defecto: '1.25rem' */
  iconSize?: string;
  /** Grosor de trazo de los iconos. Por defecto: '2' */
  iconStrokeWidth?: string;
}

/**
 * Registra los providers necesarios para NeuralUI.
 *
 * Incluye los iconos internos de la librería y la configuración
 * por defecto de @ng-icons.
 *
 * @example
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNeuralUI(),
 *   ],
 * };
 *
 * @example
 * // Con opciones personalizadas
 * provideNeuralUI({ iconSize: '1rem', iconStrokeWidth: '1.5' })
 */
export function provideNeuralUI(config: NeuralUIConfig = {}): EnvironmentProviders {
  const { iconSize = '1.25rem', iconStrokeWidth = '2' } = config;

  return makeEnvironmentProviders([
    provideIcons({
      // Input validation
      lucideAlertCircle,
      // Toast severity icons
      lucideCheckCircle,
      lucideXCircle,
      lucideAlertTriangle,
      lucideInfo,
      // Close buttons (sidebar, modal, toast)
      lucideX,
      // Nav chevrons + collapse toggle
      lucideChevronRight,
      lucideChevronLeft,
      // Nav external link
      lucideExternalLink,
      // EmptyState default icon
      lucideInbox,
      // StatsCard trend icons
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
    }),
    provideNgIconsConfig({ size: iconSize, strokeWidth: iconStrokeWidth }),
  ]);
}
