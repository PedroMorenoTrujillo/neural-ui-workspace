import { ChangeDetectionStrategy, Component, Directive, TemplateRef, ViewEncapsulation, contentChild, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
  neuOptionValuesEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';

export interface NeuTransferItem {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
}
@Directive({ selector: 'ng-template[neuPickListItem]' })
export class NeuPickListItemDirective<T = NeuTransferItem> { constructor(readonly templateRef: TemplateRef<{ $implicit: T; selected: boolean; location: 'source' | 'target' }>) {} }
@Directive({ selector: 'ng-template[neuOrderListItem]' })
export class NeuOrderListItemDirective<T = NeuTransferItem> { constructor(readonly templateRef: TemplateRef<{ $implicit: T; index: number }>) {} }

@Component({
  selector: 'neu-pick-list',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-pick-list' },
  template: `
    <section class="neu-pick-list__column" [attr.aria-label]="sourceHeader()">
      <h3>{{ sourceHeader() }}</h3>
      @for (item of source(); track optionValueOf(item)) {
        <button type="button" [class.is-selected]="isSourceSelected(item)" [disabled]="isOptionDisabled(item)" [attr.aria-pressed]="isSourceSelected(item)" (click)="toggleSource(optionValueOf(item))">
          @if (itemTpl()) { <ng-container [ngTemplateOutlet]="itemTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: item, selected: isSourceSelected(item), location: 'source' }" /> } @else { {{ optionLabelOf(item) }} }
        </button>
      }
    </section>
    <div class="neu-pick-list__actions">
      <button type="button" aria-label="Move selected items to target" (click)="moveToTarget()" [disabled]="!hasMovableSourceSelection()">›</button>
      <button type="button" aria-label="Move selected items to source" (click)="moveToSource()" [disabled]="!hasMovableTargetSelection()">‹</button>
    </div>
    <section class="neu-pick-list__column" [attr.aria-label]="targetHeader()">
      <h3>{{ targetHeader() }}</h3>
      @for (item of target(); track optionValueOf(item)) {
        <button type="button" [class.is-selected]="isTargetSelected(item)" [disabled]="isOptionDisabled(item)" [attr.aria-pressed]="isTargetSelected(item)" (click)="toggleTarget(optionValueOf(item))">
          @if (itemTpl()) { <ng-container [ngTemplateOutlet]="itemTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: item, selected: isTargetSelected(item), location: 'target' }" /> } @else { {{ optionLabelOf(item) }} }
        </button>
      }
    </section>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuPickListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  readonly itemTpl = contentChild(NeuPickListItemDirective<T>);
  readonly source = input<readonly T[]>([]);
  readonly target = input<readonly T[]>([]);
  /** Property or function used to obtain the visible item label. */
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  /** Property or function used to obtain item identity. Defaults to the legacy value or full T. */
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  /** Property or function used to determine whether an item is disabled. */
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly sourceHeader = input('Available');
  readonly targetHeader = input('Selected');
  readonly sourceChange = output<T[]>();
  readonly targetChange = output<T[]>();
  readonly itemsChange = output<{ source: T[]; target: T[] }>();
  readonly sourceSelection = signal(new Set<V>());
  readonly targetSelection = signal(new Set<V>());

  toggleSource(value: V): void {
    if (this.isValueDisabled(this.source(), value)) return;
    this.sourceSelection.set(this.toggleSet(this.sourceSelection(), value));
  }

  toggleTarget(value: V): void {
    if (this.isValueDisabled(this.target(), value)) return;
    this.targetSelection.set(this.toggleSet(this.targetSelection(), value));
  }

  moveToTarget(): void {
    const selected = this.sourceSelection();
    const moved = this.source().filter((item) => this.isSelectedValue(selected, item) && !this.isOptionDisabled(item));
    if (!moved.length) return;
    this.commit(
      this.source().filter((item) => !this.isSelectedValue(selected, item) || this.isOptionDisabled(item)),
      [...this.target(), ...moved],
    );
    this.sourceSelection.set(new Set());
  }

  moveToSource(): void {
    const selected = this.targetSelection();
    const moved = this.target().filter((item) => this.isSelectedValue(selected, item) && !this.isOptionDisabled(item));
    if (!moved.length) return;
    this.commit(
      [...this.source(), ...moved],
      this.target().filter((item) => !this.isSelectedValue(selected, item) || this.isOptionDisabled(item)),
    );
    this.targetSelection.set(new Set());
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  isSourceSelected(option: T): boolean {
    return this.isSelectedValue(this.sourceSelection(), option);
  }

  isTargetSelected(option: T): boolean {
    return this.isSelectedValue(this.targetSelection(), option);
  }

  hasMovableSourceSelection(): boolean {
    return this.source().some((item) => this.isSourceSelected(item) && !this.isOptionDisabled(item));
  }

  hasMovableTargetSelection(): boolean {
    return this.target().some((item) => this.isTargetSelected(item) && !this.isOptionDisabled(item));
  }

  private commit(source: T[], target: T[]): void {
    this.sourceChange.emit(source);
    this.targetChange.emit(target);
    this.itemsChange.emit({ source, target });
  }

  private toggleSet(source: Set<V>, value: V): Set<V> {
    const next = new Set(source);
    const existing = [...next].findIndex((current) => neuOptionValuesEqual(current, value));
    existing >= 0 ? next.delete([...next][existing]!) : next.add(value);
    return next;
  }

  private isSelectedValue(selection: Set<V>, option: T): boolean {
    const value = this.optionValueOf(option);
    if (typeof value === 'number' && value === 0) {
      return [...selection].some((selected) => neuOptionValuesEqual(selected, value));
    }
    return selection.has(value);
  }

  private isValueDisabled(options: readonly T[], value: V): boolean {
    const option = options.find((candidate) => neuOptionValuesEqual(this.optionValueOf(candidate), value));
    return option === undefined || this.isOptionDisabled(option);
  }
}

@Component({
  selector: 'neu-order-list',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-order-list' },
  template: `
    <div class="neu-order-list__items" role="list" aria-label="Ordered items">
      @for (item of items(); track optionValueOf(item); let i = $index) {
        <div class="neu-order-list__item" role="listitem">
          @if (itemTpl()) { <ng-container [ngTemplateOutlet]="itemTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: item, index: i }" /> } @else { <span>{{ optionLabelOf(item) }}</span> }
          <button type="button" [attr.aria-label]="'Move ' + optionLabelOf(item) + ' up'" [disabled]="!canMove(i, -1)" (click)="move(i, -1)">↑</button>
          <button type="button" [attr.aria-label]="'Move ' + optionLabelOf(item) + ' down'" [disabled]="!canMove(i, 1)" (click)="move(i, 1)">↓</button>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuOrderListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  readonly itemTpl = contentChild(NeuOrderListItemDirective<T>);
  readonly items = input<readonly T[]>([]);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly orderChange = output<T[]>();

  move(index: number, direction: -1 | 1): void {
    const next = [...this.items()];
    const target = index + direction;
    if (!this.canMove(index, direction)) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    this.orderChange.emit(next);
  }

  canMove(index: number, direction: -1 | 1): boolean {
    const target = index + direction;
    return index >= 0 && target >= 0 && target < this.items().length
      && !this.isOptionDisabled(this.items()[index]!)
      && !this.isOptionDisabled(this.items()[target]!);
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }
}
