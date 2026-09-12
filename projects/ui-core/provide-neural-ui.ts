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
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  lucideBold,
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronUp,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideDownload,
  lucideExternalLink,
  lucideEraser,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideImage,
  lucideInbox,
  lucideInfo,
  lucideItalic,
  lucideLink,
  lucideList,
  lucideListOrdered,
  lucideMinus,
  lucidePencil,
  lucidePlus,
  lucideRotateCcw,
  lucideRotateCw,
  lucideTriangleAlert,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideUnderline,
  lucideUpload,
  lucideX,
  lucideZoomIn,
  lucideZoomOut,
} from '@ng-icons/lucide';

export interface NeuralUIConfig {
  /** Tamaño por defecto de los iconos. Por defecto: '1.25rem' / Default icon size. Default: '1.25rem' */
  iconSize?: string;
  /** Grosor de trazo de los iconos. Por defecto: '2' / Icon stroke width. Default: '2' */
  iconStrokeWidth?: string;
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
  const preset = config.theme?.preset;
  const deterministicProviders: Provider[] = [];
  if (config.locale)
    deterministicProviders.push({ provide: NEURAL_LOCALE, useValue: config.locale });
  if (config.timeZone)
    deterministicProviders.push({ provide: NEURAL_TIME_ZONE, useValue: config.timeZone });
  if (config.now) deterministicProviders.push({ provide: NEURAL_NOW, useValue: config.now });

  return makeEnvironmentProviders([
    provideIcons({
      // Input validation
      lucideAlertCircle: lucideCircleAlert,
      // Toast severity icons
      lucideCheckCircle: lucideCircleCheck,
      lucideXCircle: lucideCircleX,
      lucideAlertTriangle: lucideTriangleAlert,
      lucideInfo,
      // Close buttons (sidebar, modal, toast)
      lucideX,
      // Nav chevrons + collapse toggle
      lucideChevronRight,
      lucideChevronLeft,
      lucideChevronUp,
      // Gallery and image viewer controls
      lucideZoomIn,
      lucideZoomOut,
      lucideRotateCcw,
      lucideRotateCw,
      lucideFlipHorizontal2,
      lucideFlipVertical2,
      lucideDownload,
      // Nav external link
      lucideExternalLink,
      // EmptyState default icon
      lucideInbox,
      // StatsCard trend icons
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      // Uploader picker-only trigger
      lucideUpload,
      // InlineEditor defaults
      lucideCheck,
      lucidePencil,
      // SpeedDial default trigger
      lucidePlus,
      // RichTextEditor default toolbar
      lucideBold,
      lucideItalic,
      lucideUnderline,
      lucideList,
      lucideListOrdered,
      lucideLink,
      lucideImage,
      lucideEraser,
    }),
    provideNgIconsConfig({ size: iconSize, strokeWidth: iconStrokeWidth }),
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
