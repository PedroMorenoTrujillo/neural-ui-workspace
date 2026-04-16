import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

/**
 * NeuralUI BlockUI Component
 *
 * Superposición que bloquea la interacción de un contenedor mientras está activa.
 *
 * Uso (componente):
 *   <div style="position:relative">
 *     <neu-block-ui [blocked]="isLoading" message="Cargando..." />
 *     <form>...</form>
 *   </div>
 *
 * Uso (directiva en el contenedor padre):
 *   <div [neuBlockUI]="isLoading">
 *     <form>...</form>
 *   </div>
 */
@Component({
  selector: 'neu-block-ui',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-busy]': 'blocked()',
    '[attr.aria-hidden]': '!blocked()',
    role: 'status',
  },
  template: `
    @if (blocked()) {
      <div class="neu-block-ui__overlay">
        <div class="neu-block-ui__content">
          <span class="neu-block-ui__spinner" aria-hidden="true"></span>
          @if (message()) {
            <span class="neu-block-ui__message">{{ message() }}</span>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './neu-block-ui.component.scss',
})
export class NeuBlockUIComponent {
  /** Activa la superposición / Activates the overlay */
  readonly blocked = input<boolean>(false);

  /** Mensaje opcional bajo el spinner / Optional message below the spinner */
  readonly message = input<string>('');

  /** Variante de opacidad del overlay */
  readonly variant = input<'default' | 'light' | 'dark'>('default');

  readonly hostClasses = computed(() => ({
    'neu-block-ui': true,
    [`neu-block-ui--${this.variant()}`]: true,
  }));
}

/**
 * Directive [neuBlockUI] — Aplica el efecto BlockUI al elemento host.
 *
 * Uso: <div [neuBlockUI]="loading$ | async">...</div>
 */
@Directive({
  selector: '[neuBlockUI]',
  host: { '[class.neu-block-ui__host]': 'true' },
})
export class NeuBlockUIDirective {
  readonly neuBlockUI = input<boolean>(false);

  private readonly _el = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const blocked = this.neuBlockUI();
      this._el.nativeElement.classList.toggle('neu-block-ui__host--blocked', blocked);
    });
  }
}
