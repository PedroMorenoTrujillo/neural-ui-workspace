import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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

export type NeuDockPosition = 'top' | 'right' | 'bottom' | 'left';

export interface NeuDockItem extends NeuMenuActionLike<NeuDockItem> {
  key: string;
  label: string;
  data?: unknown;
}

export interface NeuDockItemTemplateContext {
  $implicit: NeuDockItem;
  index: number;
  active: boolean;
}

@Directive({ selector: 'ng-template[neuDockItem]' })
export class NeuDockItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuDockItemTemplateContext>) {}
}

@Component({
  selector: 'neu-dock',
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
    class: 'neu-dock',
    '[class.neu-dock--top]': 'position() === "top"',
    '[class.neu-dock--right]': 'position() === "right"',
    '[class.neu-dock--bottom]': 'position() === "bottom"',
    '[class.neu-dock--left]': 'position() === "left"',
    '[class.neu-dock--mobile]': 'mobile()',
    '[class.neu-dock--magnify]': 'magnification() && !coarsePointer()',
    '[attr.dir]': 'direction()',
  },
  template: `
    <nav
      class="neu-dock__container"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
    >
      <ul
        class="neu-dock__list"
        role="menubar"
        [attr.aria-orientation]="orientation()"
        (mouseleave)="hoveredIndex.set(-1)"
      >
        @for (action of resolvedItems(); track action.key; let index = $index) {
          <li
            class="neu-dock__item"
            role="none"
            [class.neu-dock__item--hovered]="hoveredIndex() === index"
            [class.neu-dock__item--neighbor]="
              hoveredIndex() >= 0 && Math.abs(hoveredIndex() - index) === 1
            "
            (mouseenter)="hoveredIndex.set(index)"
          >
            @if (action.kind === 'router') {
              <a
                #dockAction
                class="neu-dock__action"
                routerLinkActive="neu-dock__action--router-active"
                [routerLinkActiveOptions]="{ exact: false }"
                [routerLink]="action.routerLink ?? null"
                role="menuitem"
                [class.neu-dock__action--active]="action.active"
                [class.neu-dock__action--disabled]="action.disabled"
                [attr.aria-current]="action.active ? 'page' : null"
                [attr.aria-disabled]="action.disabled"
                [attr.tabindex]="tabIndex(index)"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipDisabled]="coarsePointer()"
                (click)="activate($event, action)"
                (keydown)="onKeydown($event, index)"
                (focus)="onActionFocus($event, index)"
                (blur)="itemBlur.emit($event)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(action, index)"
                />
              </a>
            } @else if (action.kind === 'external') {
              <a
                #dockAction
                class="neu-dock__action"
                [href]="action.url"
                [target]="action.target"
                [rel]="action.rel"
                role="menuitem"
                [class.neu-dock__action--active]="action.active"
                [class.neu-dock__action--disabled]="action.disabled"
                [attr.aria-current]="action.active ? 'page' : null"
                [attr.aria-disabled]="action.disabled"
                [attr.tabindex]="tabIndex(index)"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipDisabled]="coarsePointer()"
                (click)="activate($event, action)"
                (keydown)="onKeydown($event, index)"
                (focus)="onActionFocus($event, index)"
                (blur)="itemBlur.emit($event)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(action, index)"
                />
              </a>
            } @else {
              <button
                #dockAction
                type="button"
                class="neu-dock__action"
                role="menuitem"
                [disabled]="action.disabled"
                [class.neu-dock__action--active]="action.active"
                [attr.aria-current]="action.active ? 'page' : null"
                [attr.tabindex]="tabIndex(index)"
                [neuTooltip]="action.tooltip ?? action.label"
                [neuTooltipDisabled]="coarsePointer()"
                (click)="activate($event, action)"
                (keydown)="onKeydown($event, index)"
                (focus)="onActionFocus($event, index)"
                (blur)="itemBlur.emit($event)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(action, index)"
                />
              </button>
            }
          </li>
        }
      </ul>
    </nav>

    <ng-template #defaultItem let-item let-index="index" let-active="active">
      @if (item.icon) {
        <neu-icon class="neu-dock__icon" [name]="item.icon" size="1.5rem" aria-hidden="true" />
      } @else {
        <span class="neu-dock__fallback" aria-hidden="true">{{ item.label.slice(0, 1) }}</span>
      }
      <span class="neu-dock__label">{{ item.label }}</span>
      @if (item.badge != null) {
        <neu-badge class="neu-dock__badge" size="sm">{{ item.badge }}</neu-badge>
      }
    </ng-template>
  `,
  styleUrl: './neu-dock.component.scss',
})
export class NeuDockComponent {
  protected readonly Math = Math;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actions = viewChildren<ElementRef<HTMLElement>>('dockAction');
  private readonly itemTemplate = contentChild(NeuDockItemDirective);
  private readonly defaultTemplate =
    viewChild.required<TemplateRef<NeuDockItemTemplateContext>>('defaultItem');
  private readonly controller = new NeuRovingMenuController({ orientation: 'horizontal' });
  private mediaCleanup: (() => void) | null = null;

  readonly items = input<NeuDockItem[]>([]);
  readonly position = input<NeuDockPosition>('bottom');
  readonly breakpoint = input('960px');
  readonly ariaLabel = input('Application dock');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly magnification = input(true, { transform: booleanAttribute });
  readonly direction = input<NeuTextDirection>('ltr');

  readonly itemClick = output<NeuDockItem>();
  readonly itemFocus = output<FocusEvent>();
  readonly itemBlur = output<FocusEvent>();

  readonly mobile = signal(false);
  readonly coarsePointer = signal(false);
  readonly hoveredIndex = signal(-1);
  readonly activeIndex = signal(-1);
  readonly orientation = computed(() =>
    this.position() === 'left' || this.position() === 'right' ? 'vertical' : 'horizontal',
  );
  readonly resolvedItems = computed(() =>
    this.items()
      .map((item, index) => resolveNeuMenuAction(item, index))
      .filter((item) => item.visible && !item.separator),
  );

  constructor() {
    effect(() => {
      const resolved = this.resolvedItems();
      this.controller.configure({ orientation: this.orientation(), direction: this.direction() });
      this.activeIndex.set(
        this.controller.setItems(
          resolved.map((item) => ({
            key: item.key,
            label: item.label,
            disabled: item.disabled,
            hidden: !item.visible,
            separator: item.separator,
          })),
        ),
      );
    });
    effect(() => this.bindMedia(this.breakpoint()));
    this.destroyRef.onDestroy(() => this.mediaCleanup?.());
  }

  itemTemplateRef(): TemplateRef<NeuDockItemTemplateContext> {
    return this.itemTemplate()?.templateRef ?? this.defaultTemplate();
  }

  templateContext(
    action: NeuResolvedMenuAction<NeuDockItem>,
    index: number,
  ): NeuDockItemTemplateContext {
    return { $implicit: action.original, index, active: action.active };
  }

  tabIndex(index: number): number {
    return this.controller.tabIndexFor(index);
  }

  activate(event: Event, action: NeuResolvedMenuAction<NeuDockItem>): void {
    if (activateNeuMenuAction(action, event)) this.itemClick.emit(action.original);
  }

  onActionFocus(event: FocusEvent, index: number): void {
    this.controller.setActiveIndex(index);
    this.activeIndex.set(this.controller.index);
    this.itemFocus.emit(event);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    this.controller.setActiveIndex(index);
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    this.activeIndex.set(result.activeIndex);
    const target = this.actions()[result.activeIndex]?.nativeElement;
    if (result.activate) target?.click();
    else target?.focus();
  }

  private bindMedia(breakpoint: string): void {
    this.mediaCleanup?.();
    this.mediaCleanup = null;
    if (!isPlatformBrowser(this.platformId) || typeof window.matchMedia !== 'function') return;
    const compact = window.matchMedia(`(max-width: ${breakpoint})`);
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => {
      this.mobile.set(compact.matches);
      this.coarsePointer.set(coarse.matches);
    };
    const listen = (query: MediaQueryList): (() => void) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
      }
      if (typeof query.addListener === 'function') {
        query.addListener(update);
        return () => query.removeListener(update);
      }
      return () => undefined;
    };
    const removeCompact = listen(compact);
    const removeCoarse = listen(coarse);
    update();
    this.mediaCleanup = () => {
      removeCompact();
      removeCoarse();
    };
  }
}
