import { NgTemplateOutlet } from '@angular/common';
import {
  InternalNeuIconOutletComponent,
  neuMoveLeftIconPath, neuMoveRightIconPath, neuMoveUpIconPath, neuMoveDownIconPath,
} from '@neural-ui/core/icon-outlet-internal';
import { neuIconArrowDown as iconArrowDown } from '@neural-ui/core/internal';
import { neuIconArrowLeft as iconArrowLeft } from '@neural-ui/core/internal';
import { neuIconArrowRight as iconArrowRight } from '@neural-ui/core/internal';
import { neuIconArrowUp as iconArrowUp } from '@neural-ui/core/internal';
import { neuIconDrag as iconDrag } from '@neural-ui/core/internal';

import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  type SimpleChanges,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import {
  NeuDragDropGroupDirective,
  NeuDragHandleDirective,
  NeuDraggableDirective,
  NeuDropZoneDirective,
  type NeuDropEvent,
} from '@neural-ui/core/drag-drop';
import {
  findOrderedDuplicate,
  moveSelectedVisible,
  pruneSelectedKeys,
  reorderVisible,
  transferSelected,
  visibleAnchorIndex,
} from './neu-ordered-list.engine';
import { filterNeuOptions } from '@neural-ui/core/internal';
import { NeuButtonComponent } from '@neural-ui/core/button';
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

// Fixed list affordances must not retain the fallback catalog for other controls.
function listIconPath(key: string): string | null {
  switch (key) {
    case iconArrowLeft: return neuMoveLeftIconPath;
    case iconArrowRight: return neuMoveRightIconPath;
    case iconArrowUp: return neuMoveUpIconPath;
    case iconArrowDown: return neuMoveDownIconPath;
    default: return null;
  }
}

function listIconText(key: string): string | null {
  return key === iconDrag ? '⋮⋮' : null;
}

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
const NEU_LIST_LOCATIONS: readonly NeuListLocation[] = ['source', 'target'];
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
  /** Index in the visible source projection; equals the applied index without a filter. */
  readonly previousIndex: number;
  /** Index in the visible destination projection; full-array proposals are authoritative. */
  readonly currentIndex: number;
  readonly interaction: 'pointer' | 'keyboard';
  readonly originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null;
}

export interface NeuPickListItemContext<T> {
  readonly $implicit: T;
  readonly selected: boolean;
  readonly location: NeuListLocation;
}

export interface NeuOrderListItemContext<T> {
  readonly $implicit: T;
  readonly index: number;
  readonly selected: boolean;
}

interface NeuPickListDragData<T> {
  readonly item: T;
  readonly location: NeuListLocation;
  readonly index: number;
}

@Directive({ selector: 'ng-template[neuPickListItem]' })
export class NeuPickListItemDirective<T = NeuTransferItem> {
  /** Vincula la colección de origen para inferir estrictamente el tipo del contexto de la plantilla / Binds the source collection to strictly infer the template context type */
  readonly neuPickListItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuPickListItemContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuPickListItemDirective<T>,
    context: unknown,
  ): context is NeuPickListItemContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuOrderListItem]' })
export class NeuOrderListItemDirective<T = NeuTransferItem> {
  /** Vincula la colección para inferir estrictamente el tipo del contexto de la plantilla / Binds the collection to strictly infer the template context type */
  readonly neuOrderListItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuOrderListItemContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuOrderListItemDirective<T>,
    context: unknown,
  ): context is NeuOrderListItemContext<T> {
    return true;
  }
}

@Component({
  selector: 'neu-pick-list',
  imports: [
    NgTemplateOutlet,
    InternalNeuIconOutletComponent,
    NeuButtonComponent,
    NeuDragDropGroupDirective,
    NeuDragHandleDirective,
    NeuDraggableDirective,
    NeuDropZoneDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-pick-list' },
  template: `
    <div neuDragDropGroup [neuDragDropGroupDisabled]="!dragDrop()" class="neu-pick-list__layout">
      @for (location of listLocations; track location) {
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
            role="list"
            [attr.aria-label]="columnHeader(location)"
            [neuDropZone]="location"
            neuDropScope="neu-pick-list"
            [neuDropZoneDisabled]="!dragDrop()"
            [neuDropAriaLabel]="'Drop into ' + columnHeader(location)"
            neuDropRole="list"
            (drop)="onDrop($event, location)"
          >
            @for (item of columnItems(location); track identityTrackKey(item, $index); let index = $index) {
              <div
                class="neu-pick-list__item"
                [class.neu-pick-list__item--draggable]="dragDrop()"
                [neuDraggable]="dragData(item, location)"
                neuDragScope="neu-pick-list"
                [neuDraggableDisabled]="isOptionDisabled(item)"
                [neuDragPointer]="dragDrop()"
                [neuDragKeyboard]="false"
                [neuDragTabIndex]="-1"
                neuDragRole="listitem"
              >
                <button
                  type="button"
                  class="neu-pick-list__option"
                  [class.is-selected]="isLocationSelected(item, location)"
                  [disabled]="isOptionDisabled(item)"
                  [attr.aria-pressed]="isLocationSelected(item, location)"
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
                @if (dragDrop()) {
                  <span
                    neuDragHandle
                    class="neu-pick-list__drag-handle"
                    aria-hidden="true"
                  ><neu-icon-outlet [icon]="iconDrag" [fallbackPath]="iconFallbackPath(iconDrag)" [fallbackText]="iconFallbackText(iconDrag)" size="1em" aria-hidden="true" /></span>
                }
                @for (direction of directions; track direction) {
                  <button
                    neu-button
                    class="neu-pick-list__item-move"
                    type="button"
                    tone="neutral"
                    variant="ghost"
                    size="sm"
                    [iconOnly]="true"
                    [ariaLabel]="itemMoveLabel(item, direction)"
                    [disabled]="!canMoveItem(location, index, direction)"
                    (click)="$event.stopPropagation(); moveItem(location, index, direction)"
                  >
                    <neu-icon-outlet [icon]="moveIcon(direction === -1 ? 'up' : 'down')" [fallbackPath]="iconFallbackPath(moveIcon(direction === -1 ? 'up' : 'down'))" [fallbackText]="iconFallbackText(moveIcon(direction === -1 ? 'up' : 'down'))" size="1em" aria-hidden="true" />
                  </button>
                }
              </div>
            } @empty {
              <div class="neu-pick-list__empty" role="listitem">{{ emptyFilterLabel() }}</div>
            }
          </div>
        </section>
        @if (location === 'source') {
          <div class="neu-pick-list__actions">
            @for (action of pickActions; track action) {
              <button
                neu-button
                type="button"
                tone="neutral"
                variant="ghost"
                size="sm"
                [iconOnly]="true"
                [ariaLabel]="pickActionLabel(action)"
                [disabled]="!pickActionEnabled(action)"
                (click)="runPickAction(action)"
              >
                <neu-icon-outlet [icon]="pickActionIcon(action)" [fallbackPath]="iconFallbackPath(pickActionIcon(action))" [fallbackText]="iconFallbackText(pickActionIcon(action))" size="1em" aria-hidden="true" />
                @if (action === 'all-to-target' || action === 'all-to-source') {
                  <neu-icon-outlet [icon]="pickActionIcon(action)" [fallbackPath]="iconFallbackPath(pickActionIcon(action))" [fallbackText]="iconFallbackText(pickActionIcon(action))" size="1em" aria-hidden="true" />
                }
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuPickListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  protected readonly iconFallbackPath = listIconPath;
  protected readonly iconFallbackText = listIconText;
  protected readonly iconDrag = iconDrag;
  protected readonly listLocations = NEU_LIST_LOCATIONS;
  protected readonly directions = [-1, 1] as const;
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
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
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
  private readonly duplicate = computed(() =>
    findOrderedDuplicate<T, V>(
      [
        ['source', this.source()],
        ['target', this.target()],
      ],
      (item) => this.optionValueOf(item),
    ),
  );
  private lastDuplicateDiagnostic = '';

  protected ngOnChanges(changes: SimpleChanges): void {
    this.validIdentity();
    if (changes['source'] || changes['optionValue']) {
      const next = pruneSelectedKeys(this.sourceSelection(), this.source(), (item) =>
        this.optionValueOf(item),
      );
      if (next) this.sourceSelection.set(next);
    }
    if (changes['target'] || changes['optionValue']) {
      const next = pruneSelectedKeys(this.targetSelection(), this.target(), (item) =>
        this.optionValueOf(item),
      );
      if (next) this.targetSelection.set(next);
    }
  }

  protected identityTrackKey(item: T, index: number): unknown {
    return this.duplicate() ? index : this.optionValueOf(item);
  }

  private validIdentity(): boolean {
    const duplicate = this.duplicate();
    if (!duplicate) {
      this.lastDuplicateDiagnostic = '';
      return true;
    }
    const signature = `${duplicate.firstList}:${duplicate.firstIndex}:${duplicate.list}:${duplicate.index}:${String(duplicate.key)}`;
    if (isDevMode() && this.lastDuplicateDiagnostic !== signature)
      console.warn(`NeuPickList: duplicate semantic key ${String(duplicate.key)} at ${duplicate.firstList}[${duplicate.firstIndex}] and ${duplicate.list}[${duplicate.index}]; ordered interactions disabled.`);
    this.lastDuplicateDiagnostic = signature;
    return false;
  }

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
    return !this.duplicate() &&
      (location === 'source' ? this.hasSourceSelection() : this.hasTargetSelection());
  }
  protected reorderToolbarLabel(location: NeuListLocation): string {
    return `${location === 'source' ? 'Source' : 'Target'} reorder controls`;
  }
  protected reorderActionLabel(location: NeuListLocation, move: NeuListMove): string {
    return `Move ${location} selection ${move === 'top' ? 'to top' : move === 'bottom' ? 'to bottom' : move}`;
  }
  protected moveIcon(move: NeuListMove) {
    return move === 'top' || move === 'up' ? iconArrowUp : iconArrowDown;
  }
  protected pickActionLabel(action: NeuPickAction): string {
    return action === 'to-target'
      ? 'Move selected items to target'
      : action === 'to-source'
        ? 'Move selected items to source'
        : action === 'all-to-target'
          ? `Move all ${this.moveAllScope() === 'filtered' ? 'visible ' : ''}items to target`
          : `Move all ${this.moveAllScope() === 'filtered' ? 'visible ' : ''}items to source`;
  }
  protected pickActionIcon(action: NeuPickAction) {
    return action === 'to-target' || action === 'all-to-target'
      ? iconArrowRight
      : iconArrowLeft;
  }
  protected pickActionEnabled(action: NeuPickAction): boolean {
    if (this.duplicate()) return false;
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

  protected itemMoveLabel(item: T, direction: -1 | 1): string {
    return `Move ${this.optionLabelOf(item)} ${direction === -1 ? 'up' : 'down'}`;
  }

  protected canMoveItem(location: NeuListLocation, index: number, direction: -1 | 1): boolean {
    if (this.duplicate()) return false;
    const visible = this.columnItems(location);
    const destination = index + direction;
    return index >= 0 && index < visible.length && destination >= 0 && destination < visible.length &&
      !this.isOptionDisabled(visible[index]!) && !this.isOptionDisabled(visible[destination]!);
  }

  protected moveItem(location: NeuListLocation, index: number, direction: -1 | 1): void {
    if (!this.canMoveItem(location, index, direction)) return;
    const visible = this.columnItems(location);
    const items = location === 'source' ? this.source() : this.target();
    const next = reorderVisible(
      items,
      visible,
      this.optionValueOf(visible[index]!),
      index + direction,
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    if (next) this.commit(
      location === 'source' ? next : [...this.source()],
      location === 'target' ? next : [...this.target()],
    );
  }

  reorderSelection(location: NeuListLocation, move: NeuListMove): void {
    if (!this.validIdentity()) return;
    const items = location === 'source' ? this.source() : this.target();
    const visible = location === 'source' ? this.visibleSource() : this.visibleTarget();
    const next = moveSelectedVisible(
      items,
      visible,
      [...this.selectedSet(location)],
      move,
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    if (!next) return;
    this.commit(
      location === 'source' ? next : [...this.source()],
      location === 'target' ? next : [...this.target()],
    );
  }

  onDrop(event: NeuDropEvent<unknown, string>, target: NeuListLocation): void {
    const payload = event.data as NeuPickListDragData<T> | null;
    if (
      !this.validIdentity() ||
      !payload ||
      (payload.location !== 'source' && payload.location !== 'target') ||
      event.currentIndex === undefined ||
      !Number.isInteger(event.currentIndex) ||
      event.currentIndex < 0
    )
      return;
    const sourceItems = payload.location === 'source' ? this.source() : this.target();
    const targetItems = target === 'source' ? this.source() : this.target();
    const sourceVisible = payload.location === 'source' ? this.visibleSource() : this.visibleTarget();
    const targetVisible = target === 'source' ? this.visibleSource() : this.visibleTarget();
    const draggedKey = this.optionValueOf(payload.item);
    const previousIndex = sourceVisible.findIndex((item) =>
      neuOptionValuesEqual(this.optionValueOf(item), draggedKey),
    );
    const appliedIndex = this.indexOf(sourceItems, payload.item);
    if (previousIndex < 0 || appliedIndex < 0 || this.isOptionDisabled(sourceItems[appliedIndex]!))
      return;
    let nextSource: T[];
    let nextTarget: T[];
    const currentIndex = Math.min(
      event.currentIndex,
      payload.location === target ? Math.max(0, targetVisible.length - 1) : targetVisible.length,
    );
    if (payload.location === target) {
      const reordered = reorderVisible(
        sourceItems,
        sourceVisible,
        draggedKey,
        currentIndex,
        (item) => this.optionValueOf(item),
        (item) => this.isOptionDisabled(item),
      );
      if (!reordered) return;
      nextSource = target === 'source' ? reordered : [...this.source()];
      nextTarget = target === 'target' ? reordered : [...this.target()];
    } else {
      const insertionIndex = visibleAnchorIndex(
        targetItems,
        targetVisible,
        currentIndex,
        (item) => this.optionValueOf(item),
      );
      if (insertionIndex === null) return;
      const item = sourceItems[appliedIndex]!;
      const remaining = sourceItems.filter((candidate) =>
        !neuOptionValuesEqual(this.optionValueOf(candidate), draggedKey),
      );
      const inserted = [...targetItems];
      inserted.splice(insertionIndex, 0, item);
      nextSource = payload.location === 'source' ? remaining : inserted;
      nextTarget = payload.location === 'target' ? remaining : inserted;
    }
    const focusedBefore = this.hostElement.nativeElement.ownerDocument.activeElement;
    this.commit(nextSource, nextTarget);
    if (payload.location !== target)
      this.restoreTransferFocus(target, draggedKey, focusedBefore);
    this.itemDrop.emit({
      item: sourceItems[appliedIndex]!,
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
    const selected = this.selectedSet('source');
    return this.source().some((item) => this.hasValue(selected, this.optionValueOf(item)));
  }
  hasTargetSelection(): boolean {
    const selected = this.selectedSet('target');
    return this.target().some((item) => this.hasValue(selected, this.optionValueOf(item)));
  }
  hasMovableSourceSelection(): boolean {
    const selected = this.selectedSet('source');
    return this.source().some(
      (item) => this.hasValue(selected, this.optionValueOf(item)) && !this.isOptionDisabled(item),
    );
  }
  hasMovableTargetSelection(): boolean {
    const selected = this.selectedSet('target');
    return this.target().some(
      (item) => this.hasValue(selected, this.optionValueOf(item)) && !this.isOptionDisabled(item),
    );
  }
  hasMovableSourceItems(): boolean {
    return !this.duplicate() && this.allCandidates('source').some((item) => !this.isOptionDisabled(item));
  }
  hasMovableTargetItems(): boolean {
    return !this.duplicate() && this.allCandidates('target').some((item) => !this.isOptionDisabled(item));
  }

  private toggleLocation(location: NeuListLocation, value: V): void {
    const items = location === 'source' ? this.source() : this.target();
    if (this.eventDestroyRef.destroyed || !this.validIdentity() || this.isValueDisabled(items, value))
      return;
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
    if (!this.validIdentity()) return;
    const sourceItems = from === 'source' ? this.source() : this.target();
    const targetItems = from === 'source' ? this.target() : this.source();
    const proposal = transferSelected(
      sourceItems,
      targetItems,
      [...selected],
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    if (!proposal) return;
    const movedKey = this.optionValueOf(proposal.target[targetItems.length]!);
    const focusedBefore = this.hostElement.nativeElement.ownerDocument.activeElement;
    this.commit(
      from === 'source' ? proposal.source : proposal.target,
      from === 'target' ? proposal.source : proposal.target,
    );
    this.restoreTransferFocus(from === 'source' ? 'target' : 'source', movedKey, focusedBefore);
  }
  private restoreTransferFocus(
    destination: NeuListLocation,
    movedKey: V,
    focusedBefore: Element | null,
  ): void {
    const host = this.hostElement.nativeElement as HTMLElement;
    if (!focusedBefore || !host.contains(focusedBefore)) return;
    afterNextRender(() => {
      if (this.eventDestroyRef.destroyed) return;
      const prior = focusedBefore as HTMLButtonElement;
      if (prior.isConnected && !prior.disabled) return;
      const columns = host.querySelectorAll<HTMLElement>('.neu-pick-list__column');
      const column = columns[destination === 'source' ? 0 : 1];
      if (!column) return;
      const visible = destination === 'source' ? this.visibleSource() : this.visibleTarget();
      const index = visible.findIndex((item) =>
        neuOptionValuesEqual(this.optionValueOf(item), movedKey),
      );
      const options = column.querySelectorAll<HTMLButtonElement>('.neu-pick-list__option');
      const preferred = index < 0 ? null : options[index];
      const fallback = column.querySelector<HTMLElement>(
        '.neu-pick-list__option:not([disabled]), input:not([disabled]), button:not([disabled])',
      );
      (preferred && !preferred.disabled ? preferred : fallback)?.focus({ preventScroll: true });
    }, { injector: this.injector });
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
    InternalNeuIconOutletComponent,
    NeuButtonComponent,
    NeuDragDropGroupDirective,
    NeuDragHandleDirective,
    NeuDraggableDirective,
    NeuDropZoneDirective,
  ],
  encapsulation: ViewEncapsulation.None,
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
        @for (item of visibleItems(); track identityTrackKey(item, $index); let index = $index) {
          <div
            class="neu-order-list__item"
            [class.is-selected]="isSelected(item)"
            [class.neu-order-list__item--draggable]="dragDrop()"
            [neuDraggable]="item"
            neuDragScope="neu-order-list"
            neuDragRole="group"
            [neuDraggableDisabled]="isOptionDisabled(item)"
            [neuDragPointer]="dragDrop()"
            [neuDragKeyboard]="false"
            [neuDragTabIndex]="-1"
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
            @if (dragDrop()) {
              <button
                neu-button
                neuDragHandle
                class="neu-order-list__drag-handle"
                type="button"
                tone="neutral"
                variant="ghost"
                size="sm"
                [iconOnly]="true"
                [ariaLabel]="'Drag ' + optionLabelOf(item)"
                [disabled]="isOptionDisabled(item)"
              ><neu-icon-outlet [icon]="iconDrag" [fallbackPath]="iconFallbackPath(iconDrag)" [fallbackText]="iconFallbackText(iconDrag)" size="1em" aria-hidden="true" /></button>
            }
            @for (direction of directions; track direction) {
              <button
                neu-button
                type="button"
                tone="neutral"
                variant="ghost"
                size="sm"
                [iconOnly]="true"
                [ariaLabel]="itemMoveLabel(item, direction)"
                [disabled]="!canMove(index, direction)"
                (click)="$event.stopPropagation(); move(index, direction)"
              >
                <neu-icon-outlet [icon]="direction === -1 ? iconArrowUp : iconArrowDown" [fallbackPath]="iconFallbackPath(direction === -1 ? iconArrowUp : iconArrowDown)" [fallbackText]="iconFallbackText(direction === -1 ? iconArrowUp : iconArrowDown)" size="1em" aria-hidden="true" />
              </button>
            }
          </div>
        } @empty {
          <div class="neu-pick-list__empty" role="status">{{ emptyFilterLabel() }}</div>
        }
      </div>
    </div>
    @if (hasSelection()) {
      <div class="neu-order-list__toolbar" aria-label="Reorder selected items">
        @for (move of listMoves; track move) {
          <button
            neu-button
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            [iconOnly]="true"
            [ariaLabel]="orderActionLabel(move)"
            (click)="moveSelection(move)"
          >
            <neu-icon-outlet [icon]="moveIcon(move)" [fallbackPath]="iconFallbackPath(moveIcon(move))" [fallbackText]="iconFallbackText(moveIcon(move))" size="1em" aria-hidden="true" />
            @if (move === 'top' || move === 'bottom') {
              <neu-icon-outlet [icon]="moveIcon(move)" [fallbackPath]="iconFallbackPath(moveIcon(move))" [fallbackText]="iconFallbackText(moveIcon(move))" size="1em" aria-hidden="true" />
            }
          </button>
        }
      </div>
    }
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuOrderListComponent<T = NeuTransferItem, V = NeuOptionValue<T>> {
  protected readonly iconFallbackPath = listIconPath;
  protected readonly iconFallbackText = listIconText;
  protected readonly iconArrowUp = iconArrowUp;
  protected readonly iconArrowDown = iconArrowDown;
  protected readonly iconDrag = iconDrag;
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
  private readonly duplicate = computed(() =>
    findOrderedDuplicate<T, V>([['items', this.items()]], (item) => this.optionValueOf(item)),
  );
  private lastDuplicateDiagnostic = '';

  protected ngOnChanges(changes: SimpleChanges): void {
    this.validIdentity();
    if (changes['items'] || changes['optionValue']) {
      const next = pruneSelectedKeys(this.internalSelection(), this.items(), (item) =>
        this.optionValueOf(item),
      );
      if (next) this.internalSelection.set(next);
    }
  }

  protected identityTrackKey(item: T, index: number): unknown {
    return this.duplicate() ? index : this.optionValueOf(item);
  }

  private validIdentity(): boolean {
    const duplicate = this.duplicate();
    if (!duplicate) {
      this.lastDuplicateDiagnostic = '';
      return true;
    }
    const signature = `${duplicate.firstIndex}:${duplicate.index}:${String(duplicate.key)}`;
    if (isDevMode() && this.lastDuplicateDiagnostic !== signature)
      console.warn(`NeuOrderList: duplicate semantic key ${String(duplicate.key)} at items[${duplicate.firstIndex}] and items[${duplicate.index}]; ordered interactions disabled.`);
    this.lastDuplicateDiagnostic = signature;
    return false;
  }

  protected orderActionLabel(move: NeuListMove): string {
    return `Move selected items ${move === 'top' ? 'to top' : move === 'bottom' ? 'to bottom' : move}`;
  }
  protected itemMoveLabel(item: T, direction: -1 | 1): string {
    return `Move ${this.optionLabelOf(item)} ${direction === -1 ? 'up' : 'down'}`;
  }
  protected moveIcon(move: NeuListMove) {
    return move === 'top' || move === 'up' ? iconArrowUp : iconArrowDown;
  }

  move(index: number, direction: -1 | 1): void {
    if (!this.canMove(index, direction)) return;
    const visible = this.visibleItems();
    const next = reorderVisible(
      this.items(),
      visible,
      this.optionValueOf(visible[index]!),
      index + direction,
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    if (next) this.orderChange.emit(next);
  }
  canMove(index: number, direction: -1 | 1): boolean {
    if (this.duplicate()) return false;
    const visible = this.visibleItems();
    const target = index + direction;
    return (
      index >= 0 &&
      target >= 0 &&
      target < visible.length &&
      !this.isOptionDisabled(visible[index]!) &&
      !this.isOptionDisabled(visible[target]!)
    );
  }
  toggle(item: T): void {
    if (!this.validIdentity() || this.isOptionDisabled(item)) return;
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
    if (!this.validIdentity()) return;
    const next = moveSelectedVisible(
      this.items(),
      this.visibleItems(),
      [...this.selectedSet()],
      move,
      (item) => this.optionValueOf(item),
      (item) => this.isOptionDisabled(item),
    );
    if (next) this.orderChange.emit(next);
  }
  setFilter(event: Event | string): void {
    const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    if (this.filterValue() === null) this.internalFilter.set(value);
    this.filterChange.emit(value);
  }
  onDrop(event: NeuDropEvent<unknown, string>): void {
    if (
      !this.validIdentity() ||
      event.currentIndex === undefined ||
      !Number.isInteger(event.currentIndex) ||
      event.currentIndex < 0
    ) return;
    const item = event.data as T;
    const key = this.optionValueOf(item);
    const visible = this.visibleItems();
    const previousIndex = visible.findIndex((candidate) =>
      neuOptionValuesEqual(this.optionValueOf(candidate), key),
    );
    if (previousIndex < 0) return;
    const currentIndex = Math.min(event.currentIndex, visible.length - 1);
    const next = reorderVisible(
      this.items(),
      visible,
      key,
      currentIndex,
      (candidate) => this.optionValueOf(candidate),
      (candidate) => this.isOptionDisabled(candidate),
    );
    if (!next) return;
    this.orderChange.emit(next);
    this.itemDrop.emit({
      item: visible[previousIndex]!,
      from: 'source',
      to: 'source',
      previousIndex,
      currentIndex,
      interaction: event.interaction,
      originalEvent: event.originalEvent,
    });
  }
  hasSelection(): boolean {
    return this.items().some((item) => this.isSelected(item));
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
