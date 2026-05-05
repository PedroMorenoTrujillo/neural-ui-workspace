import { Injectable, Injector, Signal, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

/**
 * NeuUrlStateService — El Sistema Nervioso de NeuralUI
 *
 * Sincroniza el estado de la UI con los QueryParams de la URL.
 * Completamente reactivo via Angular Signals.
 *
 * Uso:
 *   const urlState = inject(NeuUrlStateService);
 *   const page = urlState.getParam('page');  // Signal<string | null>
 *   urlState.setParam('menu', 'open');        // Actualiza ?menu=open
 *   urlState.patchParams({ page: '2', q: 'filter' }); // Actualiza múltiples
 */
@Injectable({ providedIn: 'root' })
export class NeuUrlStateService {
  private _pendingParams: Record<string, string | null> = {};
  private _pendingReplaceUrl = true;
  private _batchScheduled = false;
  private readonly _pendingParamsState = signal<Record<string, string | null>>({});
  private readonly _routerParams: Signal<Params>;

  /**
   * Signal con el mapa completo de queryParams actual.
   * Se actualiza automáticamente en cada NavigationEnd.
   */
  readonly params: Signal<Params>;

  constructor(
    private readonly injector: Injector,
    private readonly router: Router,
  ) {
    this._routerParams = toSignal(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(null as null),
        map(() => this.router.parseUrl(this.router.url).queryParams as Params),
      ),
      {
        initialValue: this.router.parseUrl(this.router.url).queryParams as Params,
        injector: this.injector,
      },
    );

    this.params = computed(() => {
      const currentParams = this._routerParams();
      const pendingParams = this._pendingParamsState();
      if (Object.keys(pendingParams).length === 0) {
        return currentParams;
      }

      const mergedParams: Params = { ...currentParams };
      for (const [key, value] of Object.entries(pendingParams)) {
        if (value === null) {
          delete mergedParams[key];
          continue;
        }
        mergedParams[key] = value;
      }

      return mergedParams;
    });
  }

  /**
   * Devuelve un Signal reactivo con el valor del parámetro indicado.
   * Memorizar el resultado: no llamar en bucle pues crea un computed nuevo c/vez.
   *
   * @example
   *   readonly menuOpen = computed(() => this.urlState.getParam('menu')() === 'open');
   */
  getParam(key: string): Signal<string | null> {
    return computed(() => (this.params()[key] as string | undefined) ?? null);
  }

  /**
   * Establece un único queryParam en la URL.
   *
   * @param key       Nombre del parámetro
   * @param value     Valor. Pasar `null` para eliminarlo de la URL.
   * @param replaceUrl Si true (default) usa replaceState — no ensucia el historial.
   *                   Pasar false para acciones que el usuario debe poder deshacer con Atrás.
   */
  setParam(key: string, value: string | null, replaceUrl = true): void {
    this._pendingParams[key] = value;
    this._pendingParamsState.set({ ...this._pendingParams });
    this._pendingReplaceUrl = this._pendingReplaceUrl && replaceUrl;
    this._schedulePendingNavigation();
  }

  private _schedulePendingNavigation(): void {
    if (this._batchScheduled) {
      return;
    }

    this._batchScheduled = true;
    queueMicrotask(() => {
      const pending = this._consumePendingNavigation();
      if (!pending) {
        return;
      }

      void this.router
        .navigate([], {
          queryParams: pending.params,
          queryParamsHandling: 'merge',
          replaceUrl: pending.replaceUrl,
        })
        .finally(() => this._finalizePendingNavigation(pending.params));
    });
  }

  private _consumePendingNavigation(): {
    params: Record<string, string | null>;
    replaceUrl: boolean;
  } | null {
    const hasPendingParams = Object.keys(this._pendingParams).length > 0;
    const replaceUrl = this._pendingReplaceUrl;
    const params = { ...this._pendingParams };

    this._pendingParams = {};
    this._pendingParamsState.set({});
    this._pendingReplaceUrl = true;
    this._batchScheduled = false;

    if (!hasPendingParams) {
      return null;
    }

    return { params, replaceUrl };
  }

  private _resetPendingNavigation(): void {
    this._pendingParams = {};
    this._pendingParamsState.set({});
    this._pendingReplaceUrl = true;
    this._batchScheduled = false;
  }

  private _finalizePendingNavigation(flushedParams: Record<string, string | null>): void {
    const currentVisiblePending = { ...this._pendingParamsState() };
    let changed = false;

    for (const [key, value] of Object.entries(flushedParams)) {
      if (Object.prototype.hasOwnProperty.call(this._pendingParams, key)) {
        continue;
      }

      if (currentVisiblePending[key] === value) {
        delete currentVisiblePending[key];
        changed = true;
      }
    }

    if (changed) {
      this._pendingParamsState.set(currentVisiblePending);
    }
  }

  /**
   * Actualiza múltiples queryParams en una sola navegación.
   *
   * @example
   *   urlState.patchParams({ page: '1', q: 'Angular' });
   */
  patchParams(params: Record<string, string | null>, replaceUrl = true): void {
    const pending = this._consumePendingNavigation();
    const mergedParams = pending ? { ...pending.params, ...params } : params;
    this._pendingParamsState.set({ ...this._pendingParamsState(), ...mergedParams });
    void this.router
      .navigate([], {
        queryParams: mergedParams,
        queryParamsHandling: 'merge',
        replaceUrl: pending ? pending.replaceUrl && replaceUrl : replaceUrl,
      })
      .finally(() => this._finalizePendingNavigation(mergedParams));
  }

  /**
   * Elimina todos los queryParams de la URL de una vez.
   */
  clearParams(replaceUrl = true): void {
    this._resetPendingNavigation();
    void this.router.navigate([], {
      queryParams: {},
      replaceUrl,
    });
  }
}
