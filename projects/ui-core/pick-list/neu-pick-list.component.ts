import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  NeuDragDropGroupDirective,
  NeuDraggableDirective,
  NeuDropZoneDirective,
  type NeuDropEvent,
  neuReorder,
} from '@neural-ui/core/drag-drop';
import { filterNeuOptions } from '@neural-ui/core/internal';
import {
  type NeuOptionDisabledAccessor,
  type NeuOptionFilterConfig,
  type NeuOptionLabelAccessor,
  type NeuOptionValue,
  type NeuOptionValueAccessor,
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

export type NeuListLocation = 'source' | 'target';
export type NeuListMove = 'up' | 'down' | 'top' | 'bottom';
export type NeuPickListMoveAllScope = 'filtered' | 'all';
type NeuPickAction = 'to-target' | 'to-source' | 'all-to-target' | 'all-to-source';

const NEU_LIST_MOVES: readonly NeuListMove[] = ['top', 'up', 'down', 'bottom'];
const NEU_PICK_ACTIONS: readonly NeuPickAction[] = [
  'to-target',
  'to-source',
  'all-to-target',
  'all-to-source',
];

export interface NeuPickListDropEvent<T> {
  readonly item: T;
  readonly from: NeuListLocation;
  readonly to: NeuListLocation;
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly interaction: 'pointer' | 'keyboard';
  readonly originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null;
}

interface NeuPickListDragData<T> {
  readonly item: T;
  readonly location: NeuListLocation;
  readonly index: number;
}

@Directive({ selector: 'ng-template[neuPickListItem]' })
export class NeuPickListItemDirective<T = NeuTransferItem> {
  constructor(
    readonly templateRef: TemplateRef<{
      $implicit: T;
      selected: boolean;
      location: NeuListLocation;
    }>,
  ) {}
}

@Directive({ selector: 'ng-template[neuOrderListItem]' })
export class NeuOrderListItemDirective<T = NeuTransferItem> {
  constructor(
    readonly templateRef: TemplateRef<{ $implicit: T; index: number; selected: boolean }>,
  ) {}
}

@Component({
  selector: 'neu-pick-list',
  imports: [
    NgTemplateOutlet,
    NeuDragDropGroupDirective,
    NeuDraggableDirective,
    NeuDropZoneDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-pick-list' },
  template: `
    <div neuDragDropGroup [neuDragDropGroupDisabled]="!dragDrop()" class="neu-pick-list__layout">
      <ng-template #listColumn let-location>
        <section class="neu-pick-list__column" [attr.aria-label]="columnHeader(location)">
          <h3>{{ columnHeader(location) }}</h3>
          @if (filter()) {
            <input
              class="neu-pick-list__filter"
              type="search"
              [attr.aria-label]="columnFilterLabel(location)"
              [value]="columnFilterValue(location)"
              [placeholder]="filterPlaceholder()"
              (input)="setFilter(location, $event)"
            />
          }
          <div
            class="neu-pick-list__list"
            role="listbox"
            aria-multiselectable="true"
            [neuDropZone]="location"
            neuDropScope="neu-pick-list"
            [neuDropZoneDisabled]="!dragDrop()"
            [neuDropAriaLabel]="'Drop into ' + columnHeader(location)"
            neuDropRole="listbox"
            (drop)="onDrop($event, location)"
          >
            @for (item of columnItems(location); track optionValueOf(item)) {
              <button
                type="button"
                role="option"
                [neuDraggable]="dragData(item, location)"
                neuDragScope="neu-pick-list"
                [neuDraggableDisabled]="isOptionDisabled(item)"
                [neuDragPointer]="dragDrop()"
                [neuDragKeyboard]="dragDrop()"
                neuDragRole="option"
                [neuDragAriaLabel]="'Move ' + optionLabelOf(item)"
                [class.is-selected]="isLocationSelected(item, location)"
                [disabled]="isOptionDisabled(item)"
                [attr.aria-selected]="isLocationSelected(item, location)"
                (click)="toggleLocationFromTemplate(location, optionValueOf(item))"
              >
                @if (itemTpl()) {
                  <ng-container
                    [ngTemplateOutlet]="itemTpl()!.templateRef"
                    [ngTemplateOutletContext]="{
                      $implicit: item,
                      selected: isLocationSelected(item, location),
                      location,
                    }"
                  />
                } @else {
                  {{ optionLabelOf(item) }}
                }
              </button>
            } @empty {
              <div class="neu-pick-list__empty" role="status">{{ emptyFilterLabel() }}</div>
            }
          </div>
          <ng-container
            [ngTemplateOutlet]="reorderToolbar"
            [ngTemplateOutletContext]="{ $implicit: location }"
          />
        </section>
      </ng-template>

      <ng-container
        [ngTemplateOutlet]="listColumn"
        [ngTemplateOutletContext]="{ $implicit: 'source' }"
      />

      <div class="neu-pick-list__actions">
        @for (action of pickActions; track action) {
          <button
            type="button"
            [attr.aria-label]="pickActionLabel(action)"
            [disabled]="!pickActionEnabled(action)"
            (click)="runPickAction(action)"
          >
            {{ pickActionIcon(action) }}
          </button>
        }
      </div>

      <ng-container
        [ngTemplateOutlet]="listColumn"
        [ngTemplateOutletContext]="{ $implicit: 'target' }"
      />
    </div>

    <ng-template #reorderToolbar let-location>
      <div class="neu-pick-list__toolbar" [attr.aria-label]="reorderToolbarLabel(location)">
        @for (move of listMoves; track move) {
          <button
            type="button"
            [attr.aria-label]="reorderActionLabel(location, move)"
            [disabled]="!hasLocationSelection(location)"
            (click)="reorderSelection(location, move)"
          >
            {{ moveIcon(move) }}
          </button>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuPickListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  protected readonly listMoves = NEU_LIST_MOVES;
  protected readonly pickActions = NEU_PICK_ACTIONS;
  readonly itemTpl = contentChild(NeuPickListItemDirective<T>);
  readonly source = input<readonly T[]>([]);
  readonly target = input<readonly T[]>([]);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly sourceHeader = input('Available');
  readonly targetHeader = input('Selected');
  readonly filter = input(false);
  readonly filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  readonly sourceFilterValue = input<string | null>(null);
  readonly targetFilterValue = input<string | null>(null);
  readonly filterPlaceholder = input('Filter items');
  readonly sourceFilterLabel = input('Filter available items');
  readonly targetFilterLabel = input('Filter selected items');
  readonly emptyFilterLabel = input('No matching items');
  readonly moveAllScope = input<NeuPickListMoveAllScope>('filtered');
  readonly dragDrop = input(false);
  /** Optional logical keys make source selection consumer-authoritative. */
  readonly sourceSelectionKeys = input<readonly V[] | undefined>(undefined);
  /** Optional logical keys make target selection consumer-authoritative. */
  readonly targetSelectionKeys = input<readonly V[] | undefined>(undefined);

  readonly sourceChange = output<T[]>();
  readonly targetChange = output<T[]>();
  readonly sourceSelectionChange = output<T[]>();
  readonly targetSelectionChange = output<T[]>();
  readonly sourceFilterChange = output<string>();
  readonly targetFilterChange = output<string>();
  readonly itemDrop = output<NeuPickListDropEvent<T>>();
  readonly itemsChange = output<{ source: T[]; target: T[] }>();

  private readonly eventDestroyRef = inject(DestroyRef);
  readonly sourceSelection = signal(new Set<V>());
  readonly targetSelection = signal(new Set<V>());
  private readonly sourceFilter = signal('');
  private readonly targetFilter = signal('');
  readonly effectiveSourceFilter = computed(() => this.sourceFilterValue() ?? this.sourceFilter());
  readonly effectiveTargetFilter = computed(() => this.targetFilterValue() ?? this.targetFilter());
  readonly visibleSource = computed(() =>
    filterNeuOptions(
      this.source(),
      this.effectiveSourceFilter(),
      this.filterConfig(),
      this.optionLabel(),
    ),
  );
  readonly visibleTarget = computed(() =>
    filterNeuOptions(
      this.target(),
      this.effectiveTargetFilter(),
      this.filterConfig(),
      this.optionLabel(),
    ),
  );

  protected columnHeader(location: NeuListLocation): string {
    return location === 'source' ? this.sourceHeader() : this.targetHeader();
  }
  protected columnFilterLabel(location: NeuListLocation): string {
    return location === 'source' ? this.sourceFilterLabel() : this.targetFilterLabel();
  }
  protected columnFilterValue(location: NeuListLocation): string {
    return location === 'source' ? this.effectiveSourceFilter() : this.effectiveTargetFilter();
  }
  protected columnItems(location: NeuListLocation): readonly T[] {
    return location === 'source' ? this.visibleSource() : this.visibleTarget();
  }
  protected isLocationSelected(item: T, location: NeuListLocation): boolean {
    return location === 'source' ? this.isSourceSelected(item) : this.isTargetSelected(item);
  }
  protected toggleLocationFromTemplate(location: NeuListLocation, value: V): void {
    this.toggleLocation(location, value);
  }

  toggleSource(value: V): void {
    this.toggleLocation('source', value);
  }
  toggleTarget(value: V): void {
    this.toggleLocation('target', value);
  }
  moveToTarget(): void {
    this.transfer('source', this.selectedSet('source'));
  }
  moveToSource(): void {
    this.transfer('target', this.selectedSet('target'));
  }
  moveAllToTarget(): void {
    this.transfer(
      'source',
      this.valuesOf(this.moveAllScope() === 'filtered' ? this.visibleSource() : this.source()),
    );
  }
  moveAllToSource(): void {
    this.transfer(
      'target',
      this.valuesOf(this.moveAllScope() === 'filtered' ? this.visibleTarget() : this.target()),
    );
  }

  protected hasLocationSelection(location: NeuListLocation): boolean {
    return location === 'source' ? this.hasSourceSelection() : this.hasTargetSelection();
  }
  protected reorderToolbarLabel(location: NeuListLocation): string {
    return `${location === 'source' ? 'Source' : 'Target'} reorder controls`;
  }
  protected reorderActionLabel(location: NeuListLocation, move: NeuListMove): string {
    return `Move ${location} selection ${move === 'top' ? 'to top' : move === 'bottom' ? 'to bottom' : move}`;
  }
  protected moveIcon(move: NeuListMove): string {
    return move === 'top' ? '⇈' : move === 'up' ? '↑' : move === 'down' ? '↓' : '⇊';
  }
  protected pickActionLabel(action: NeuPickAction): string {
    return action === 'to-target'
      ? 'Move selected items to target'
      : action === 'to-source'
        ? 'Move selected items to source'
        : action === 'all-to-target'
          ? 'Move all visible items to target'
          : 'Move all visible items to source';
  }
  protected pickActionIcon(action: NeuPickAction): string {
    return action === 'to-target'
      ? '›'
      : action === 'to-source'
        ? '‹'
        : action === 'all-to-target'
          ? '»'
          : '«';
  }
  protected pickActionEnabled(action: NeuPickAction): boolean {
    return action === 'to-target'
      ? this.hasMovableSourceSelection()
      : action === 'to-source'
        ? this.hasMovableTargetSelection()
        : action === 'all-to-target'
          ? this.hasMovableSourceItems()
          : this.hasMovableTargetItems();
  }
  protected runPickAction(action: NeuPickAction): void {
    if (action === 'to-target') this.moveToTarget();
    else if (action === 'to-source') this.moveToSource();
    else if (action === 'all-to-target') this.moveAllToTarget();
    else this.moveAllToSource();
  }

  setFilter(location: NeuListLocation, event: Event | string): void {
    const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    if (location === 'source') {
      if (this.sourceFilterValue() === null) this.sourceFilter.set(value);
      this.sourceFilterChange.emit(value);
    } else {
      if (this.targetFilterValue() === null) this.targetFilter.set(value);
      this.targetFilterChange.emit(value);
    }
  }

  reorderSelection(location: NeuListLocation, move: NeuListMove): void {
    const items = location === 'source' ? this.source() : this.target();
    const next = this.reorderSelected(items, this.selectedSet(location), move);
    if (next.every((item, index) => item === items[index])) return;
    this.commit(
      location === 'source' ? next : [...this.source()],
      location === 'target' ? next : [...this.target()],
    );
  }

  onDrop(event: NeuDropEvent<unknown, string>, target: NeuListLocation): void {
    const payload = event.data as NeuPickListDragData<T> | null;
    if (
      !payload ||
      (payload.location !== 'source' && payload.location !== 'target') ||
      this.isOptionDisabled(payload.item)
    )
      return;
    const sourceItems = payload.location === 'source' ? this.source() : this.target();
    const targetItems = target === 'source' ? this.source() : this.target();
    const previousIndex = this.indexOf(sourceItems, payload.item);
    if (previousIndex < 0) return;
    let nextSource: T[];
    let nextTarget: T[];
    const currentIndex = Math.min(event.currentIndex ?? targetItems.length, targetItems.length);
    if (payload.location === target) {
      const reordered = [
        ...neuReorder(
          sourceItems,
          previousIndex,
          Math.min(currentIndex, Math.max(0, sourceItems.length - 1)),
        ),
      ];
      nextSource = target === 'source' ? reordered : [...this.source()];
      nextTarget = target === 'target' ? reordered : [...this.target()];
    } else {
      if (this.containsValue(targetItems, this.optionValueOf(payload.item))) return;
      const remaining = [...sourceItems];
      const [item] = remaining.splice(previousIndex, 1);
      const inserted = [...targetItems];
      inserted.splice(currentIndex, 0, item!);
      nextSource = payload.location === 'source' ? remaining : inserted;
      nextTarget = payload.location === 'target' ? remaining : inserted;
    }
    this.commit(nextSource, nextTarget);
    this.itemDrop.emit({
      item: payload.item,
      from: payload.location,
      to: target,
      previousIndex,
      currentIndex,
      interaction: event.interaction,
      originalEvent: event.originalEvent,
    });
  }

  dragData(item: T, location: NeuListLocation): NeuPickListDragData<T> {
    return {
      item,
      location,
      index: this.indexOf(location === 'source' ? this.source() : this.target(), item),
    };
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
    return this.hasValue(this.selectedSet('source'), this.optionValueOf(option));
  }
  isTargetSelected(option: T): boolean {
    return this.hasValue(this.selectedSet('target'), this.optionValueOf(option));
  }
  hasSourceSelection(): boolean {
    return this.selectedSet('source').size > 0;
  }
  hasTargetSelection(): boolean {
    return this.selectedSet('target').size > 0;
  }
  hasMovableSourceSelection(): boolean {
    return this.source().some(
      (item) => this.isSourceSelected(item) && !this.isOptionDisabled(item),
    );
  }
  hasMovableTargetSelection(): boolean {
    return this.target().some(
      (item) => this.isTargetSelected(item) && !this.isOptionDisabled(item),
    );
  }
  hasMovableSourceItems(): boolean {
    return this.allCandidates('source').some(
      (item) =>
        !this.isOptionDisabled(item) &&
        !this.containsValue(this.target(), this.optionValueOf(item)),
    );
  }
  hasMovableTargetItems(): boolean {
    return this.allCandidates('target').some(
      (item) =>
        !this.isOptionDisabled(item) &&
        !this.containsValue(this.source(), this.optionValueOf(item)),
    );
  }

  private toggleLocation(location: NeuListLocation, value: V): void {
    const items = location === 'source' ? this.source() : this.target();
    if (this.eventDestroyRef.destroyed || this.isValueDisabled(items, value)) return;
    const next = this.toggleSet(this.selectedSet(location), value);
    if (location === 'source') {
      if (this.sourceSelectionKeys() === undefined) this.sourceSelection.set(next);
      this.sourceSelectionChange.emit(
        items.filter((item) => this.hasValue(next, this.optionValueOf(item))),
      );
    } else {
      if (this.targetSelectionKeys() === undefined) this.targetSelection.set(next);
      this.targetSelectionChange.emit(
        items.filter((item) => this.hasValue(next, this.optionValueOf(item))),
      );
    }
  }

  private transfer(from: NeuListLocation, selected: Set<V>): void {
    const sourceItems = from === 'source' ? this.source() : this.target();
    const targetItems = from === 'source' ? this.target() : this.source();
    const moved = sourceItems.filter(
      (item) =>
        this.hasValue(selected, this.optionValueOf(item)) &&
        !this.isOptionDisabled(item) &&
        !this.containsValue(targetItems, this.optionValueOf(item)),
    );
    const eligibleSelection = sourceItems.some(
      (item) => this.hasValue(selected, this.optionValueOf(item)) && !this.isOptionDisabled(item),
    );
    if (!eligibleSelection) return;
    if (moved.length) {
      const remaining = sourceItems.filter((item) => !moved.includes(item));
      this.commit(
        from === 'source' ? remaining : [...targetItems, ...moved],
        from === 'target' ? remaining : [...targetItems, ...moved],
      );
    }
    if (from === 'source') {
      if (this.sourceSelectionKeys() === undefined) this.sourceSelection.set(new Set());
      this.sourceSelectionChange.emit([]);
    } else {
      if (this.targetSelectionKeys() === undefined) this.targetSelection.set(new Set());
      this.targetSelectionChange.emit([]);
    }
  }

  private reorderSelected(items: readonly T[], selected: Set<V>, move: NeuListMove): T[] {
    const next = [...items];
    const isSelected = (item: T) =>
      this.hasValue(selected, this.optionValueOf(item)) && !this.isOptionDisabled(item);
    if (move === 'up') {
      for (let index = 1; index < next.length; index++)
        if (
          isSelected(next[index]!) &&
          !isSelected(next[index - 1]!) &&
          !this.isOptionDisabled(next[index - 1]!)
        )
          [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
    } else if (move === 'down') {
      for (let index = next.length - 2; index >= 0; index--)
        if (
          isSelected(next[index]!) &&
          !isSelected(next[index + 1]!) &&
          !this.isOptionDisabled(next[index + 1]!)
        )
          [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
    } else {
      let start = 0;
      while (start < next.length) {
        let end = start;
        while (end < next.length && !this.isOptionDisabled(next[end]!)) end++;
        const segment = next.slice(start, end);
        const chosen = segment.filter(isSelected);
        const rest = segment.filter((item) => !isSelected(item));
        next.splice(
          start,
          segment.length,
          ...(move === 'top' ? [...chosen, ...rest] : [...rest, ...chosen]),
        );
        start = end + 1;
      }
    }
    return next;
  }

  private selectedSet(location: NeuListLocation): Set<V> {
    const controlled =
      location === 'source' ? this.sourceSelectionKeys() : this.targetSelectionKeys();
    return controlled === undefined
      ? location === 'source'
        ? this.sourceSelection()
        : this.targetSelection()
      : new Set(controlled);
  }
  private allCandidates(location: NeuListLocation): readonly T[] {
    if (this.moveAllScope() === 'all') return location === 'source' ? this.source() : this.target();
    return location === 'source' ? this.visibleSource() : this.visibleTarget();
  }
  private valuesOf(items: readonly T[]): Set<V> {
    return new Set(items.map((item) => this.optionValueOf(item)));
  }
  private commit(source: T[], target: T[]): void {
    this.sourceChange.emit(source);
    this.targetChange.emit(target);
    this.itemsChange.emit({ source, target });
  }
  private toggleSet(source: Set<V>, value: V): Set<V> {
    const next = new Set(source);
    const existing = [...next].find((current) => neuOptionValuesEqual(current, value));
    existing === undefined ? next.add(value) : next.delete(existing);
    return next;
  }
  private hasValue(values: Set<V>, value: V): boolean {
    return [...values].some((candidate) => neuOptionValuesEqual(candidate, value));
  }
  private containsValue(items: readonly T[], value: V): boolean {
    return items.some((item) => neuOptionValuesEqual(this.optionValueOf(item), value));
  }
  private indexOf(items: readonly T[], item: T): number {
    const value = this.optionValueOf(item);
    return items.findIndex((candidate) =>
      neuOptionValuesEqual(this.optionValueOf(candidate), value),
    );
  }
  private isValueDisabled(options: readonly T[], value: V): boolean {
    const item = options.find((candidate) =>
      neuOptionValuesEqual(this.optionValueOf(candidate), value),
    );
    return !item || this.isOptionDisabled(item);
  }
}

@Component({
  selector: 'neu-order-list',
  imports: [
    NgTemplateOutlet,
    NeuDragDropGroupDirective,
    NeuDraggableDirective,
    NeuDropZoneDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-order-list' },
  template: `
    @if (filter()) {
      <input
        class="neu-order-list__filter"
        type="search"
        [attr.aria-label]="filterLabel()"
        [value]="effectiveFilter()"
        [placeholder]="filterPlaceholder()"
        (input)="setFilter($event)"
      />
    }
    <div neuDragDropGroup [neuDragDropGroupDisabled]="!dragDrop()">
      <div
        class="neu-order-list__items"
        role="group"
        [attr.aria-label]="ariaLabel()"
        [neuDropZone]="'order'"
        neuDropScope="neu-order-list"
        [neuDropZoneDisabled]="!dragDrop()"
        [neuDropAriaLabel]="'Reorder ' + ariaLabel()"
        neuDropRole="group"
        (drop)="onDrop($event)"
      >
        @for (item of visibleItems(); track optionValueOf(item); let index = $index) {
          <div
            class="neu-order-list__item"
            [class.is-selected]="isSelected(item)"
            [neuDraggable]="item"
            neuDragScope="neu-order-list"
            neuDragRole="group"
            [neuDraggableDisabled]="isOptionDisabled(item)"
            [neuDragPointer]="dragDrop()"
            [neuDragKeyboard]="dragDrop()"
            [neuDragAriaLabel]="'Move ' + optionLabelOf(item)"
          >
            <button
              class="neu-order-list__option"
              type="button"
              [attr.aria-pressed]="isSelected(item)"
              [disabled]="isOptionDisabled(item)"
              (click)="toggle(item)"
            >
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="{
                    $implicit: item,
                    index: dataIndex(item),
                    selected: isSelected(item),
                  }"
                />
              } @else {
                <span>{{ optionLabelOf(item) }}</span>
              }
            </button>
            @for (direction of directions; track direction) {
              <button
                type="button"
                [attr.aria-label]="itemMoveLabel(item, direction)"
                [disabled]="!canMove(dataIndex(item), direction)"
                (click)="$event.stopPropagation(); move(dataIndex(item), direction)"
              >
                {{ direction === -1 ? '↑' : '↓' }}
              </button>
            }
          </div>
        } @empty {
          <div class="neu-pick-list__empty" role="status">{{ emptyFilterLabel() }}</div>
        }
      </div>
    </div>
    <div class="neu-order-list__toolbar" aria-label="Reorder selected items">
      @for (move of listMoves; track move) {
        <button
          type="button"
          [attr.aria-label]="orderActionLabel(move)"
          [disabled]="!hasSelection()"
          (click)="moveSelection(move)"
        >
          {{ moveIcon(move) }}
        </button>
      }
    </div>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuOrderListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  protected readonly listMoves = NEU_LIST_MOVES;
  protected readonly directions = [-1, 1] as const;
  readonly itemTpl = contentChild(NeuOrderListItemDirective<T>);
  readonly items = input<readonly T[]>([]);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly selectionKeys = input<readonly V[] | undefined>(undefined);
  readonly filter = input(false);
  readonly filterValue = input<string | null>(null);
  readonly filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  readonly filterPlaceholder = input('Filter items');
  readonly filterLabel = input('Filter ordered items');
  readonly emptyFilterLabel = input('No matching items');
  readonly ariaLabel = input('Ordered items');
  readonly dragDrop = input(false);
  readonly orderChange = output<T[]>();
  readonly selectionChange = output<T[]>();
  readonly filterChange = output<string>();
  readonly itemDrop = output<NeuPickListDropEvent<T>>();
  private readonly internalSelection = signal(new Set<V>());
  private readonly internalFilter = signal('');
  readonly effectiveFilter = computed(() => this.filterValue() ?? this.internalFilter());
  readonly visibleItems = computed(() =>
    filterNeuOptions(this.items(), this.effectiveFilter(), this.filterConfig(), this.optionLabel()),
  );

  protected orderActionLabel(move: NeuListMove): string {
    return `Move selected items ${move === 'top' ? 'to top' : move === 'bottom' ? 'to bottom' : move}`;
  }
  protected itemMoveLabel(item: T, direction: -1 | 1): string {
    return `Move ${this.optionLabelOf(item)} ${direction === -1 ? 'up' : 'down'}`;
  }
  protected moveIcon(move: NeuListMove): string {
    return move === 'top' ? '⇈' : move === 'up' ? '↑' : move === 'down' ? '↓' : '⇊';
  }

  move(index: number, direction: -1 | 1): void {
    if (!this.canMove(index, direction)) return;
    this.orderChange.emit([...neuReorder(this.items(), index, index + direction)]);
  }
  canMove(index: number, direction: -1 | 1): boolean {
    const target = index + direction;
    return (
      index >= 0 &&
      target >= 0 &&
      target < this.items().length &&
      !this.isOptionDisabled(this.items()[index]!) &&
      !this.isOptionDisabled(this.items()[target]!)
    );
  }
  toggle(item: T): void {
    if (this.isOptionDisabled(item)) return;
    const next = new Set(this.selectedSet());
    const value = this.optionValueOf(item);
    const existing = [...next].find((key) => neuOptionValuesEqual(key, value));
    existing === undefined ? next.add(value) : next.delete(existing);
    if (this.selectionKeys() === undefined) this.internalSelection.set(next);
    this.selectionChange.emit(
      this.items().filter((candidate) => this.hasValue(next, this.optionValueOf(candidate))),
    );
  }
  moveSelection(move: NeuListMove): void {
    const helper = new NeuPickListReorderHelper<T, V>(
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    const next = helper.move(this.items(), this.selectedSet(), move);
    if (!next.every((item, index) => item === this.items()[index])) this.orderChange.emit(next);
  }
  setFilter(event: Event | string): void {
    const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    if (this.filterValue() === null) this.internalFilter.set(value);
    this.filterChange.emit(value);
  }
  onDrop(event: NeuDropEvent<unknown, string>): void {
    const item = event.data as T;
    const previousIndex = this.dataIndex(item);
    if (previousIndex < 0 || this.isOptionDisabled(item)) return;
    const currentIndex = Math.min(
      event.currentIndex ?? this.items().length - 1,
      this.items().length - 1,
    );
    const next = [...neuReorder(this.items(), previousIndex, currentIndex)];
    this.orderChange.emit(next);
    this.itemDrop.emit({
      item,
      from: 'source',
      to: 'source',
      previousIndex,
      currentIndex,
      interaction: event.interaction,
      originalEvent: event.originalEvent,
    });
  }
  hasSelection(): boolean {
    return this.selectedSet().size > 0;
  }
  isSelected(item: T): boolean {
    return this.hasValue(this.selectedSet(), this.optionValueOf(item));
  }
  dataIndex(item: T): number {
    const value = this.optionValueOf(item);
    return this.items().findIndex((candidate) =>
      neuOptionValuesEqual(this.optionValueOf(candidate), value),
    );
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
  private selectedSet(): Set<V> {
    return this.selectionKeys() === undefined
      ? this.internalSelection()
      : new Set(this.selectionKeys());
  }
  private hasValue(values: Set<V>, value: V): boolean {
    return [...values].some((candidate) => neuOptionValuesEqual(candidate, value));
  }
}

class NeuPickListReorderHelper<T, V> {
  constructor(
    private readonly valueOf: (item: T) => V,
    private readonly disabled: (item: T) => boolean,
  ) {}
  move(items: readonly T[], selected: Set<V>, move: NeuListMove): T[] {
    const next = [...items];
    const chosen = (item: T) =>
      !this.disabled(item) &&
      [...selected].some((value) => neuOptionValuesEqual(value, this.valueOf(item)));
    if (move === 'up') {
      for (let index = 1; index < next.length; index++)
        if (chosen(next[index]!) && !chosen(next[index - 1]!) && !this.disabled(next[index - 1]!))
          [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
    } else if (move === 'down') {
      for (let index = next.length - 2; index >= 0; index--)
        if (chosen(next[index]!) && !chosen(next[index + 1]!) && !this.disabled(next[index + 1]!))
          [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
    } else {
      let start = 0;
      while (start < next.length) {
        let end = start;
        while (end < next.length && !this.disabled(next[end]!)) end++;
        const segment = next.slice(start, end);
        const selectedItems = segment.filter(chosen);
        const rest = segment.filter((item) => !chosen(item));
        next.splice(
          start,
          segment.length,
          ...(move === 'top' ? [...selectedItems, ...rest] : [...rest, ...selectedItems]),
        );
        start = end + 1;
      }
    }
    return next;
  }
}
