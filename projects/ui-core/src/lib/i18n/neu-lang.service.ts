import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

export type NeuLang = 'es' | 'en';

export type NeuTranslationMap = Record<string, string>;

const STORAGE_KEY = 'neu-lang';

const TRANSLATIONS: Record<NeuLang, NeuTranslationMap> = {
  es: {
    // Navegación
    'nav.gettingStarted': 'Primeros pasos',
    'nav.home': 'Inicio',
    'nav.components': 'Componentes',
    'nav.form': 'Formularios',
    'nav.data': 'Datos',
    'nav.navigation': 'Navegación',
    'nav.charts': 'Gráficas',
    'nav.overlays': 'Overlays',
    'nav.templates': 'Templates',
    // Header
    'header.github': 'GitHub',
    'header.templates': 'Premium Templates',
    'header.openMenu': 'Abrir menú',
    // Componentes
    'comp.badge': 'Badge',
    'comp.button': 'Button',
    'comp.card': 'Card',
    'comp.input': 'Input',
    'comp.select': 'Select',
    'comp.sidebar': 'Sidebar',
    'comp.table': 'Table',
    'comp.avatar': 'Avatar',
    'comp.emptyState': 'Empty State',
    'comp.modal': 'Modal',
    'comp.statsCard': 'Stats Card',
    'comp.chart': 'Chart',
    // Páginas
    'page.home.title': 'NeuralUI — Sistema de Diseño Angular',
    'page.home.subtitle': 'Componentes de alta calidad con Signals y OnPush, listos para producción.',
    'page.templates.title': 'Premium Templates',
    'page.templates.subtitle': 'Dashboards y landing pages construidos con NeuralUI.',
    'templates.preview': 'Vista previa',
    'templates.buy': 'Comprar',
    'templates.free': 'Gratis',
  },
  en: {
    // Navigation
    'nav.gettingStarted': 'Getting Started',
    'nav.home': 'Home',
    'nav.components': 'Components',
    'nav.form': 'Form',
    'nav.data': 'Data',
    'nav.navigation': 'Navigation',
    'nav.charts': 'Charts',
    'nav.overlays': 'Overlays',
    'nav.templates': 'Templates',
    // Header
    'header.github': 'GitHub',
    'header.templates': 'Premium Templates',
    'header.openMenu': 'Open menu',
    // Components
    'comp.badge': 'Badge',
    'comp.button': 'Button',
    'comp.card': 'Card',
    'comp.input': 'Input',
    'comp.select': 'Select',
    'comp.sidebar': 'Sidebar',
    'comp.table': 'Table',
    'comp.avatar': 'Avatar',
    'comp.emptyState': 'Empty State',
    'comp.modal': 'Modal',
    'comp.statsCard': 'Stats Card',
    'comp.chart': 'Chart',
    // Pages
    'page.home.title': 'NeuralUI — Angular Design System',
    'page.home.subtitle': 'High-quality components with Signals and OnPush, production-ready.',
    'page.templates.title': 'Premium Templates',
    'page.templates.subtitle': 'Dashboards and landing pages built with NeuralUI.',
    'templates.preview': 'Preview',
    'templates.buy': 'Buy Now',
    'templates.free': 'Free',
  },
};

/**
 * NeuLangService — Sistema de i18n ligero basado en Signals.
 *
 * - Persiste el idioma en LocalStorage (clave: 'neu-lang')
 * - Sincroniza con la URL (?lang=es)
 * - Reactivo: cambios en `lang` producen re-render automático vía signals
 *
 * Uso en templates:
 *   {{ i18n.t('nav.home') }}
 *   {{ i18n.lang() }}  // 'es' | 'en'
 *
 * Cambiar idioma:
 *   i18n.setLang('en');
 */
@Injectable({ providedIn: 'root' })
export class NeuLangService {
  private readonly urlState = inject(NeuUrlStateService, { optional: true });
  private readonly doc = inject(DOCUMENT);

  private readonly _lang = signal<NeuLang>(this.#loadInitial());

  /** Signal con el idioma activo. */
  readonly lang: Signal<NeuLang> = this._lang.asReadonly();

  /** Signal con el mapa de traducciones activo. */
  readonly translations = computed(() => TRANSLATIONS[this._lang()]);

  constructor() {
    // Sincronizar lang → URL cuando el URL state service está disponible
    if (this.urlState) {
      const urlLang = this.urlState.getParam('lang');
      effect(() => {
        const fromUrl = urlLang() as NeuLang | null;
        if (fromUrl && (fromUrl === 'es' || fromUrl === 'en') && fromUrl !== this._lang()) {
          this._lang.set(fromUrl);
          this.#persist(fromUrl);
        }
      });
    }
  }

  /**
   * Cambia el idioma activo, persiste en localStorage y actualiza la URL.
   */
  setLang(lang: NeuLang): void {
    this._lang.set(lang);
    this.#persist(lang);
    this.urlState?.setParam('lang', lang);
    this.doc.documentElement.lang = lang;
  }

  /**
   * Traduce una clave. Si no existe, devuelve la clave como fallback.
   */
  t(key: string): string {
    return this.translations()[key] ?? key;
  }

  /** @internal Carga el idioma inicial desde URL → localStorage → 'es' */
  #loadInitial(): NeuLang {
    // Intentar desde localStorage
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'es' || stored === 'en') return stored;
    return 'es';
  }

  #persist(lang: NeuLang): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }
}
