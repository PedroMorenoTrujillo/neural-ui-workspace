import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  afterRenderEffect,
  computed,
  contentChild,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuBadgeComponent } from '@neural-ui/core/badge';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { InternalNeuIconOutletComponent, neuStructuralIconPath } from '@neural-ui/core/icon-outlet-internal';
import { neuIconPlus as iconPlus } from '@neural-ui/core/internal';
import {
  NeuMenuActionLike,
  NeuResolvedMenuAction,
  NeuRovingMenuController,
  activateNeuMenuAction,
  resolveNeuMenuAction,
} from '@neural-ui/core/internal';
import { NeuTooltipDirective, type NeuTooltipPosition } from '@neural-ui/core/tooltip';

export type NeuSpeedDialDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';
export type NeuSpeedDialType = 'linear' | 'circle' | 'semi-circle' | 'quarter-circle';
export type NeuSpeedDialVisibilityReason =
  | 'trigger'
  | 'item'
  | 'escape'
  | 'outside'
  | 'mask'
  | 'disabled'
  | 'programmatic';

export interface NeuSpeedDialItem extends NeuMenuActionLike<NeuSpeedDialItem> {
  key: string;
  label: string;
  data?: unknown;
}

/** Advanced motion options; omitted fields retain the Neural defaults. */
export interface NeuSpeedDialAnimationConfig {
  readonly itemDelay?: number;
  readonly rotateTrigger?: boolean;
}

/** Enables label tooltips globally; item-level `tooltip` text still takes precedence. */
export interface NeuSpeedDialTooltipConfig {
  readonly position?: NeuTooltipPosition;
}

export interface NeuSpeedDialVisibilityEvent {
  readonly originalEvent: Event | null;
  readonly reason: NeuSpeedDialVisibilityReason;
}

export interface NeuSpeedDialItemEvent {
  readonly originalEvent: Event;
  readonly item: NeuSpeedDialItem;
}

export interface NeuSpeedDialItemTemplateContext {
  readonly $implicit: NeuSpeedDialItem;
  readonly index: number;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly open: boolean;
}

export interface NeuSpeedDialTriggerTemplateContext {
  readonly $implicit: boolean;
  readonly open: boolean;
}

@Directive({ selector: 'ng-template[neuSpeedDialItem]' })
export class NeuSpeedDialItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuSpeedDialItemTemplateContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuSpeedDialItemDirective,
    context: unknown,
  ): context is NeuSpeedDialItemTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSpeedDialTrigger]' })
export class NeuSpeedDialTriggerDirective {
  constructor(readonly templateRef: TemplateRef<NeuSpeedDialTriggerTemplateContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuSpeedDialTriggerDirective,
    context: unknown,
  ): context is NeuSpeedDialTriggerTemplateContext {
    return true;
  }
}

@Component({
  selector: 'neu-speed-dial',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    NeuBadgeComponent,
    InternalNeuIconOutletComponent,
    NeuTooltipDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-speed-dial',
    '[class.neu-speed-dial--open]': 'isOpen()',
    '[class.neu-speed-dial--disabled]': 'disabled()',
    '[class.neu-speed-dial--linear]': 'type() === "linear"',
    '[class.neu-speed-dial--circle]': 'type() !== "linear"',
    '[attr.data-direction]': 'direction()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    @if (mask() && isOpen()) {
      <div
        class="neu-speed-dial__mask"
        aria-hidden="true"
        (pointerdown)="onMaskPointerDown($event)"
      ></div>
    }

    <div class="neu-speed-dial__root">
      <ul
        class="neu-speed-dial__list"
        role="menu"
        [id]="listId()"
        [attr.aria-hidden]="!isOpen()"
        [attr.inert]="!isOpen() ? '' : null"
      >
        @for (action of resolvedItems(); track action.key; let index = $index) {
          <li
            class="neu-speed-dial__item"
            role="none"
            [class.neu-speed-dial__item--visible]="isOpen()"
            [style]="itemStyle(index)"
          >
            @if (action.kind === 'router') {
              <a
                class="neu-speed-dial__action"
                [attr.data-neu-speed-index]="index"
                [routerLink]="action.routerLink ?? null"
                role="menuitem"
                [tabIndex]="isOpen() ? itemTabIndex(index) : -1"
                [attr.aria-label]="action.label"
                [attr.aria-disabled]="action.disabled"
                [class.neu-speed-dial__action--active]="action.active"
                [class.neu-speed-dial__action--disabled]="action.disabled"
                [neuTooltip]="tooltipText(action)"
                [neuTooltipDisabled]="!tooltipText(action)"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activateItem($event, action)"
                (keydown)="onActionKeydown($event, index)"
                (focus)="setFocused(index)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="itemContext(action, index)"
                />
              </a>
            } @else if (action.kind === 'external') {
              <a
                class="neu-speed-dial__action"
                [attr.data-neu-speed-index]="index"
                [href]="action.url"
                [target]="action.target"
                [rel]="action.rel"
                role="menuitem"
                [tabIndex]="isOpen() ? itemTabIndex(index) : -1"
                [attr.aria-label]="action.label"
                [attr.aria-disabled]="action.disabled"
                [class.neu-speed-dial__action--active]="action.active"
                [class.neu-speed-dial__action--disabled]="action.disabled"
                [neuTooltip]="tooltipText(action)"
                [neuTooltipDisabled]="!tooltipText(action)"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activateItem($event, action)"
                (keydown)="onActionKeydown($event, index)"
                (focus)="setFocused(index)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="itemContext(action, index)"
                />
              </a>
            } @else {
              <button
                class="neu-speed-dial__action"
                [attr.data-neu-speed-index]="index"
                type="button"
                role="menuitem"
                [disabled]="action.disabled"
                [tabIndex]="isOpen() ? itemTabIndex(index) : -1"
                [attr.aria-label]="action.label"
                [class.neu-speed-dial__action--active]="action.active"
                [neuTooltip]="tooltipText(action)"
                [neuTooltipDisabled]="!tooltipText(action)"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activateItem($event, action)"
                (keydown)="onActionKeydown($event, index)"
                (focus)="setFocused(index)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="itemContext(action, index)"
                />
              </button>
            }
          </li>
        }
      </ul>

      <button
        #trigger
        class="neu-speed-dial__trigger"
        type="button"
        [disabled]="disabled()"
        [tabIndex]="disabled() ? -1 : tabindex()"
        [attr.aria-label]="ariaLabelledBy() ? null : ariaLabel()"
        [attr.aria-labelledby]="ariaLabelledBy()"
        [attr.aria-describedby]="ariaDescribedBy()"
        aria-haspopup="menu"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="listId()"
        (click)="onTriggerClick($event)"
        (keydown)="onTriggerKeydown($event)"
        (blur)="pendingKeyboardFocus.set(null)"
      >
        @if (triggerTemplate(); as template) {
          <ng-container
            [ngTemplateOutlet]="template.templateRef"
            [ngTemplateOutletContext]="triggerContext()"
          />
        } @else {
          <neu-icon-outlet
            class="neu-speed-dial__trigger-icon"
            [class.neu-speed-dial__trigger-icon--rotate]="rotateTrigger() && isOpen()"
            [icon]="iconPlus" [fallbackPath]="iconFallbackPath(iconPlus)"
            size="1.35rem"
            aria-hidden="true"
          />
        }
      </button>
    </div>

    <ng-template #defaultItem let-item let-index="index">
      @if (item.icon) {
        <neu-icon-outlet [icon]="item.icon" [fallbackPath]="iconFallbackPath(item.icon)" size="1.2rem" aria-hidden="true" />
      }
      <span class="neu-speed-dial__label">{{ item.label }}</span>
      @if (item.badge != null) {
        <neu-badge class="neu-speed-dial__badge" size="sm">{{ item.badge }}</neu-badge>
      }
    </ng-template>
  `,
  styleUrl: './neu-speed-dial.component.scss',
})
export class NeuSpeedDialComponent {
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconPlus = iconPlus;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly defaultTemplate =
    viewChild.required<TemplateRef<NeuSpeedDialItemTemplateContext>>('defaultItem');
  protected readonly itemTemplate = contentChild(NeuSpeedDialItemDirective);
  protected readonly triggerTemplate = contentChild(NeuSpeedDialTriggerDirective);
  private readonly controller = new NeuRovingMenuController({ orientation: 'both' });
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-speed-dial-');
  private readonly _isOpen = signal(false);
  protected readonly pendingKeyboardFocus = signal<number | null>(null);
  private previousOwnedOpen: boolean | null = null;
  private pendingOwnedTransition:
    | {
        open: boolean;
        originalEvent: Event | null;
        reason: NeuSpeedDialVisibilityReason;
        restoreFocus: boolean;
      }
    | undefined;

  readonly id = input<string>();
  readonly items = input<readonly NeuSpeedDialItem[]>([]);
  /** Controlled state owner. Null retains ergonomic uncontrolled behavior. */
  readonly openState = input<boolean | null>(null, { alias: 'open' });
  readonly direction = input<NeuSpeedDialDirection>('up');
  readonly type = input<NeuSpeedDialType>('linear');
  readonly radius = input(80, { transform: numberAttribute });
  readonly mask = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hideOnClickOutside = input(true, { transform: booleanAttribute });
  readonly animation = input<Readonly<NeuSpeedDialAnimationConfig>>({});
  readonly tooltip = input<Readonly<NeuSpeedDialTooltipConfig> | null>(null);
  readonly ariaLabel = input<string | null>('Quick actions');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);
  readonly tabindex = input(0, { transform: numberAttribute });

  readonly openChange = output<boolean>();
  readonly triggerClick = output<MouseEvent>();
  readonly itemActivate = output<NeuSpeedDialItemEvent>();
  readonly opened = output<NeuSpeedDialVisibilityEvent>();
  readonly closed = output<NeuSpeedDialVisibilityEvent>();

  readonly isOpen = computed(() => this.openState() ?? this._isOpen());
  readonly listId = computed(() => `${this.id() ?? this.generatedId}-list`);
  readonly focusedIndex = signal(-1);
  readonly resolvedItems = computed(() =>
    this.items()
      .map((item, index) => resolveNeuMenuAction(item, index))
      .filter((item) => item.visible && !item.separator),
  );
  protected readonly itemDelay = computed(() => Math.max(0, this.animation().itemDelay ?? 30));
  protected readonly rotateTrigger = computed(() => this.animation().rotateTrigger !== false);

  constructor() {
    afterRenderEffect(() => {
      const index = this.pendingKeyboardFocus();
      if (index === null || !this.isOpen()) return;
      untracked(() => {
        this.pendingKeyboardFocus.set(null);
        const trigger = this.trigger().nativeElement;
        if (trigger.ownerDocument.activeElement !== trigger || this.disabled()) return;
        const target = this.actionElement(index);
        if (target) {
          target.tabIndex = 0;
          target.focus();
        }
      });
    });
    effect(() => {
      const items = this.resolvedItems();
      untracked(() => {
        this.focusedIndex.set(
          this.controller.setItems(
            items.map((item) => ({ key: item.key, label: item.label, disabled: item.disabled })),
          ),
        );
      });
    });
    effect(() => {
      const owned = this.openState();
      if (owned === null) { this.previousOwnedOpen = null; this.pendingOwnedTransition = undefined; return; }
      if (this.previousOwnedOpen === null) { this.previousOwnedOpen = owned; return; }
      if (this.previousOwnedOpen === owned) return;
      this.previousOwnedOpen = owned;
      const pending = this.pendingOwnedTransition?.open === owned ? this.pendingOwnedTransition : null;
      this.pendingOwnedTransition = undefined;
      untracked(() => {
        if (owned) this.opened.emit({ originalEvent: pending?.originalEvent ?? null, reason: pending?.reason ?? 'programmatic' });
        else {
          this.closed.emit({ originalEvent: pending?.originalEvent ?? null, reason: pending?.reason ?? 'programmatic' });
          if (pending?.restoreFocus && isPlatformBrowser(this.platformId)) this.trigger().nativeElement.focus();
        }
      });
    });
    effect(() => {
      if (this.disabled() && this.isOpen()) {
        untracked(() => this.closeWithReason(null, 'disabled'));
      }
    });
  }

  /** Opens the menu, or proposes open state to a controlled owner. */
  open(): void {
    this.openWithReason(null, 'programmatic');
  }

  /** Closes the menu, or proposes closed state to a controlled owner. */
  close(): void {
    this.closeWithReason(null, 'programmatic');
  }

  /** Toggles the menu through the canonical open-state owner. */
  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  protected itemTemplateRef(): TemplateRef<NeuSpeedDialItemTemplateContext> {
    return this.itemTemplate()?.templateRef ?? this.defaultTemplate();
  }

  protected itemContext(
    action: NeuResolvedMenuAction<NeuSpeedDialItem>,
    index: number,
  ): NeuSpeedDialItemTemplateContext {
    return {
      $implicit: action.original,
      index,
      active: action.active,
      disabled: action.disabled,
      open: this.isOpen(),
    };
  }

  protected triggerContext(): NeuSpeedDialTriggerTemplateContext {
    return { $implicit: this.isOpen(), open: this.isOpen() };
  }

  protected itemTabIndex(index: number): number {
    return this.controller.tabIndexFor(index);
  }

  protected tooltipText(action: NeuResolvedMenuAction<NeuSpeedDialItem>): string {
    return action.tooltip ?? (this.tooltip() ? action.label : '');
  }

  protected tooltipPosition(): NeuTooltipPosition {
    const explicit = this.tooltip()?.position;
    if (explicit) return explicit;
    return this.direction() === 'left' || this.direction().startsWith('up') ? 'top' : 'right';
  }

  protected onTriggerClick(event: MouseEvent): void {
    this.pendingKeyboardFocus.set(null);
    event.stopPropagation();
    this.triggerClick.emit(event);
    if (this.disabled()) return;
    this.isOpen()
      ? this.closeWithReason(event, 'trigger')
      : this.openWithReason(event, 'trigger');
  }

  protected activateItem(
    event: Event,
    action: NeuResolvedMenuAction<NeuSpeedDialItem>,
  ): void {
    event.stopPropagation();
    if (!activateNeuMenuAction(action, event)) return;
    this.itemActivate.emit({ originalEvent: event, item: action.original });
    this.closeWithReason(event, 'item', true);
  }

  protected setFocused(index: number): void {
    this.controller.setActiveIndex(index);
    this.focusedIndex.set(this.controller.index);
  }

  protected onActionKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeWithReason(event, 'escape', true);
      return;
    }
    this.configureTextDirection();
    this.controller.setActiveIndex(index);
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    this.focusedIndex.set(result.activeIndex);
    const target = this.actionElement(result.activeIndex);
    if (result.activate) {
      target?.click();
      return;
    }
    if (target) {
      (event.currentTarget as HTMLElement).tabIndex = -1;
      target.tabIndex = 0;
      target.focus();
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.disabled()) return;
      const wasOpen = this.isOpen();
      if (!this.isOpen()) this.openWithReason(event, 'trigger');
      const candidates = this.resolvedItems()
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !item.disabled);
      const boundary = event.key === 'ArrowDown' ? candidates[0] : candidates.at(-1);
      if (!boundary) return;
      this.setFocused(boundary.index);
      if (!wasOpen) {
        this.pendingKeyboardFocus.set(boundary.index);
        return;
      }
      const target = this.actionElement(boundary.index);
      if (target) {
        target.tabIndex = 0;
        target.focus();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeWithReason(event, 'escape', true);
    }
  }

  protected onMaskPointerDown(event: PointerEvent): void {
    event.stopPropagation();
    this.closeWithReason(event, 'mask');
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen() || !this.hideOnClickOutside()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeWithReason(event, 'outside');
    }
  }

  protected itemStyle(index: number): Record<string, string> {
    const delay = this.isOpen()
      ? index * this.itemDelay()
      : (this.resolvedItems().length - index - 1) * this.itemDelay();
    if (this.type() === 'linear') {
      return { '--neu-speed-delay': `${delay}ms`, '--neu-speed-index': `${index}` };
    }
    const count = this.resolvedItems().length;
    const { start, sweep } = this.arc();
    const angle =
      count <= 1 ? start : start + (sweep * index) / (count - (this.type() === 'circle' ? 0 : 1));
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * this.radius();
    const y = Math.sin(radians) * this.radius();
    return {
      '--neu-speed-x': `${x.toFixed(2)}px`,
      '--neu-speed-y': `${y.toFixed(2)}px`,
      '--neu-speed-delay': `${delay}ms`,
    };
  }

  private openWithReason(
    originalEvent: Event | null,
    reason: NeuSpeedDialVisibilityReason,
  ): void {
    if (this.disabled() || this.isOpen()) return;
    if (this.proposeOwnedState(true, originalEvent, reason, false)) return;
    this.commitOpen(originalEvent, reason);
    this.openChange.emit(true);
  }

  private closeWithReason(
    originalEvent: Event | null,
    reason: NeuSpeedDialVisibilityReason,
    restoreFocus = false,
  ): void {
    this.pendingKeyboardFocus.set(null);
    if (!this.isOpen()) return;
    if (this.proposeOwnedState(false, originalEvent, reason, restoreFocus)) return;
    this.commitClose(originalEvent, reason, restoreFocus);
    this.openChange.emit(false);
  }

  private proposeOwnedState(
    open: boolean,
    originalEvent: Event | null,
    reason: NeuSpeedDialVisibilityReason,
    restoreFocus: boolean,
  ): boolean {
    const owner = this.openState();
    if (owner === null) return false;
    this.pendingOwnedTransition = { open, originalEvent, reason, restoreFocus };
    if (owner !== open) this.openChange.emit(open);
    return true;
  }

  private commitOpen(
    originalEvent: Event | null,
    reason: NeuSpeedDialVisibilityReason,
  ): void {
    if (this.disabled() || this._isOpen()) return;
    this._isOpen.set(true);
    this.opened.emit({ originalEvent, reason });
  }

  private commitClose(
    originalEvent: Event | null,
    reason: NeuSpeedDialVisibilityReason,
    restoreFocus: boolean,
  ): void {
    if (!this._isOpen()) return;
    this._isOpen.set(false);
    this.closed.emit({ originalEvent, reason });
    if (restoreFocus && isPlatformBrowser(this.platformId)) this.trigger().nativeElement.focus();
  }

  private configureTextDirection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const direction = this.host.nativeElement.ownerDocument.defaultView?.getComputedStyle(
      this.host.nativeElement,
    ).direction;
    this.controller.configure({ direction: direction === 'rtl' ? 'rtl' : 'ltr' });
  }

  private actionElement(index: number): HTMLElement | null {
    return this.host.nativeElement.querySelector(`[data-neu-speed-index="${index}"]`);
  }

  private arc(): { start: number; sweep: number } {
    const direction = this.direction();
    if (this.type() === 'circle') return { start: -90, sweep: 360 };
    if (this.type() === 'semi-circle') {
      if (direction === 'down') return { start: 0, sweep: 180 };
      if (direction === 'left') return { start: 90, sweep: 180 };
      if (direction === 'right') return { start: -90, sweep: 180 };
      return { start: 180, sweep: 180 };
    }
    const starts: Record<string, number> = {
      'up-left': 180,
      'up-right': 270,
      'down-left': 90,
      'down-right': 0,
      up: 225,
      down: 45,
      left: 135,
      right: -45,
    };
    return { start: starts[direction] ?? 270, sweep: 90 };
  }
}
