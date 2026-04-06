import { effect, inject, Injectable, signal, Signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

export type AdminLang = 'es' | 'en';

const STORAGE_KEY = 'neural-admin-lang';

@Injectable({ providedIn: 'root' })
export class AdminTranslationService {
  private readonly transloco = inject(TranslocoService);
  private readonly doc = inject(DOCUMENT);

  private readonly _lang = signal<AdminLang>(this.#loadInitial());
  readonly lang: Signal<AdminLang> = this._lang.asReadonly();

  constructor() {
    const initial = this._lang();
    this.transloco.setActiveLang(initial);
    this.doc.documentElement.lang = initial;

    effect(() => {
      const lang = this._lang();
      this.transloco.setActiveLang(lang);
      this.doc.documentElement.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* noop */
      }
    });
  }

  setLang(lang: AdminLang): void {
    this._lang.set(lang);
  }

  toggle(): void {
    this.setLang(this._lang() === 'es' ? 'en' : 'es');
  }

  #loadInitial(): AdminLang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en') return stored;
    } catch {
      /* noop */
    }
    return 'es';
  }
}
