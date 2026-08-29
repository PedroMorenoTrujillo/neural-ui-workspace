import {
  Directive,
  DoCheck,
  ElementRef,
  Injectable,
  Renderer2,
  inject,
  input,
} from '@angular/core';
import type { NeuTableBodyDataRenderEntry, NeuTableRow } from './neu-table.types';

interface NeuTableManagedRowState {
  readonly rowClass: string;
  readonly selected: boolean;
  readonly frozen: boolean;
  readonly contextSelected: boolean;
  readonly dragging: boolean;
  readonly dropPlacement: 'before' | 'after' | null;
  readonly disabled: boolean;
  readonly clickable: boolean;
  readonly tabIndex: number | null;
  readonly navigable: boolean;
  readonly ariaSelected: boolean | null;
  readonly ariaDisabled: boolean | null;
  readonly ariaRowIndex: number | null;
  readonly logicalIndex: number;
  readonly frozenStackKey: string | null;
  readonly top: number | null;
  readonly height: number | null;
  readonly draggable: boolean | null;
}

export interface NeuTableManagedRowAdapter<T extends object> {
  state(entry: NeuTableBodyDataRenderEntry<T>): NeuTableManagedRowState;
  pointerDown(entry: NeuTableBodyDataRenderEntry<T>, event: PointerEvent): void;
  dragStart(entry: NeuTableBodyDataRenderEntry<T>, event: DragEvent): void;
  dragOver(entry: NeuTableBodyDataRenderEntry<T>, event: DragEvent): void;
  drop(entry: NeuTableBodyDataRenderEntry<T>, event: DragEvent): void;
  dragEnd(event: DragEvent): void;
  contextMenu(entry: NeuTableBodyDataRenderEntry<T>, event: MouseEvent): void;
  click(entry: NeuTableBodyDataRenderEntry<T>, event: MouseEvent): void;
  doubleClick(entry: NeuTableBodyDataRenderEntry<T>): void;
  focus(entry: NeuTableBodyDataRenderEntry<T>, event: FocusEvent): void;
  keydown(entry: NeuTableBodyDataRenderEntry<T>, event: KeyboardEvent): void;
}

/** Component-scoped bridge; never provided globally and never exposed as table state. */
@Injectable()
export class NeuTableManagedRowCoordinator {
  private _adapter: NeuTableManagedRowAdapter<object> | null = null;

  connect<T extends object>(adapter: NeuTableManagedRowAdapter<T>): void {
    this._adapter = adapter as unknown as NeuTableManagedRowAdapter<object>;
  }

  adapter<T extends object>(): NeuTableManagedRowAdapter<T> {
    if (!this._adapter) {
      throw new Error('neuTableManagedRow must be declared inside its owning neu-table.');
    }
    return this._adapter as unknown as NeuTableManagedRowAdapter<T>;
  }

  disconnect(): void {
    this._adapter = null;
  }
}

/**
 * Applies NeuTable's canonical primary-row behavior to a consumer-owned `<tr>`.
 * Arbitrary sibling rows intentionally remain consumer-managed.
 */
@Directive({
  selector: 'tr[neuTableManagedRow]',
  host: {
    class: 'neu-table__row',
    '[class.neu-table__row--selected]': 'state().selected',
    '[class.neu-table__row--frozen]': 'state().frozen',
    '[class.neu-table__row--context-selected]': 'state().contextSelected',
    '[class.neu-table__row--dragging]': 'state().dragging',
    '[class.neu-table__row--drop-before]': 'state().dropPlacement === "before"',
    '[class.neu-table__row--drop-after]': 'state().dropPlacement === "after"',
    '[class.neu-table__row--disabled]': 'state().disabled',
    '[class.neu-table__row--clickable]': 'state().clickable',
    '[style.height.px]': 'state().height',
    '[style.top.px]': 'state().top',
    '[attr.tabindex]': 'state().tabIndex',
    '[attr.data-neu-table-managed-row]': '"true"',
    '[attr.data-neu-table-navigable]': 'state().navigable ? "true" : null',
    '[attr.data-neu-table-logical-index]': 'state().logicalIndex',
    '[attr.data-neu-table-frozen]': 'state().frozen ? "true" : null',
    '[attr.data-neu-table-frozen-stack]': 'state().frozenStackKey',
    '[attr.aria-selected]': 'state().ariaSelected',
    '[attr.aria-disabled]': 'state().ariaDisabled',
    '[attr.aria-rowindex]': 'state().ariaRowIndex',
    '[attr.draggable]': 'state().draggable',
    '(pointerdown)': 'pointerDown($event)',
    '(dragstart)': 'dragStart($event)',
    '(dragover)': 'dragOver($event)',
    '(drop)': 'drop($event)',
    '(dragend)': 'dragEnd($event)',
    '(contextmenu)': 'contextMenu($event)',
    '(click)': 'click($event)',
    '(dblclick)': 'doubleClick()',
    '(focus)': 'focus($event)',
    '(keydown)': 'keydown($event)',
  },
})
export class NeuTableManagedRowDirective<T extends object = NeuTableRow> implements DoCheck {
  readonly entry = input.required<NeuTableBodyDataRenderEntry<T>>({ alias: 'neuTableManagedRow' });

  private readonly _coordinator = inject(NeuTableManagedRowCoordinator);
  private readonly _elementRef = inject(ElementRef<HTMLTableRowElement>);
  private readonly _renderer = inject(Renderer2);
  private _configuredClasses = new Set<string>();

  protected state(): NeuTableManagedRowState {
    return this._coordinator.adapter<T>().state(this.entry());
  }

  ngDoCheck(): void {
    const next = new Set(this.state().rowClass.split(/\s+/u).filter(Boolean));
    for (const className of this._configuredClasses) {
      if (!next.has(className))
        this._renderer.removeClass(this._elementRef.nativeElement, className);
    }
    for (const className of next) {
      if (!this._configuredClasses.has(className)) {
        this._renderer.addClass(this._elementRef.nativeElement, className);
      }
    }
    this._configuredClasses = next;
  }

  protected pointerDown(event: PointerEvent): void {
    this._coordinator.adapter<T>().pointerDown(this.entry(), event);
  }

  protected dragStart(event: DragEvent): void {
    this._coordinator.adapter<T>().dragStart(this.entry(), event);
  }

  protected dragOver(event: DragEvent): void {
    this._coordinator.adapter<T>().dragOver(this.entry(), event);
  }

  protected drop(event: DragEvent): void {
    this._coordinator.adapter<T>().drop(this.entry(), event);
  }

  protected dragEnd(event: DragEvent): void {
    this._coordinator.adapter<T>().dragEnd(event);
  }

  protected contextMenu(event: MouseEvent): void {
    this._coordinator.adapter<T>().contextMenu(this.entry(), event);
  }

  protected click(event: MouseEvent): void {
    this._coordinator.adapter<T>().click(this.entry(), event);
  }

  protected doubleClick(): void {
    this._coordinator.adapter<T>().doubleClick(this.entry());
  }

  protected focus(event: FocusEvent): void {
    this._coordinator.adapter<T>().focus(this.entry(), event);
  }

  protected keydown(event: KeyboardEvent): void {
    this._coordinator.adapter<T>().keydown(this.entry(), event);
  }
}
