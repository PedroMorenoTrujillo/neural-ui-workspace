import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface NeuAccordionItem {
  /** ID único del panel */
  id: string;
  /** Título del encabezado */
  title: string;
  /** Contenido del cuerpo (HTML o texto plano) */
  content: string;
  /** Inicia expandido */
  expanded?: boolean;
  /** Deshabilita este panel */
  disabled?: boolean;
}

/**
 * NeuralUI Accordion Component
 *
 * Paneles expandibles / colapsables con animación suave.
 * Soporta modo múltiple (varios abiertos a la vez) o exclusivo.
 *
 * Uso:
 *   <neu-accordion [items]="items" />
 *   <neu-accordion [items]="items" [multiple]="true" />
 */
@Component({
  selector: 'neu-accordion',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-accordion" [class.neu-accordion--bordered]="bordered()">
      @for (item of items(); track item.id) {
        <div
          class="neu-accordion__item"
          [class.neu-accordion__item--expanded]="isExpanded(item.id)"
          [class.neu-accordion__item--disabled]="item.disabled"
        >
          <button
            class="neu-accordion__header"
            type="button"
            [id]="'neu-acc-btn-' + item.id"
            [attr.aria-expanded]="isExpanded(item.id)"
            [attr.aria-controls]="'neu-acc-panel-' + item.id"
            [disabled]="item.disabled"
            (click)="toggle(item.id)"
          >
            <span class="neu-accordion__title">{{ item.title }}</span>
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
            [id]="'neu-acc-panel-' + item.id"
            role="region"
            [attr.aria-labelledby]="'neu-acc-btn-' + item.id"
          >
            <div class="neu-accordion__body" [innerHTML]="sanitize(item.content)"></div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-accordion.component.scss',
})
export class NeuAccordionComponent {
  private readonly _sanitizer = inject(DomSanitizer);

  /** Lista de paneles */
  items = input<NeuAccordionItem[]>([]);

  /** Permite varios paneles abiertos a la vez */
  multiple = input<boolean>(false);

  /** Borde exterior alrededor del accordion */
  bordered = input<boolean>(true);

  /** Emite el id del panel al abrirse/cerrarse */
  panelToggle = output<{ id: string; expanded: boolean }>();

  /**
   * Set de IDs actualmente expandidos.
   * Se inicializa desde los ítems con `expanded: true`.
   * Usa linkedSignal para inicializar el estado y mantenerlo mutable.
   */
  private readonly _expanded = linkedSignal<NeuAccordionItem[], Set<string>>({
    source: this.items,
    computation: (items, previous) =>
      previous === undefined
        ? new Set(items.filter((i) => i.expanded).map((i) => i.id))
        : previous.value,
  });

  readonly isExpanded = (id: string) => this._expanded().has(id);

  sanitize(html: string): SafeHtml {
    return this._sanitizer.sanitize(1 /* HTML */, html) ?? '';
  }

  toggle(id: string): void {
    const current = new Set(this._expanded());
    const willExpand = !current.has(id);

    if (!this.multiple()) {
      current.clear();
    }

    if (willExpand) {
      current.add(id);
    } else {
      current.delete(id);
    }

    this._expanded.set(current);
    this.panelToggle.emit({ id, expanded: willExpand });
  }
}
