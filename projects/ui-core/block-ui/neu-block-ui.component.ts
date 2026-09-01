import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  },
  template: `
    @if (blocked()) {
      <div class="neu-block-ui__overlay" role="status" aria-live="polite">
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
  private static readonly ownedInertAttribute = 'data-neu-block-ui-inert';
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

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly siblingInertState = new Map<HTMLElement, boolean>();

  constructor() {
    effect(() => {
      if (this.blocked()) {
        this.blockSiblingInteraction();
      } else {
        this.restoreSiblingInteraction();
      }
    });
    this.destroyRef.onDestroy(() => this.restoreSiblingInteraction());
  }

  private blockSiblingInteraction(): void {
    const parent = this.host.parentElement;
    if (!parent) return;

    for (const sibling of Array.from(parent.children)) {
      if (!(sibling instanceof HTMLElement) || sibling === this.host) continue;
      if (this.siblingInertState.has(sibling)) continue;
      // SSR can serialize the inert state applied by this component. Treat that
      // marker as component-owned during hydration, not as consumer state that
      // must remain after unblocking.
      const wasOwned = sibling.hasAttribute(NeuBlockUIComponent.ownedInertAttribute);
      this.siblingInertState.set(sibling, !wasOwned && sibling.hasAttribute('inert'));
      sibling.setAttribute('inert', '');
      sibling.setAttribute(NeuBlockUIComponent.ownedInertAttribute, '');
    }
  }

  private restoreSiblingInteraction(): void {
    for (const [sibling, wasInert] of this.siblingInertState) {
      if (!wasInert) sibling.removeAttribute('inert');
      sibling.removeAttribute(NeuBlockUIComponent.ownedInertAttribute);
    }
    this.siblingInertState.clear();
  }
}

/**
 * Directive [neuBlockUI] — Aplica el efecto BlockUI al elemento host.
 *
 * Uso: <div [neuBlockUI]="loading$ | async">...</div>
 */
@Directive({
  selector: '[neuBlockUI]',
  host: {
    '[class.neu-block-ui__host]': 'true',
    '[class.neu-block-ui__host--blocked]': 'neuBlockUI()',
    '[attr.aria-busy]': 'neuBlockUI()',
    '[attr.inert]': 'neuBlockUI() ? "" : null',
  },
})
export class NeuBlockUIDirective {
  readonly neuBlockUI = input<boolean>(false);
}
