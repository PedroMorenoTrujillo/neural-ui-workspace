import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  computed,
  afterNextRender,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, OverlayModule } from '@angular/cdk/overlay';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NeuOptionAccessor,
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
  NeuSelectionMode,
  NeuSelectionValue,
  NeuViewportRange,
  neuOptionValuesEqual,
  readNeuOptionAccessor,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  NeuTreeNavigationController,
  NeuTreeNavigationItem,
  walkNeuTreeDepthFirst,
} from '@neural-ui/core/internal';
import { NEU_OVERLAY_DISMISS_GUARD, allowsNeuOverlayDismissal } from '@neural-ui/core/foundation';
import {
  NeuTreeSelectChildrenRequest,
  NeuTreeSelectSelectionStrategy,
  NeuTreeSelectVirtualizationOptions,
} from './neu-tree-select.types';

export interface NeuTreeSelectNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: NeuTreeSelectNode[];
  lazy?: boolean;
  data?: unknown;
}

type UnknownRecord = Record<PropertyKey, unknown>;
const NEGATIVE_ZERO_TOKEN = Symbol('neu-tree-select-negative-zero');

function selectionToken(value: unknown): unknown {
  return typeof value === 'number' && Object.is(value, -0) ? NEGATIVE_ZERO_TOKEN : value;
}

interface FlatNode<T, V> {
  node: T;
  level: number;
  trackBy: string;
  value: V;
  label: string;
  disabled: boolean;
  hasChildren: boolean;
  lazy: boolean;
  parentTrackBy?: string;
}

export interface NeuTreeSelectNodeTemplateContext<T = NeuTreeSelectNode> {
  $implicit: T;
  level: number;
  selected: boolean;
  toggle: () => void;
}
@Directive({ selector: 'ng-template[neuTreeSelectNode]' })
export class NeuTreeSelectNodeDirective<T = NeuTreeSelectNode> {
  constructor(readonly templateRef: TemplateRef<NeuTreeSelectNodeTemplateContext<T>>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectSelected]' })
export class NeuTreeSelectSelectedDirective<T = NeuTreeSelectNode> {
  constructor(readonly templateRef: TemplateRef<{ $implicit: T | null }>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectHeader]' })
export class NeuTreeSelectHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectFooter]' })
export class NeuTreeSelectFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectEmpty]' })
export class NeuTreeSelectEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Component({
  selector: 'neu-tree-select',
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-tree-select',
    '(focusout)': 'onCompositeFocusOut($event)',
    '(window:resize)': 'onViewportResize()',
  },
  template: `
    @if (label()) {
      <label class="neu-tree-select__label" [for]="triggerId">{{ label() }}</label>
    }
    <div class="neu-tree-select__trigger-wrap">
      <button
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        #trigger
        type="button"
        class="neu-tree-select__trigger"
        [id]="triggerId"
        [disabled]="isDisabled()"
        aria-haspopup="tree"
        [attr.aria-controls]="panelId + '-tree'"
        [attr.aria-expanded]="open()"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span
          class="neu-tree-select__value"
          [class.neu-tree-select__placeholder]="!selectedLabel()"
        >
          @if (selectedTpl() && selectedNode()) {
            <ng-container
              [ngTemplateOutlet]="selectedTpl()!.templateRef"
              [ngTemplateOutletContext]="{ $implicit: selectedNode() }"
            />
          } @else {
            {{ selectedLabel() || placeholder() }}
          }
        </span>
        <span
          class="neu-tree-select__chevron"
          [class.neu-tree-select__chevron--open]="open()"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      @if (clearable() && currentValues().length) {
        <button
          class="neu-tree-select__clear"
          type="button"
          [attr.aria-label]="clearLabel()"
          [disabled]="isDisabled() || readonly()"
          (click)="clear($event)"
        >
          ×
        </button>
      }
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="requestClose('outside-pointer', $event)"
      (detach)="onPanelDetached()"
      (attach)="onOverlayAttach(); onPanelAttached()"
      (overlayKeydown)="onOverlayKeydown($event)"
    >
      <div
        class="neu-tree-select__panel"
        [id]="panelId"
        (focusout)="onCompositeFocusOut($event)"
      >
        @if (headerTpl()) {
          <div class="neu-tree-select__header">
            <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
          </div>
        }
        @if (searchable()) {
          <input
            class="neu-tree-select__search"
            type="search"
            [placeholder]="searchPlaceholder()"
            [value]="query()"
            (input)="onFilterInput($event)"
            (keydown)="onSearchKeydown($event)"
          />
        }
        <ng-template #treeNode let-item let-index="index" let-virtual="virtual">
          <button
            type="button"
            role="treeitem"
            class="neu-tree-select__node"
            [class.neu-tree-select__node--selected]="selectionState(item) === 'checked'"
            [class.neu-tree-select__node--mixed]="selectionState(item) === 'mixed'"
            [class.neu-tree-select__node--virtual]="virtual"
            [disabled]="item.disabled"
            [tabIndex]="treeTabIndex(index)"
            [style.padding-inline-start.rem]="0.75 + item.level * 1"
            [style.height.px]="virtual ? effectiveVirtualization().itemSize : null"
            [style.transform]="virtual ? 'translateY(' + index * effectiveVirtualization().itemSize + 'px)' : null"
            [attr.data-neu-tree-select-index]="index"
            [attr.aria-level]="item.level + 1"
            [attr.aria-expanded]="item.hasChildren || item.lazy ? isExpanded(item.value) : null"
            [attr.aria-selected]="isSelected(item.value)"
            [attr.aria-checked]="isMultiple() ? selectionState(item) : null"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            (focus)="setActiveIndex(index)"
            (keydown)="onNodeKeydown(item, index, $event)"
            (click)="selectNode(item.node)"
          >
            @if (item.hasChildren || item.lazy) {
              <span
                class="neu-tree-select__twisty"
                aria-hidden="true"
                (click)="toggleExpanded(item.node, $event)"
              >
                {{ isExpanded(item.value) ? '−' : '+' }}
              </span>
            }
            @if (nodeTpl()) {
              <ng-container
                [ngTemplateOutlet]="nodeTpl()!.templateRef"
                [ngTemplateOutletContext]="{
                  $implicit: item.node,
                  level: item.level,
                  selected: isSelected(item.value),
                  toggle: toggleExpandedFromTemplate.bind(this, item.node),
                }"
              />
            } @else {
              {{ item.label }}
            }
          </button>
        </ng-template>
        <div
          class="neu-tree-select__tree"
          [id]="panelId + '-tree'"
          role="tree"
          [attr.aria-label]="label() || placeholder()"
          [attr.aria-multiselectable]="isMultiple() ? 'true' : null"
        >
        @if (effectiveVirtualization().enabled && visibleNodes().length) {
          <div
            class="neu-tree-select__viewport"
            role="group"
            [style.height.px]="effectiveVirtualization().viewportHeight"
            (scroll)="onVirtualScroll($event)"
          >
            <div
              class="neu-tree-select__virtual-spacer"
              [style.height.px]="visibleNodes().length * effectiveVirtualization().itemSize"
            >
              @for (item of renderedNodes(); track item.trackBy; let localIndex = $index) {
                <ng-container
                  [ngTemplateOutlet]="treeNode"
                  [ngTemplateOutletContext]="{
                    $implicit: item,
                    index: virtualRenderStart() + localIndex,
                    virtual: true,
                  }"
                />
              }
            </div>
          </div>
        } @else {
          @for (item of visibleNodes(); track item.trackBy; let index = $index) {
            <ng-container
              [ngTemplateOutlet]="treeNode"
              [ngTemplateOutletContext]="{ $implicit: item, index, virtual: false }"
            />
          }
        }
        </div>
        @if (!visibleNodes().length) {
          <div class="neu-tree-select__empty" role="status">
            @if (emptyTpl()) {
              <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
            } @else {
              {{ emptyLabel() }}
            }
          </div>
        }
        @if (footerTpl()) {
          <div class="neu-tree-select__footer">
            <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
          </div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-tree-select.component.scss',
})
export class NeuTreeSelectComponent<
  T = NeuTreeSelectNode,
  V = NeuOptionValue<T>,
  M extends NeuSelectionMode = 'single',
> implements FormValueControl<NeuSelectionValue<V, M>> {
  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null;
  }

  /* v8 ignore start -- Angular signal-query factories; projected tree-select slots are covered. */
  readonly nodeTpl = contentChild(NeuTreeSelectNodeDirective<T>);
  readonly selectedTpl = contentChild(NeuTreeSelectSelectedDirective<T>);
  readonly headerTpl = contentChild(NeuTreeSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuTreeSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuTreeSelectEmptyDirective);
  /* v8 ignore stop */
  readonly nodes = input<readonly T[]>([]);

  /** Property or function used to obtain the visible option label. */
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  /** Property or function used to obtain the form value. Defaults to complete domain model. */
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  /** Property or function used to determine whether an option is disabled. */
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  /** Property or function used to obtain nested children. Defaults to `children`. */
  readonly optionChildren = input<NeuOptionAccessor<T, readonly T[]> | null>(null);

  readonly label = input('');
  readonly placeholder = input('Select...');
  readonly emptyLabel = input('No options found');
  readonly searchPlaceholder = input('Search...');
  readonly searchable = input(true);
  readonly mode = input<M>('single' as M);
  readonly selectionStrategy = input<NeuTreeSelectSelectionStrategy>('independent');
  readonly expandedKeys = input<readonly V[]>([]);
  readonly virtualizationOptions = input<Readonly<NeuTreeSelectVirtualizationOptions>>({});
  readonly clearable = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly touched = input(false);
  readonly clearLabel = input('Clear selection');

  /** Browser panel attached, regardless of opening source. */
  readonly opened = output<void>();
  /** Browser panel detached, regardless of closing source; silent during destroy. */
  readonly closed = output<void>();
  private readonly eventDestroyRef = inject(DestroyRef);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  private panelAttached = false;

  protected onPanelAttached(): void {
    if (this.eventDestroyRef.destroyed || this.panelAttached) return;
    this.panelAttached = true;
    this.opened.emit();
  }

  protected onPanelDetached(): void {
    const wasAttached = this.panelAttached;
    this.panelAttached = false;
    if (this.eventDestroyRef.destroyed) return;
    this.close();
    if (wasAttached) this.closed.emit();
  }

  readonly expandedKeysChange = output<readonly V[]>();
  readonly nodeExpanded = output<T>();
  readonly nodeCollapsed = output<T>();
  readonly childrenRequest = output<NeuTreeSelectChildrenRequest<V>>();
  readonly rangeChange = output<NeuViewportRange>();
  /** Changed raw query from user input; programmatic query writes are silent. */
  readonly filter = output<{ query: string }>();
  /** Explicit clear command, not empty selection/model synchronization. */
  readonly cleared = output<void>();
  readonly touch = output<void>();

  protected onFilterInput(event: Event): void {
    if (this.eventDestroyRef.destroyed || this.isDisabled()) return;
    const query = (event.target as HTMLInputElement).value;
    if (query === this.query()) return;
    this.query.set(query);
    this.queryRevision.update((revision) => revision + 1);
    this.virtualStart.set(0);
    this.filter.emit({ query });
  }

  readonly triggerId = inject(NeuIdGenerator).getId('neu-tree-select-');
  readonly panelId = inject(NeuIdGenerator).getId('neu-tree-select-panel-');
  readonly open = signal(false);
  readonly query = signal('');
  readonly value = model<NeuSelectionValue<V, M>>(null as NeuSelectionValue<V, M>);
  readonly virtualStart = signal(0);
  protected readonly panelWidth = signal<number | string>('');
  private readonly queryRevision = signal(0);
  private nextChildrenRequestId = 1;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /* v8 ignore start -- Angular signal-query factories; trigger/overlay behavior is covered. */
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  /* v8 ignore stop */
  private readonly navigation = new NeuTreeNavigationController();
  private focusLastOnAttach = false;

  readonly isDisabled = computed(() => this.disabled());
  readonly isMultiple = computed(() => this.mode() === 'multiple');
  readonly currentValues = computed<readonly V[]>(() => {
    const value = this.value();
    if (value == null) return [];
    return this.isMultiple() ? ([...(value as readonly V[])] as readonly V[]) : [value as V];
  });
  private readonly currentValueTokens = computed(
    () => new Set(this.currentValues().map((value) => selectionToken(value))),
  );
  readonly effectiveVirtualization = computed(() => {
    const options = this.virtualizationOptions();
    return {
      enabled: options.enabled === true,
      itemSize: Math.max(24, options.itemSize ?? 40),
      viewportHeight: Math.max(40, options.viewportHeight ?? 240),
      buffer: Math.max(0, options.buffer ?? 3),
    };
  });
  readonly allNodes = computed(() => this.flatten(this.nodes()));
  readonly selectedNodes = computed(() =>
    this.allNodes()
      .filter((item) => this.isSelected(item.value))
      .map((item) => item.node),
  );
  readonly selectedLabel = computed(() => {
    const selected = this.selectedNodes();
    if (!selected.length) {
      return '';
    }
    return this.isMultiple() ? `${selected.length} selected` : this.optionLabelOf(selected[0]);
  });
  readonly selectedNode = computed(() => this.selectedNodes()[0] ?? null);
  readonly visibleNodes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const nodes = q ? this.allNodes() : this.flattenVisible(this.nodes());
    return q ? nodes.filter((item) => item.label.toLowerCase().includes(q)) : nodes;
  });
  readonly selectionStates = computed(() => {
    const nodes = this.allNodes();
    const states = new Map<string, 'checked' | 'mixed' | 'unchecked'>();
    if (!this.isMultiple() || this.selectionStrategy() === 'independent') {
      for (const item of nodes)
        states.set(item.trackBy, this.isSelected(item.value) ? 'checked' : 'unchecked');
      return states;
    }
    const childrenByParent = new Map<string, FlatNode<T, V>[]>();
    for (const item of nodes) {
      if (!item.parentTrackBy || item.disabled) continue;
      const children = childrenByParent.get(item.parentTrackBy) ?? [];
      children.push(item);
      childrenByParent.set(item.parentTrackBy, children);
    }
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const item = nodes[index];
      const selected = this.isSelected(item.value);
      const children = childrenByParent.get(item.trackBy) ?? [];
      if (!children.length) {
        states.set(item.trackBy, selected ? 'checked' : 'unchecked');
        continue;
      }
      const childStates = children.map((child) => states.get(child.trackBy) ?? 'unchecked');
      states.set(
        item.trackBy,
        selected && childStates.every((state) => state === 'checked')
          ? 'checked'
          : selected || childStates.some((state) => state !== 'unchecked')
            ? 'mixed'
            : 'unchecked',
      );
    }
    return states;
  });
  readonly renderedNodes = computed(() => {
    if (!this.effectiveVirtualization().enabled) return this.visibleNodes();
    const { itemSize, viewportHeight, buffer } = this.effectiveVirtualization();
    const visibleCount = Math.ceil(viewportHeight / itemSize);
    return this.visibleNodes().slice(
      this.virtualRenderStart(),
      this.virtualRenderStart() + visibleCount + buffer * 2,
    );
  });
  readonly virtualRenderStart = computed(() =>
    Math.max(0, this.virtualStart() - this.effectiveVirtualization().buffer),
  );

  toggle(): void {
    if (!this.isDisabled()) {
      this.open() ? this.close() : this.openPanel(false);
    }
  }

  focus(): void {
    if (!this.isDisabled()) this.trigger()?.nativeElement.focus({ preventScroll: true });
  }

  reset(): void {
    if (this.query()) this.queryRevision.update((revision) => revision + 1);
    this.query.set('');
    this.virtualStart.set(0);
    this.navigation.setItems([]);
    this.close();
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    queueMicrotask(() => {
      if (!this.eventDestroyRef.destroyed)
        this.trigger()?.nativeElement.focus({ preventScroll: true });
    });
  }

  onCompositeFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    const panel = this.host.ownerDocument.getElementById(this.panelId);
    if (related && (this.host.contains(related) || panel?.contains(related))) return;
    this.touch.emit();
  }

  requestClose(reason: 'escape' | 'outside-pointer', event: Event): void {
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'tree-select',
        reason,
        originalEvent: event,
      })
    )
      return;
    if (!this.open()) return;
    this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    if (this.eventDestroyRef.destroyed || this.isDisabled() || this.readonly()) return;
    this.commit([]);
    if (!this.eventDestroyRef.destroyed) this.cleared.emit();
  }

  isSelected(value: V): boolean {
    return this.currentValueTokens().has(selectionToken(value));
  }

  isExpanded(value: V): boolean {
    return this.expandedKeys().some((key) => neuOptionValuesEqual(key, value));
  }

  selectionState(item: FlatNode<T, V>): 'checked' | 'mixed' | 'unchecked' {
    return this.selectionStates().get(item.trackBy) ?? 'unchecked';
  }

  selectNode(node: T): void {
    if (this.isOptionDisabled(node) || this.isDisabled() || this.readonly()) {
      return;
    }

    const value = this.optionValueOf(node);
    const next = this.isMultiple()
      ? this.selectionStrategy() === 'propagated'
        ? this.propagatedSelection(node, !this.isSelected(value))
        : this.isSelected(value)
          ? this.currentValues().filter((item) => !neuOptionValuesEqual(item, value))
          : [...this.currentValues(), value]
      : [value];

    this.commit(next);
    if (!this.isMultiple()) {
      this.close();
    }
  }

  toggleExpanded(node: T, event: Event): void {
    event.stopPropagation();
    if (this.eventDestroyRef.destroyed || this.isDisabled() || this.isOptionDisabled(node)) return;
    const value = this.optionValueOf(node);
    const children = this.childrenOf(node);
    if (!children.length && !this.isLazyNode(node)) return;
    const next = [...this.expandedKeys()];
    const currentIndex = next.findIndex((key) => neuOptionValuesEqual(key, value));

    if (currentIndex >= 0) {
      next.splice(currentIndex, 1);
      this.nodeCollapsed.emit(node);
    } else {
      next.push(value);
      this.nodeExpanded.emit(node);
      if (this.isLazyNode(node) && !children.length) {
        this.childrenRequest.emit({
          requestId: this.nextChildrenRequestId++,
          queryRevision: this.queryRevision(),
          parentKey: value,
        });
        if (this.eventDestroyRef.destroyed) return;
      }
    }

    this.expandedKeysChange.emit(next);
  }

  toggleExpandedFromTemplate(node: T): void {
    this.toggleExpanded(node, new Event('toggle'));
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.openPanel(event.key === 'ArrowUp');
  }

  onOverlayAttach(): void {
    queueMicrotask(() => {
      if (this.eventDestroyRef.destroyed) return;
      this.reconcileNavigation();
      const overlay = this.connectedOverlay()?.overlayRef.overlayElement;
      if (this.searchable()) {
        overlay?.querySelector<HTMLInputElement>('.neu-tree-select__search')?.focus({
          preventScroll: true,
        });
        this.focusLastOnAttach = false;
        return;
      }
      if (this.focusLastOnAttach) this.navigation.setActiveIndex(this.lastEligibleIndex());
      this.focusActiveNode();
      this.focusLastOnAttach = false;
      this.emitVirtualRange();
    });
  }

  onVirtualScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const first = Math.max(
      0,
      Math.min(
        Math.floor(target.scrollTop / this.effectiveVirtualization().itemSize),
        Math.max(0, this.visibleNodes().length - 1),
      ),
    );
    if (first === this.virtualStart()) return;
    this.virtualStart.set(first);
    this.emitVirtualRange();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose('escape', event);
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.reconcileNavigation();
    if (event.key === 'ArrowUp') this.navigation.setActiveIndex(this.lastEligibleIndex());
    else this.navigation.setActiveIndex(this.firstEligibleIndex());
    this.focusActiveNode();
  }

  treeTabIndex(index: number): 0 | -1 {
    this.reconcileNavigation();
    return this.navigation.tabIndexFor(index);
  }

  setActiveIndex(index: number): void {
    this.reconcileNavigation();
    this.navigation.setActiveIndex(index);
  }

  onNodeKeydown(item: FlatNode<T, V>, index: number, event: KeyboardEvent): void {
    this.reconcileNavigation();
    this.navigation.setActiveIndex(index);
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    this.navigation.configure({ direction: direction === 'rtl' ? 'rtl' : 'ltr' });
    const result = this.navigation.handleKey(event);
    if (!result.handled) return;
    if (result.action === 'expand' || result.action === 'collapse') {
      this.toggleExpanded(item.node, event);
      return;
    }
    if (result.action === 'activate') {
      this.selectNode(item.node);
      return;
    }
    this.focusActiveNode();
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

  private childrenOf(node: T): readonly T[] {
    const accessor = this.optionChildren();
    const rawChildren = accessor
      ? readNeuOptionAccessor(node, accessor)
      : this.isRecord(node)
        ? (node as UnknownRecord)['children']
        : undefined;

    return Array.isArray(rawChildren) ? (rawChildren as readonly T[]) : [];
  }

  private isLazyNode(node: T): boolean {
    return this.isRecord(node) ? Boolean((node as UnknownRecord)['lazy']) : false;
  }

  private commit(values: V[]): void {
    const ownedValues = [...values];
    this.value.set(
      (this.isMultiple() ? ownedValues : (ownedValues[0] ?? null)) as NeuSelectionValue<V, M>,
    );
  }

  private propagatedSelection(node: T, select: boolean): V[] {
    const all = this.allNodes();
    const root = all.find((item) => item.node === node);
    if (!root) return [...this.currentValues()];
    const next = new Map<unknown, V>(
      this.currentValues().map((value) => [selectionToken(value), value]),
    );
    const setSelected = (value: V, selected: boolean) => {
      const token = selectionToken(value);
      if (selected) next.set(token, value);
      else next.delete(token);
    };
    const byTrack = new Map(all.map((item) => [item.trackBy, item]));
    const childrenByParent = new Map<string, FlatNode<T, V>[]>();
    for (const item of all) {
      if (!item.parentTrackBy) continue;
      const children = childrenByParent.get(item.parentTrackBy) ?? [];
      children.push(item);
      childrenByParent.set(item.parentTrackBy, children);
    }
    for (const item of this.propagationNodes(root, childrenByParent))
      setSelected(item.value, select);

    let parentTrack = root.parentTrackBy;
    while (parentTrack) {
      const parent = byTrack.get(parentTrack);
      if (!parent || parent.disabled) break;
      const children = (childrenByParent.get(parentTrack) ?? []).filter(
        (candidate) => !candidate.disabled,
      );
      setSelected(
        parent.value,
        children.length > 0 &&
          children.every((candidate) => next.has(selectionToken(candidate.value))),
      );
      parentTrack = parent.parentTrackBy;
    }
    return [...next.values()];
  }

  private propagationNodes(
    root: FlatNode<T, V>,
    childrenByParent: ReadonlyMap<string, readonly FlatNode<T, V>[]>,
  ): FlatNode<T, V>[] {
    const result: FlatNode<T, V>[] = [];
    const pending = [root];
    while (pending.length) {
      const current = pending.pop()!;
      if (current.disabled) continue;
      result.push(current);
      const children = childrenByParent.get(current.trackBy) ?? [];
      for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
    }
    return result;
  }

  private emitVirtualRange(): void {
    if (!this.effectiveVirtualization().enabled || this.eventDestroyRef.destroyed) return;
    const visibleCount = Math.ceil(
      this.effectiveVirtualization().viewportHeight / this.effectiveVirtualization().itemSize,
    );
    const renderStart = this.virtualRenderStart();
    this.rangeChange.emit({
      visible: {
        start: this.virtualStart(),
        end: Math.min(this.visibleNodes().length, this.virtualStart() + visibleCount),
      },
      render: {
        start: renderStart,
        end: Math.min(this.visibleNodes().length, renderStart + this.renderedNodes().length),
      },
    });
  }

  private flatten(nodes: readonly T[]): FlatNode<T, V>[] {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => this.childrenOf(node), {
      includePath: true,
    });
    return entries.map((entry) => {
      const node = entry.node;
      const children = this.childrenOf(node);
      const value = this.optionValueOf(node);
      return this.createFlatNode({
        node,
        level: entry.level,
        trackBy: entry.path,
        value,
        label: this.optionLabelOf(node),
        disabled: this.isOptionDisabled(node),
        hasChildren: children.length > 0,
        lazy: this.isLazyNode(node),
        parentTrackBy:
          entry.parentEntryIndex == null ? undefined : entries[entry.parentEntryIndex].path,
      });
    });
  }

  private flattenVisible(nodes: readonly T[]): FlatNode<T, V>[] {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => this.childrenOf(node), {
      includePath: true,
      shouldDescend: (entry) => this.isExpanded(this.optionValueOf(entry.node)),
    });
    return entries.map((entry) => {
      const node = entry.node;
      const children = this.childrenOf(node);
      const value = this.optionValueOf(node);
      return this.createFlatNode({
        node,
        level: entry.level,
        trackBy: entry.path,
        value,
        label: this.optionLabelOf(node),
        disabled: this.isOptionDisabled(node),
        hasChildren: children.length > 0,
        lazy: this.isLazyNode(node),
        parentTrackBy:
          entry.parentEntryIndex == null ? undefined : entries[entry.parentEntryIndex].path,
      });
    });
  }

  private createFlatNode(data: FlatNode<T, V>): FlatNode<T, V> {
    return data;
  }

  private openPanel(focusLast: boolean): void {
    if (this.eventDestroyRef.destroyed || this.isDisabled() || this.open()) return;
    this.syncPanelWidth();
    this.focusLastOnAttach = focusLast;
    this.open.set(true);
  }

  protected onViewportResize(): void {
    if (!this.open()) return;
    this.syncPanelWidth();
    this.connectedOverlay()?.overlayRef.updatePosition();
  }

  private syncPanelWidth(): void {
    const width = this.trigger()?.nativeElement.getBoundingClientRect().width ?? 0;
    this.panelWidth.set(width > 0 ? Math.round(width) : '');
  }

  private reconcileNavigation(): void {
    this.navigation.setItems(
      this.visibleNodes().map<NeuTreeNavigationItem>((item) => ({
        key: item.trackBy,
        label: item.label,
        level: item.level + 1,
        parentKey: item.parentTrackBy,
        disabled: item.disabled,
        hasChildren: item.hasChildren || item.lazy,
        expanded: this.isExpanded(item.value),
      })),
    );
  }

  private lastEligibleIndex(): number {
    for (let index = this.visibleNodes().length - 1; index >= 0; index -= 1) {
      if (!this.visibleNodes()[index]?.disabled) return index;
    }
    return -1;
  }

  private firstEligibleIndex(): number {
    return this.visibleNodes().findIndex((item) => !item.disabled);
  }

  private readonly focusInjector = inject(Injector);

  private focusActiveNode(): void {
    const overlay = this.connectedOverlay()?.overlayRef.overlayElement;
    if (!overlay) return;
    if (this.effectiveVirtualization().enabled) {
      const index = this.navigation.index;
      const count = Math.ceil(
        this.effectiveVirtualization().viewportHeight / this.effectiveVirtualization().itemSize,
      );
      if (index < this.virtualStart() || index >= this.virtualStart() + count) {
        this.virtualStart.set(Math.max(0, Math.min(index, this.visibleNodes().length - count)));
        const viewport = overlay.querySelector<HTMLElement>('.neu-tree-select__viewport');
        if (viewport) viewport.scrollTop = this.virtualStart() * this.effectiveVirtualization().itemSize;
      }
      afterNextRender(() => {
        if (this.eventDestroyRef.destroyed || !this.open()) return;
        overlay
          .querySelector<HTMLElement>(`[data-neu-tree-select-index="${this.navigation.index}"]`)
          ?.focus({ preventScroll: true });
      }, { injector: this.focusInjector });
      return;
    }
    overlay
      .querySelector<HTMLElement>(`[data-neu-tree-select-index="${this.navigation.index}"]`)
      ?.focus({ preventScroll: true });
  }
}
