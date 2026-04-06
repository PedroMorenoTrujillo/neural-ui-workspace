import { effect, inject, Injectable, signal, Signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { NeuUrlStateService } from '@neural-ui/core';

export type NeuLang = 'es' | 'en';

const STORAGE_KEY = 'neu-lang';
const VALID_LANGS: NeuLang[] = ['es', 'en'];

/**
 * NeuTranslationService — Puente entre Transloco, la URL y localStorage.
 *
 * - Lee el idioma inicial desde: URL (?lang=) → localStorage → 'es'
 * - Al cambiar idioma: actualiza Transloco + URL + localStorage + <html lang>
 * - Expone `lang` como Signal<NeuLang> para uso en templates con Signals
 *
 * Uso en templates:
 *   {{ 'nav.home' | transloco }}
 *   [label]="'comp.input' | transloco"
 */
@Injectable({ providedIn: 'root' })
export class NeuTranslationService {
  private readonly transloco = inject(TranslocoService);
  private readonly urlState = inject(NeuUrlStateService, { optional: true });
  private readonly doc = inject(DOCUMENT);

  private readonly _lang = signal<NeuLang>(this.#loadInitial());

  /** Signal de solo lectura con el idioma activo ('es' | 'en'). */
  readonly lang: Signal<NeuLang> = this._lang.asReadonly();

  constructor() {
    // Aplicar idioma inicial a Transloco y al DOM
    const initial = this._lang();
    this.transloco.setActiveLang(initial);
    this.doc.documentElement.lang = initial;

    // Sincronizar cuando la URL cambia externamente (?lang=en/es)
    if (this.urlState) {
      const urlLang = this.urlState.getParam('lang');
      effect(() => {
        const fromUrl = urlLang() as string | null;
        if (this.#isValid(fromUrl) && fromUrl !== this._lang()) {
          this.#applyLang(fromUrl as NeuLang, false);
        }
      });
    }
  }

  /**
   * Cambia el idioma activo. Actualiza Transloco, URL, localStorage y el DOM.
   */
  setLang(lang: NeuLang): void {
    this.#applyLang(lang, true);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  #applyLang(lang: NeuLang, updateUrl: boolean): void {
    this._lang.set(lang);
    this.transloco.setActiveLang(lang);
    this.doc.documentElement.lang = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    if (updateUrl) {
      this.urlState?.setParam('lang', lang);
    }
  }

  #loadInitial(): NeuLang {
    // 1. Params de la URL en el momento de arranque
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('lang');
      if (this.#isValid(fromUrl)) return fromUrl as NeuLang;
    }
    // 2. LocalStorage
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (this.#isValid(stored)) return stored as NeuLang;
    // 3. Fallback
    return 'es';
  }

  #isValid(lang: string | null): lang is NeuLang {
    return VALID_LANGS.includes(lang as NeuLang);
  }
}
