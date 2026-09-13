import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuIdGenerator, walkNeuTreeDepthFirst } from '@neural-ui/core/internal';
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
import {
  NeuCascadeSelectEmptyDirective,
  NeuCascadeSelectFooterDirective,
  NeuCascadeSelectHeaderDirective,
  NeuCascadeSelectItemDirective,
  NeuCascadeSelectSelectedDirective,
} from './neu-cascade-select.directives';
import {
  NEU_OVERLAY_DISMISS_GUARD,
  allowsNeuOverlayDismissal,
} from '@neural-ui/core/foundation';

export {
  NeuCascadeSelectEmptyDirective,
  NeuCascadeSelectFooterDirective,
  NeuCascadeSelectHeaderDirective,
  NeuCascadeSelectItemDirective,
  NeuCascadeSelectSelectedDirective,
} from './neu-cascade-select.directives';
export type {
  NeuCascadeSelectItemContext,
  NeuCascadeSelectSelectedContext,
} from './neu-cascade-select.directives';

export interface NeuCascadeSelectNode<V = string> {
  value: V;
  label: string;
  disabled?: boolean;
  children?: readonly NeuCascadeSelectNode<V>[];
  data?: unknown;
}

interface SelectionPath<T> {
  ancestors: T[];
  node: T;
  index: number;
}

@Component({
  selector: 'neu-cascade-select',
  host: {
    class: 'neu-cascade-select',
  },
  imports: [NgTemplateOutlet, OverlayModule],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuCascadeSelectComponent),
      multi: true,
    },
  ],
  template: `
    @if (label()) {
      <label class="neu-cascade-select__label" [for]="triggerId">{{ label() }}</label>
    }
    <div class="neu-cascade-select__control">
      <button
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        type="button"
        class="neu-cascade-select__trigger"
        [id]="triggerId"
        [disabled]="isDisabled()"
        [class.neu-cascade-select__trigger--open]="open()"
        [class.neu-cascade-select__trigger--has-clear]="clearable() && selectedNode()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="open() ? 'true' : 'false'"
        [attr.aria-controls]="panelId + '-listbox'"
        [attr.aria-label]="label() || placeholder()"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($any($event))"
      >
        <span
          class="neu-cascade-select__value"
          [class.neu-cascade-select__placeholder]="!selectedNode()"
        >
          @if (selectedTpl()) {
            <ng-container
              [ngTemplateOutlet]="selectedTpl()!.templateRef"
              [ngTemplateOutletContext]="{ $implicit: selectedNode() }"
            />
          } @else {
            {{ selectedNode() ? optionLabelOf(selectedNode()!) : placeholder() }}
          }
        </span>
        <span class="neu-cascade-select__chevron" aria-hidden="true">⌄</span>
      </button>
      @if (clearable() && selectedNode()) {
        <button
          type="button"
          class="neu-cascade-select__clear"
          [disabled]="isDisabled()"
          [attr.aria-label]="clearAriaLabel()"
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
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      [cdkConnectedOverlayWidth]="panelPosition().width ?? ''"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="viewportMargin"
      (backdropClick)="requestClose('outside-pointer', $event)"
      (detach)="onPanelDetached()"
      (attach)="onPanelAttached()"
      (positionChange)="onOverlayPositionChange($event)"
    >
      <div
        class="neu-cascade-select__panel"
        [class.neu-cascade-select__panel--above]="isPanelAbove()"
        [id]="panelId"
        [style.max-height]="panelPosition().maxHeight"
      >
        @if (headerTpl()) {
          <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
        }

        <nav class="neu-cascade-select__breadcrumbs" [attr.aria-label]="breadcrumbAriaLabel()">
          <button
            type="button"
            class="neu-cascade-select__breadcrumb"
            [class.neu-cascade-select__breadcrumb--active]="activePath().length === 0"
            [attr.aria-current]="activePath().length === 0 ? 'page' : null"
            (click)="goToDepth(-1)"
          >
            {{ rootLabel() }}
          </button>
          @for (node of activePath(); track trackByPath($index, node)) {
            <span class="neu-cascade-select__separator" aria-hidden="true">/</span>
            <button
              type="button"
              class="neu-cascade-select__breadcrumb"
              [class.neu-cascade-select__breadcrumb--active]="$index === activePath().length - 1"
              [attr.aria-current]="$index === activePath().length - 1 ? 'page' : null"
              (click)="goToDepth($index)"
            >
              {{ optionLabelOf(node) }}
            </button>
          }
        </nav>

        <div class="neu-cascade-select__level-heading">
          @if (activePath().length) {
            <button
              type="button"
              class="neu-cascade-select__back"
              [attr.aria-label]="backAriaLabel()"
              (click)="goBack($event)"
            >
              ←
            </button>
          }
          <span>{{
            activePath().length ? optionLabelOf(activePath()[activePath().length - 1]) : rootLabel()
          }}</span>
        </div>

        <div
          class="neu-cascade-select__options"
          [id]="panelId + '-listbox'"
          role="listbox"
          [attr.aria-label]="label() || placeholder()"
          [attr.aria-activedescendant]="activeOptionId()"
        >
          @for (node of currentNodes(); track trackByOption($index, node)) {
            <button
              type="button"
              class="neu-cascade-select__option"
              [class.neu-cascade-select__option--active]="activeIndex() === $index"
              [class.neu-cascade-select__option--selected]="isOptionSelected(node)"
              [class.neu-cascade-select__option--disabled]="isOptionDisabled(node)"
              [id]="optionDomId($index)"
              role="option"
              [attr.aria-selected]="isOptionSelected(node) ? 'true' : 'false'"
              [attr.aria-disabled]="isOptionDisabled(node) ? 'true' : null"
              [attr.tabindex]="
                isOptionDisabled(node) ? '-1' : activeIndex() === $index ? '0' : '-1'
              "
              (click)="activate(node)"
              (keydown)="onOptionKeydown($any($event), $index)"
            >
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="{
                    $implicit: node,
                    depth: activePath().length,
                    hasChildren: hasChildren(node),
                  }"
                />
              } @else {
                <span class="neu-cascade-select__option-label">{{ optionLabelOf(node) }}</span>
              }
              @if (hasChildren(node)) {
                <span class="neu-cascade-select__option-arrow" aria-hidden="true">→</span>
              }
            </button>
          } @empty {
            @if (emptyTpl()) {
              <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
            } @else {
              <div class="neu-cascade-select__empty">{{ emptyLabel() }}</div>
            }
          }
        </div>

        @if (footerTpl()) {
          <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-cascade-select.component.scss',
})
export class NeuCascadeSelectComponent<
  T = NeuCascadeSelectNode,
  V = NeuOptionValue<T>,
> implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly overlay = inject(Overlay);
  readonly viewportMargin = 8;
  private readonly panelMaxHeight = 360;

  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuCascadeSelectItemDirective<T>);
  readonly selectedTpl = contentChild(NeuCascadeSelectSelectedDirective<T>);
  readonly headerTpl = contentChild(NeuCascadeSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuCascadeSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuCascadeSelectEmptyDirective);
  /* v8 ignore stop */

  readonly nodes = input<readonly T[]>([]);
  readonly options = input<readonly T[] | null>(null);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly optionChildren = input<NeuOptionAccessor<T, readonly T[]> | null>(null);

  readonly label = input('');
  readonly placeholder = input('Select...');
  readonly rootLabel = input('All options');
  readonly emptyLabel = input('No options found');
  readonly breadcrumbAriaLabel = input('Cascade levels');
  readonly backAriaLabel = input('Back to previous level');
  readonly clearAriaLabel = input('Clear selection');
  readonly clearable = input(false);
  readonly disabled = input(false);

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

  /** User ancestor path; restored/programmatic paths are silent. */
  readonly groupChange = output<readonly T[]>();

  readonly selectionChange = output<T | null>();

  readonly triggerId = inject(NeuIdGenerator).getId('neu-cascade-select-');
  readonly panelId = `${this.triggerId}-panel`;
  readonly open = signal(false);
  readonly value = signal<V | null>(null);
  readonly activePath = signal<T[]>([]);
  readonly activeIndex = signal(0);
  readonly cvaDisabled = signal(false);
  readonly isPanelAbove = signal(false);
  readonly panelPosition = signal<{ width: string | null; maxHeight: string | null }>({
    width: null,
    maxHeight: null,
  });
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly rootNodes = computed(() => this.options() ?? this.nodes());
  readonly currentNodes = computed(() => {
    const path = this.activePath();
    return path.length ? this.childrenOf(path[path.length - 1]) : this.rootNodes();
  });
  readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return this.currentNodes()[index] === undefined ? null : this.optionDomId(index);
  });
  readonly selectedNode = computed(() => {
    const current = this.value();
    if (current === null) return null;
    return this.findSelectionPath(this.rootNodes(), current)?.node ?? null;
  });

  private onChange: (value: V | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: V | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: V | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  openPanel(): void {
    if (this.isDisabled()) return;
    this.restoreSelectionNavigation();
    this.syncPanelPosition();
    this.open.set(true);
    this.focusCurrentOption();
  }

  close(): void {
    const wasOpen = this.open();
    this.restoreSelectionNavigation();
    this.open.set(false);
    this.onTouched();
    if (wasOpen) this.focusTrigger();
  }

  requestClose(reason: 'escape' | 'outside-pointer', event: Event): void {
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'cascade-select',
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
    if (this.isDisabled()) return;
    const wasOpen = this.open();
    this.value.set(null);
    this.onChange(null);
    this.selectionChange.emit(null);
    this.close();
    if (!wasOpen) this.focusTrigger();
  }

  activate(node: T): void {
    if (this.eventDestroyRef.destroyed || this.isDisabled() || this.isOptionDisabled(node)) return;
    this.activeIndex.set(this.currentNodes().indexOf(node));
    if (this.hasChildren(node)) {
      this.activePath.update((path) => [...path, node]);
      this.groupChange.emit([...this.activePath()]);
      this.activeIndex.set(this.firstEnabledIndex(this.childrenOf(node)));
      this.focusCurrentOption();
      return;
    }

    const value = this.optionValueOf(node);
    this.value.set(value);
    this.onChange(value);
    this.selectionChange.emit(node);
    this.close();
  }

  goBack(event?: Event): void {
    event?.preventDefault();
    if (this.eventDestroyRef.destroyed || this.isDisabled() || !this.activePath().length) return;
    this.activePath.update((path) => path.slice(0, -1));
    this.groupChange.emit([...this.activePath()]);
    this.activeIndex.set(this.firstEnabledIndex(this.currentNodes()));
    this.focusCurrentOption();
  }

  goToDepth(depth: number): void {
    const nextPath = depth < 0 ? [] : this.activePath().slice(0, depth + 1);
    if (this.eventDestroyRef.destroyed || this.isDisabled() || nextPath.length === this.activePath().length) return;
    this.activePath.set(nextPath);
    this.groupChange.emit([...nextPath]);
    this.activeIndex.set(this.firstEnabledIndex(this.currentNodes()));
    this.focusCurrentOption();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose('escape', event);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) this.openPanel();
    }
  }

  onOptionKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(event.key === 'ArrowDown' ? 1 : -1, index);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const enabled = this.enabledIndices(this.currentNodes());
      if (enabled.length) {
        this.activeIndex.set(event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]);
        this.focusCurrentOption();
      }
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const node = this.currentNodes()[index];
      if (node && this.hasChildren(node) && !this.isOptionDisabled(node)) this.activate(node);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goBack(event);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const node = this.currentNodes()[index];
      if (node) this.activate(node);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose('escape', event);
    }
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

  hasChildren(option: T): boolean {
    return this.childrenOf(option).length > 0;
  }

  isOptionSelected(option: T): boolean {
    const current = this.value();
    return current !== null && neuOptionValuesEqual(this.optionValueOf(option), current);
  }

  trackByOption(index: number, _option: T): string {
    return `${this.panelId}-depth-${this.activePath().length}-option-${index}`;
  }

  trackByPath(index: number, _node: T): string {
    return `${this.panelId}-path-${index}`;
  }

  optionDomId(index: number): string {
    return `${this.panelId}-depth-${this.activePath().length}-option-${index}`;
  }

  onOverlayPositionChange(event: ConnectedOverlayPositionChange): void {
    this.isPanelAbove.set(event.connectionPair.originY === 'top');
  }

  private childrenOf(node: T): readonly T[] {
    const accessor = this.optionChildren();
    const rawChildren = accessor
      ? readNeuOptionAccessor(node, accessor)
      : this.readLegacyChildren(node);
    return Array.isArray(rawChildren) ? (rawChildren as readonly T[]) : [];
  }

  private readLegacyChildren(node: T): unknown {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<PropertyKey, unknown>)['children'];
  }

  private findSelectionPath(nodes: readonly T[], value: V): SelectionPath<T> | null {
    const entries = walkNeuTreeDepthFirst(nodes, (node) => this.childrenOf(node));
    const entryIndex = entries.findIndex((entry) =>
      neuOptionValuesEqual(this.optionValueOf(entry.node), value),
    );
    if (entryIndex < 0) return null;

    const entry = entries[entryIndex];
    const ancestors: T[] = [];
    let parentEntryIndex = entry.parentEntryIndex;
    while (parentEntryIndex != null) {
      const parent = entries[parentEntryIndex];
      ancestors.push(parent.node);
      parentEntryIndex = parent.parentEntryIndex;
    }
    ancestors.reverse();
    return { ancestors, node: entry.node, index: entry.index };
  }

  private restoreSelectionNavigation(): void {
    const current = this.value();
    if (current === null) {
      this.activePath.set([]);
      this.activeIndex.set(this.firstEnabledIndex(this.rootNodes()));
      return;
    }
    const selected = this.findSelectionPath(this.rootNodes(), current);
    if (!selected) {
      this.activePath.set([]);
      this.activeIndex.set(this.firstEnabledIndex(this.rootNodes()));
      return;
    }
    this.activePath.set(selected.ancestors);
    this.activeIndex.set(selected.index);
  }

  private enabledIndices(nodes: readonly T[]): number[] {
    return nodes.reduce<number[]>((indices, node, index) => {
      if (!this.isOptionDisabled(node)) indices.push(index);
      return indices;
    }, []);
  }

  private firstEnabledIndex(nodes: readonly T[]): number {
    return this.enabledIndices(nodes)[0] ?? 0;
  }

  private moveFocus(direction: 1 | -1, currentIndex: number): void {
    const enabled = this.enabledIndices(this.currentNodes());
    if (!enabled.length) return;
    const currentPosition = Math.max(0, enabled.indexOf(currentIndex));
    const nextPosition = (currentPosition + direction + enabled.length) % enabled.length;
    this.activeIndex.set(enabled[nextPosition]);
    this.focusCurrentOption();
  }

  private focusCurrentOption(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => this.document.getElementById(this.activeOptionId() ?? '')?.focus());
  }

  private focusTrigger(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() =>
      this.elementRef.nativeElement.querySelector<HTMLElement>(`#${this.triggerId}`)?.focus(),
    );
  }

  private syncPanelPosition(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.neu-cascade-select__trigger',
    );
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 280), viewportWidth - this.viewportMargin * 2);
    const below = Math.max(0, viewportHeight - rect.bottom - this.viewportMargin - 6);
    const above = Math.max(0, rect.top - this.viewportMargin - 6);
    const aboveWins = above > below && above >= 180;
    this.panelPosition.set({
      width: `${width}px`,
      maxHeight: `${Math.max(180, Math.min(this.panelMaxHeight, aboveWins ? above : below))}px`,
    });
  }
}
