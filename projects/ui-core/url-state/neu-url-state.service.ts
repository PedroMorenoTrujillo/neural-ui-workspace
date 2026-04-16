import { Injectable, Injector, Signal, computed } from '@angular/core';
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
  /**
   * Signal con el mapa completo de queryParams actual.
   * Se actualiza automáticamente en cada NavigationEnd.
   */
  readonly params: Signal<Params>;

  constructor(
    private readonly injector: Injector,
    private readonly router: Router,
  ) {
    this.params = toSignal(
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
    void this.router.navigate([], {
      queryParams: { [key]: value },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  /**
   * Actualiza múltiples queryParams en una sola navegación.
   *
   * @example
   *   urlState.patchParams({ page: '1', q: 'Angular' });
   */
  patchParams(params: Record<string, string | null>, replaceUrl = true): void {
    void this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  /**
   * Elimina todos los queryParams de la URL de una vez.
   */
  clearParams(replaceUrl = true): void {
    void this.router.navigate([], {
      queryParams: {},
      replaceUrl,
    });
  }
}
