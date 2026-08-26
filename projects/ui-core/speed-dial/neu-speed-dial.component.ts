import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NeuBadgeComponent } from '@neural-ui/core/badge';
import { NeuIconComponent } from '@neural-ui/core/icon';
import {
  NeuMenuActionLike,
  NeuResolvedMenuAction,
  NeuRovingMenuController,
  NeuTextDirection,
  activateNeuMenuAction,
  resolveNeuMenuAction,
} from '@neural-ui/core/menu-foundation';
import { NeuTooltipDirective } from '@neural-ui/core/tooltip';

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

export interface NeuSpeedDialItem extends NeuMenuActionLike<NeuSpeedDialItem> {
  key: string;
  label: string;
  data?: unknown;
}

export interface NeuSpeedDialItemTemplateContext {
  $implicit: NeuSpeedDialItem;
  index: number;
  active: boolean;
  toggleCallback: (event: Event) => void;
}

export interface NeuSpeedDialTriggerTemplateContext {
  visible: boolean;
  toggleCallback: (event: MouseEvent) => void;
}

@Directive({ selector: 'ng-template[neuSpeedDialItem]' })
export class NeuSpeedDialItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuSpeedDialItemTemplateContext>) {}
}

@Directive({ selector: 'ng-template[neuSpeedDialTrigger]' })
export class NeuSpeedDialTriggerDirective {
  constructor(readonly templateRef: TemplateRef<NeuSpeedDialTriggerTemplateContext>) {}
}

let speedDialSequence = 0;

@Component({
  selector: 'neu-speed-dial',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    NeuBadgeComponent,
    NeuIconComponent,
    NeuTooltipDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-speed-dial',
    '[class.neu-speed-dial--open]': 'visible()',
    '[class.neu-speed-dial--disabled]': 'disabled()',
    '[class.neu-speed-dial--linear]': 'type() === "linear"',
    '[class.neu-speed-dial--circle]': 'type() !== "linear"',
    '[attr.data-direction]': 'direction()',
    '[attr.dir]': 'textDirection()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    @if (mask() && visible()) {
      <div
        class="neu-speed-dial__mask"
        aria-hidden="true"
        (pointerdown)="$event.stopPropagation(); hide(true)"
      ></div>
    }

    <div class="neu-speed-dial__root">
      <ul
        class="neu-speed-dial__list"
        role="menu"
        [id]="listId()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-hidden]="!visible()"
      >
        @for (action of resolvedItems(); track action.key; let index = $index) {
          <li
            class="neu-speed-dial__item"
            role="none"
            [class.neu-speed-dial__item--visible]="visible()"
            [style]="itemStyle(index)"
          >
            @if (action.kind === 'router') {
              <a
                #speedAction
                class="neu-speed-dial__action"
                routerLinkActive="neu-speed-dial__action--router-active"
                [routerLink]="action.routerLink ?? null"
                role="menuitem"
                [tabIndex]="visible() ? tabIndex(index) : -1"
                [attr.aria-disabled]="action.disabled"
                [class.neu-speed-dial__action--active]="action.active"
                [class.neu-speed-dial__action--disabled]="action.disabled"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activate($event, action)"
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
                #speedAction
                class="neu-speed-dial__action"
                [href]="action.url"
                [target]="action.target"
                [rel]="action.rel"
                role="menuitem"
                [tabIndex]="visible() ? tabIndex(index) : -1"
                [attr.aria-disabled]="action.disabled"
                [class.neu-speed-dial__action--active]="action.active"
                [class.neu-speed-dial__action--disabled]="action.disabled"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activate($event, action)"
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
                #speedAction
                class="neu-speed-dial__action"
                type="button"
                role="menuitem"
                [disabled]="action.disabled"
                [tabIndex]="visible() ? tabIndex(index) : -1"
                [class.neu-speed-dial__action--active]="action.active"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipPosition]="tooltipPosition()"
                (click)="activate($event, action)"
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
        [attr.aria-label]="ariaLabel()"
        aria-haspopup="menu"
        [attr.aria-expanded]="visible()"
        [attr.aria-controls]="listId()"
        (click)="toggle($event)"
        (keydown)="onTriggerKeydown($event)"
      >
        @if (triggerTemplate()) {
          <ng-container
            [ngTemplateOutlet]="triggerTemplate()!.templateRef"
            [ngTemplateOutletContext]="triggerContext()"
          />
        } @else {
          <neu-icon
            class="neu-speed-dial__trigger-icon"
            [class.neu-speed-dial__trigger-icon--rotate]="
              rotateAnimation() && visible() && !hideIcon()
            "
            [name]="visible() && hideIcon() ? hideIcon()! : showIcon()"
            size="1.35rem"
            aria-hidden="true"
          />
        }
      </button>
    </div>

    <ng-template #defaultItem let-item let-index="index">
      @if (item.icon) {
        <neu-icon [name]="item.icon" size="1.2rem" aria-hidden="true" />
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly actions = viewChildren<ElementRef<HTMLElement>>('speedAction');
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly defaultTemplate =
    viewChild.required<TemplateRef<NeuSpeedDialItemTemplateContext>>('defaultItem');
  protected readonly itemTemplate = contentChild(NeuSpeedDialItemDirective);
  protected readonly triggerTemplate = contentChild(NeuSpeedDialTriggerDirective);
  private readonly controller = new NeuRovingMenuController({ orientation: 'both' });
  private readonly generatedId = `neu-speed-dial-${++speedDialSequence}`;

  readonly id = input<string>();
  readonly items = input<NeuSpeedDialItem[]>([]);
  readonly visible = model(false);
  readonly direction = input<NeuSpeedDialDirection>('up');
  readonly type = input<NeuSpeedDialType>('linear');
  readonly transitionDelay = input(30, { transform: numberAttribute });
  readonly radius = input(80, { transform: numberAttribute });
  readonly mask = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hideOnClickOutside = input(true, { transform: booleanAttribute });
  readonly showIcon = input('lucidePlus');
  readonly hideIcon = input<string | null>(null);
  readonly rotateAnimation = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input('Quick actions');
  readonly textDirection = input<NeuTextDirection>('ltr');

  readonly onVisibleChange = output<boolean>();
  readonly onTriggerClick = output<MouseEvent>();
  readonly itemClick = output<NeuSpeedDialItem>();
  readonly onShow = output<void>();
  readonly onHide = output<void>();

  readonly listId = computed(() => `${this.id() ?? this.generatedId}-list`);
  readonly focusedIndex = signal(-1);
  readonly resolvedItems = computed(() =>
    this.items()
      .map((item, index) => resolveNeuMenuAction(item, index))
      .filter((item) => item.visible && !item.separator),
  );

  constructor() {
    effect(() => {
      const items = this.resolvedItems();
      this.controller.configure({ direction: this.textDirection() });
      this.focusedIndex.set(
        this.controller.setItems(
          items.map((item) => ({ key: item.key, label: item.label, disabled: item.disabled })),
        ),
      );
    });
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
      toggleCallback: (event) => this.activate(event, action),
    };
  }

  protected triggerContext(): NeuSpeedDialTriggerTemplateContext {
    return { visible: this.visible(), toggleCallback: (event) => this.toggle(event) };
  }

  protected tabIndex(index: number): number {
    return this.controller.tabIndexFor(index);
  }

  protected tooltipPosition(): 'top' | 'right' | 'bottom' | 'left' {
    if (this.direction().startsWith('down')) return 'right';
    if (this.direction().startsWith('up')) return 'right';
    return this.direction() === 'left' ? 'top' : 'top';
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.onTriggerClick.emit(event);
    if (this.disabled()) return;
    this.visible() ? this.hide(false) : this.show();
  }

  show(): void {
    if (this.disabled() || this.visible()) return;
    this.visible.set(true);
    this.onVisibleChange.emit(true);
    this.onShow.emit();
  }

  hide(restoreFocus = false): void {
    if (!this.visible()) return;
    this.visible.set(false);
    this.onVisibleChange.emit(false);
    this.onHide.emit();
    if (restoreFocus && isPlatformBrowser(this.platformId)) this.trigger().nativeElement.focus();
  }

  activate(event: Event, action: NeuResolvedMenuAction<NeuSpeedDialItem>): void {
    event.stopPropagation();
    if (!activateNeuMenuAction(action, event)) return;
    this.itemClick.emit(action.original);
    this.hide(true);
  }

  setFocused(index: number): void {
    this.controller.setActiveIndex(index);
    this.focusedIndex.set(this.controller.index);
  }

  onActionKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide(true);
      return;
    }
    this.controller.setActiveIndex(index);
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    this.focusedIndex.set(result.activeIndex);
    const target = this.actions()[result.activeIndex]?.nativeElement;
    result.activate ? target?.click() : target?.focus();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      if (!this.visible()) this.show();
      this.actions()[this.controller.index]?.nativeElement.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.hide(true);
    }
  }

  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.visible() || !this.hideOnClickOutside()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.hide(true);
  }

  itemStyle(index: number): Record<string, string> {
    const delay = this.visible()
      ? index * this.transitionDelay()
      : (this.resolvedItems().length - index - 1) * this.transitionDelay();
    if (this.type() === 'linear')
      return { '--neu-speed-delay': `${delay}ms`, '--neu-speed-index': `${index}` };
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
