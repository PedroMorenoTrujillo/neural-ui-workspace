import {
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  output,
  SecurityContext,
  signal,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuAccordionKey = string | number;

export interface NeuAccordionItem<K extends NeuAccordionKey = string> {
  /** ID único del panel / Unique panel ID */
  readonly id: K;
  /** Título del encabezado / Header title */
  readonly title: string;
  /** Contenido HTML saneado opcional / Optional sanitized HTML content */
  readonly content?: string;
  /** Deshabilita este panel / Disables this panel */
  readonly disabled?: boolean;
}

export interface NeuAccordionHeaderContext<
  T extends NeuAccordionItem<NeuAccordionKey> = NeuAccordionItem<NeuAccordionKey>,
> {
  readonly $implicit: T;
  readonly expanded: boolean;
}

@Directive({ selector: 'ng-template[neuAccordionHeader]' })
export class NeuAccordionHeaderDirective<
  T extends NeuAccordionItem<NeuAccordionKey> = NeuAccordionItem<NeuAccordionKey>,
> {
  constructor(readonly templateRef: TemplateRef<NeuAccordionHeaderContext<T>>) {}

  static ngTemplateContextGuard<T extends NeuAccordionItem<NeuAccordionKey>>(
    _directive: NeuAccordionHeaderDirective<T>,
    context: unknown,
  ): context is NeuAccordionHeaderContext<T> {
    return true;
  }
}

export interface NeuAccordionBodyContext<
  T extends NeuAccordionItem<NeuAccordionKey> = NeuAccordionItem<NeuAccordionKey>,
> {
  readonly $implicit: T;
  readonly expanded: boolean;
}

@Directive({ selector: 'ng-template[neuAccordionBody]' })
export class NeuAccordionBodyDirective<
  T extends NeuAccordionItem<NeuAccordionKey> = NeuAccordionItem<NeuAccordionKey>,
> {
  constructor(readonly templateRef: TemplateRef<NeuAccordionBodyContext<T>>) {}

  static ngTemplateContextGuard<T extends NeuAccordionItem<NeuAccordionKey>>(
    _directive: NeuAccordionBodyDirective<T>,
    context: unknown,
  ): context is NeuAccordionBodyContext<T> {
    return true;
  }
}

export interface NeuAccordionPanelToggle<K extends NeuAccordionKey = string> {
  readonly id: K;
  readonly expanded: boolean;
}

const NEGATIVE_ZERO_KEY = Symbol('neu-accordion-negative-zero');

function keyToken(key: NeuAccordionKey): NeuAccordionKey | symbol {
  return typeof key === 'number' && Object.is(key, -0) ? NEGATIVE_ZERO_KEY : key;
}

/**
 * NeuralUI Accordion Component
 *
 * Paneles expandibles / colapsables con animación suave.
 * Soporta modo múltiple (varios abiertos a la vez) o exclusivo. / Supports multiple (several open at once) or exclusive mode.
 *
 * Uso:
 *   <neu-accordion [items]="items" />
 *   <neu-accordion [items]="items" [multiple]="true" />
 */
@Component({
  selector: 'neu-accordion',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="neu-accordion" [class.neu-accordion--bordered]="bordered()">
      @for (item of items(); track trackKey(item.id); let index = $index) {
        <div
          class="neu-accordion__item"
          [class.neu-accordion__item--expanded]="isExpanded(item.id)"
          [class.neu-accordion__item--disabled]="item.disabled"
        >
          <button
            #headerButton
            class="neu-accordion__header"
            type="button"
            [id]="headerId(item.id)"
            [attr.aria-expanded]="isExpanded(item.id)"
            [attr.aria-controls]="panelId(item.id)"
            [disabled]="item.disabled"
            (click)="toggle(item.id)"
            (keydown)="onHeaderKeydown(index, $event)"
          >
            @if (headerTpl()) {
              <ng-container
                [ngTemplateOutlet]="headerTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: item, expanded: isExpanded(item.id) }"
              />
            } @else {
              <span class="neu-accordion__title">{{ item.title }}</span>
            }
            <span class="neu-accordion__chevron" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div
            class="neu-accordion__panel"
            [id]="panelId(item.id)"
            role="region"
            [attr.aria-labelledby]="headerId(item.id)"
            [attr.aria-hidden]="!isExpanded(item.id)"
            [attr.inert]="!isExpanded(item.id) ? '' : null"
          >
            <div class="neu-accordion__body">
              @if (bodyTpl()) {
                <ng-container
                  [ngTemplateOutlet]="bodyTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: item, expanded: isExpanded(item.id) }"
                />
              } @else {
                <div class="neu-accordion__html" [innerHTML]="sanitize(item.content ?? '')"></div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-accordion.component.scss',
})
export class NeuAccordionComponent<
  K extends NeuAccordionKey = string,
  T extends NeuAccordionItem<K> = NeuAccordionItem<K>,
> {
  /* v8 ignore start -- Angular signal-query factory; projected-template behavior is covered. */
  readonly headerTpl = contentChild(NeuAccordionHeaderDirective<T>);
  protected readonly bodyTpl = contentChild(NeuAccordionBodyDirective<T>);
  private readonly headerButtons = viewChildren<ElementRef<HTMLButtonElement>>('headerButton');
  /* v8 ignore stop */
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _uid = inject(NeuIdGenerator).getId('neu-accordion-');

  /** Lista de paneles / Panel list */
  readonly items = input<readonly T[]>([]);

  /** Permite varios paneles abiertos a la vez / Allows multiple panels open at once */
  readonly multiple = input(false);

  /** Borde exterior alrededor del accordion / Outer border around the accordion */
  readonly bordered = input(true);

  /** Applied controlled state. Undefined selects uncontrolled mode for this instance. */
  readonly expandedKeys = input<readonly K[] | undefined>(undefined);

  /** One-time seed used only when `expandedKeys` is not bound. */
  readonly initialExpandedKeys = input<readonly K[]>([]);

  /** Emite el id del panel al abrirse/cerrarse / Emits the panel id on open/close */
  readonly expandedKeysChange = output<readonly K[]>();

  /** User-toggle detail; aggregate state is carried exclusively by expandedKeysChange. */
  readonly panelToggle = output<NeuAccordionPanelToggle<K>>();

  /** Expansion mode is fixed on first evaluation; uncontrolled state is UI-ephemeral only. */
  private controlMode: 'controlled' | 'uncontrolled' | null = null;
  private modeWarningEmitted = false;
  private uncontrolledKeys: readonly K[] = [];
  private readonly uncontrolledRevision = signal(0);
  private readonly expandedTokens = computed(() => {
    this.uncontrolledRevision();
    return new Set(this.appliedExpandedKeys().map((key) => keyToken(key)));
  });

  readonly isExpanded = (id: K) => this.expandedTokens().has(keyToken(id));
  protected readonly trackKey = (id: K) => keyToken(id);
  protected readonly headerId = (id: K) => `${this._uid}-button-${this.domKey(id)}`;
  protected readonly panelId = (id: K) => `${this._uid}-panel-${this.domKey(id)}`;

  sanitize(html: string): string {
    return this._sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }

  toggle(id: K): void {
    const item = this.items().find((candidate) => Object.is(candidate.id, id));
    if (!item || item.disabled) return;
    const current = [...this.appliedExpandedKeys()];
    const currentIndex = current.findIndex((key) => Object.is(key, id));
    const willExpand = currentIndex < 0;

    if (!this.multiple()) {
      current.length = 0;
    }

    if (willExpand) {
      current.push(id);
    } else if (currentIndex >= 0) {
      current.splice(currentIndex, 1);
    }

    const proposal = Object.freeze([...current]) as readonly K[];
    if (this.ensureControlMode() === 'uncontrolled') {
      this.uncontrolledKeys = proposal;
      this.uncontrolledRevision.update((revision) => revision + 1);
    }
    this.expandedKeysChange.emit(proposal);
    this.panelToggle.emit({ id, expanded: willExpand });
  }

  protected onHeaderKeydown(index: number, event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const enabled = this.items()
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => !item.disabled)
      .map(({ itemIndex }) => itemIndex);
    const current = enabled.indexOf(index);
    let target: number | undefined;
    if (event.key === 'ArrowDown') target = enabled[(current + 1 + enabled.length) % enabled.length];
    else if (event.key === 'ArrowUp')
      target = enabled[(current - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled.at(-1);
    else return;
    if (target === undefined) return;
    event.preventDefault();
    this.headerButtons()[target]?.nativeElement.focus();
  }

  private appliedExpandedKeys(): readonly K[] {
    const mode = this.ensureControlMode();
    return mode === 'controlled' ? (this.expandedKeys() ?? []) : this.uncontrolledKeys;
  }

  private ensureControlMode(): 'controlled' | 'uncontrolled' {
    const requested = this.expandedKeys() === undefined ? 'uncontrolled' : 'controlled';
    if (this.controlMode === null) {
      this.controlMode = requested;
      if (requested === 'uncontrolled') this.uncontrolledKeys = [...this.initialExpandedKeys()];
    } else if (this.controlMode !== requested && !this.modeWarningEmitted) {
      this.modeWarningEmitted = true;
      if (isDevMode())
        console.warn('NeuAccordion cannot switch between controlled and uncontrolled expansion.');
    }
    return this.controlMode;
  }

  private domKey(id: K): string {
    if (typeof id === 'number' && Object.is(id, -0)) return 'number-negative-zero';
    return `${typeof id}-${encodeURIComponent(String(id)).replaceAll('%', '-')}`;
  }
}
