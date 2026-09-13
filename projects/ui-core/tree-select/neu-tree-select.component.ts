import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NeuOptionAccessor,
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
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

export interface NeuTreeSelectNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: NeuTreeSelectNode[];
  lazy?: boolean;
  data?: unknown;
}

type UnknownRecord = Record<PropertyKey, unknown>;

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuTreeSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-tree-select',
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
        [attr.aria-controls]="panelId"
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
            <path d="m7 9 5 5 5-5" />
          </svg>
        </span>
      </button>
      @if (clearable() && values().length) {
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
        role="tree"
        [attr.aria-label]="label() || placeholder()"
        [attr.aria-multiselectable]="multiple() ? 'true' : null"
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
        @for (item of visibleNodes(); track item.trackBy; let index = $index) {
          <button
            type="button"
            role="treeitem"
            class="neu-tree-select__node"
            [class.neu-tree-select__node--selected]="isSelected(item.value)"
            [disabled]="item.disabled"
            [tabIndex]="treeTabIndex(index)"
            [style.padding-inline-start.rem]="0.75 + item.level * 1"
            [attr.data-neu-tree-select-index]="index"
            [attr.aria-level]="item.level + 1"
            [attr.aria-expanded]="item.hasChildren || item.lazy ? expanded().has(item.value) : null"
            [attr.aria-selected]="isSelected(item.value)"
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
                {{ expanded().has(item.value) ? '−' : '+' }}
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
        }
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
> implements ControlValueAccessor {
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
  readonly multiple = input(false);
  readonly clearable = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
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

  readonly selectionChange = output<T[]>();
  readonly nodeExpand = output<T>();
  /** Changed raw query from user input; programmatic query writes are silent. */
  readonly filter = output<{ query: string }>();
  /** Explicit clear command, not empty selection/model synchronization. */
  readonly cleared = output<void>();
  readonly nodeExpansionChange = output<{ node: T; expanded: boolean }>();

  protected onFilterInput(event: Event): void {
    if (this.eventDestroyRef.destroyed || this.isDisabled()) return;
    const query = (event.target as HTMLInputElement).value;
    if (query === this.query()) return;
    this.query.set(query);
    this.filter.emit({ query });
  }

  readonly triggerId = inject(NeuIdGenerator).getId('neu-tree-select-');
  readonly panelId = inject(NeuIdGenerator).getId('neu-tree-select-panel-');
  readonly open = signal(false);
  readonly query = signal('');
  readonly values = signal<V[]>([]);
  readonly expanded = signal(new Set<V>());
  protected readonly panelWidth = signal<number | string>('');
  readonly cvaDisabled = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /* v8 ignore start -- Angular signal-query factories; trigger/overlay behavior is covered. */
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  /* v8 ignore stop */
  private readonly navigation = new NeuTreeNavigationController();
  private focusLastOnAttach = false;

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly selectedNodes = computed(() => this.selectedNodesFromValues(this.values()));
  readonly selectedLabel = computed(() => {
    const selected = this.selectedNodes();
    if (!selected.length) {
      return '';
    }
    return this.multiple() ? `${selected.length} selected` : this.optionLabelOf(selected[0]);
  });
  readonly selectedNode = computed(() => this.selectedNodes()[0] ?? null);
  readonly visibleNodes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const nodes = q ? this.flatten(this.nodes()) : this.flattenVisible(this.nodes());
    return q ? nodes.filter((item) => item.label.toLowerCase().includes(q)) : nodes;
  });

  private onChange: (value: V | V[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: V | V[] | null): void {
    if (value === null || value === undefined) {
      this.values.set([]);
      return;
    }

    this.values.set(Array.isArray(value) ? [...value] : [value]);
  }

  registerOnChange(fn: (value: V | V[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  toggle(): void {
    if (!this.isDisabled()) {
      this.open() ? this.close() : this.openPanel(false);
    }
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    queueMicrotask(() => {
      if (!this.eventDestroyRef.destroyed)
        this.trigger()?.nativeElement.focus({ preventScroll: true });
    });
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
    return this.values().some((selected) => neuOptionValuesEqual(selected, value));
  }

  selectNode(node: T): void {
    if (this.isOptionDisabled(node) || this.isDisabled() || this.readonly()) {
      return;
    }

    const value = this.optionValueOf(node);
    const next = this.multiple()
      ? this.isSelected(value)
        ? this.values().filter((item) => !neuOptionValuesEqual(item, value))
        : [...this.values(), value]
      : [value];

    this.commit(next);
    if (!this.multiple()) {
      this.close();
    }
  }

  toggleExpanded(node: T, event: Event): void {
    event.stopPropagation();
    if (this.eventDestroyRef.destroyed || this.isDisabled() || this.isOptionDisabled(node)) return;
    const value = this.optionValueOf(node);
    const children = this.childrenOf(node);
    if (!children.length && !this.isLazyNode(node)) return;
    const next = new Set(this.expanded());

    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
      if (this.isLazyNode(node) && !children.length) {
        this.nodeExpand.emit(node);
      }
    }

    this.expanded.set(next);
    if (!this.eventDestroyRef.destroyed)
      this.nodeExpansionChange.emit({ node, expanded: next.has(value) });
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
    });
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
    this.values.set(ownedValues);
    this.onTouched();
    this.onChange(this.multiple() ? [...ownedValues] : (ownedValues[0] ?? null));
    this.selectionChange.emit(this.selectedNodesFromValues(ownedValues));
  }

  private selectedNodesFromValues(values: readonly V[]): T[] {
    const allNodes = this.flatten(this.nodes());
    return allNodes
      .filter((item) => values.some((value) => neuOptionValuesEqual(item.value, value)))
      .map((item) => item.node);
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
      shouldDescend: (entry) => this.expanded().has(this.optionValueOf(entry.node)),
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
        expanded: this.expanded().has(item.value),
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

  private focusActiveNode(): void {
    this.connectedOverlay()
      ?.overlayRef.overlayElement.querySelector<HTMLElement>(
        `[data-neu-tree-select-index="${this.navigation.index}"]`,
      )
      ?.focus({ preventScroll: true });
  }
}
