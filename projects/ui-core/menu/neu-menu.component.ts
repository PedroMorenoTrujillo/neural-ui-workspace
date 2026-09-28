import {
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, OverlayModule } from '@angular/cdk/overlay';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { InternalNeuIconOutletComponent } from '@neural-ui/core/icon-outlet-internal';
import { NeuIdGenerator, NeuRovingMenuController } from '@neural-ui/core/internal';
import { NeuMenuItemDirective, type NeuMenuItem } from '@neural-ui/core/menu-shared';
import {
  NEU_OVERLAY_DISMISS_GUARD,
  allowsNeuOverlayDismissal,
  type NeuOverlayDismissReason,
} from '@neural-ui/core/foundation';

@Component({
  selector: 'neu-menu',
  imports: [NeuButtonComponent, InternalNeuIconOutletComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-menu' },
  template: `
    <div class="neu-menu__list" role="menu" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.key; let index = $index) {
        @if (item.visible !== false && item.separator) {
          <div class="neu-menu__separator" role="separator"></div>
        } @else if (item.visible !== false) {
          <button
            neu-button
            type="button"
            role="menuitem"
            class="neu-menu__item"
            tone="neutral" variant="ghost"
            size="sm"
            [disabled]="!!item.disabled"
            [tabIndex]="tabIndexFor(index)"
            [attr.data-neu-menu-index]="index"
            [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
            [attr.aria-expanded]="item.children?.length ? isExpanded(item) : null"
            (focus)="setActiveIndex(index)"
            (keydown)="onItemKeydown(item, index, $event)"
            (click)="activate(item, $event)"
          >
            @if (itemTemplateRef(); as itemTemplate) {
              <span class="neu-menu__custom-content">
                <ng-container
                  [ngTemplateOutlet]="itemTemplate"
                  [ngTemplateOutletContext]="{ $implicit: item }"
                />
              </span>
            } @else {
              @if (item.icon) {
                <neu-icon-outlet
                  class="neu-menu__icon"
                  [icon]="item.icon"
                  size="1rem"
                  aria-hidden="true"
                />
              }
              <span class="neu-menu__label">{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd class="neu-menu__shortcut">{{ item.shortcut }}</kbd>
              }
            }
            @if (item.children?.length) {
              <span class="neu-menu__chevron" aria-hidden="true">›</span>
            }
          </button>
          @if (item.children?.length && isExpanded(item)) {
            <div class="neu-menu__child">
              <neu-menu
                [items]="item.children"
                [ariaLabel]="item.label"
                [itemTemplate]="itemTemplateRef()"
                [expandedKeys]="effectiveExpandedKeys()"
                (expandedKeysChange)="onChildExpansionChange($event)"
                (itemClick)="itemClick.emit($event)"
              />
            </div>
          }
        }
      }
    </div>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuMenuComponent {
  /* v8 ignore start -- Angular signal-query factory; projected-item behavior is covered. */
  readonly itemTpl = contentChild(NeuMenuItemDirective);
  /* v8 ignore stop */
  readonly itemTemplate = input<TemplateRef<{ $implicit: NeuMenuItem }> | null>(null);
  readonly itemTemplateRef = computed(
    () => this.itemTemplate() ?? this.itemTpl()?.templateRef ?? null,
  );
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Menu');
  /** Presence makes inline hierarchy expansion consumer-authoritative. */
  readonly expandedKeys = input<readonly string[] | undefined>(undefined);
  readonly expandedKeysChange = output<string[]>();
  readonly itemClick = output<NeuMenuItem>();
  private readonly collapsedKeys = signal<ReadonlySet<string>>(new Set());
  readonly branchKeys = computed(() => collectMenuBranchKeys(this.items()));
  readonly effectiveExpandedKeys = computed<readonly string[]>(
    () => this.expandedKeys() ?? this.branchKeys().filter((key) => !this.collapsedKeys().has(key)),
  );
  private readonly effectiveExpandedKeySet = computed(() => new Set(this.effectiveExpandedKeys()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly controller = new NeuRovingMenuController({ orientation: 'vertical' });
  private lastItems: readonly NeuMenuItem[] | null = null;

  tabIndexFor(index: number): 0 | -1 {
    this.reconcileItems();
    return this.controller.tabIndexFor(index);
  }

  setActiveIndex(index: number): void {
    this.reconcileItems();
    this.controller.setActiveIndex(index);
  }

  onItemKeydown(item: NeuMenuItem, index: number, event: KeyboardEvent): void {
    this.reconcileItems();
    this.controller.setActiveIndex(index);

    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    const openKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === openKey && item.children?.length) {
      event.preventDefault();
      if (!this.isExpanded(item)) {
        this.toggleExpanded(item);
        return;
      }
      const child = (
        event.currentTarget as HTMLElement
      ).nextElementSibling?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
      child?.focus();
      return;
    }
    if (event.key === closeKey) {
      if (item.children?.length && this.isExpanded(item)) {
        event.preventDefault();
        this.toggleExpanded(item);
        return;
      }
      const parent = (event.currentTarget as HTMLElement).closest('.neu-menu__child')
        ?.previousElementSibling as HTMLElement | null;
      if (parent) {
        event.preventDefault();
        parent.focus();
        return;
      }
    }

    this.controller.configure({ direction: direction === 'rtl' ? 'rtl' : 'ltr' });
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    if (result.activate) {
      this.activate(item, event);
      return;
    }
    this.focusActiveItem();
  }

  activate(item: NeuMenuItem, originalEvent?: Event): void {
    if (!item.disabled) {
      if (item.children?.length) {
        this.toggleExpanded(item);
        return;
      }
      item.command?.({ originalEvent: originalEvent ?? new Event('menuitemactivate'), item });
      this.itemClick.emit(item);
    }
  }

  isExpanded(item: NeuMenuItem): boolean {
    return !!item.children?.length && this.effectiveExpandedKeySet().has(item.key);
  }

  toggleExpanded(item: NeuMenuItem): void {
    if (!item.children?.length || item.disabled) return;
    const next = new Set(this.effectiveExpandedKeys());
    if (next.has(item.key)) next.delete(item.key);
    else next.add(item.key);
    this.applyExpansionProposal([...next]);
  }

  onChildExpansionChange(keys: string[]): void {
    this.applyExpansionProposal(keys);
  }

  private applyExpansionProposal(keys: string[]): void {
    if (this.expandedKeys() === undefined) {
      const expanded = new Set(keys);
      this.collapsedKeys.set(new Set(this.branchKeys().filter((key) => !expanded.has(key))));
    }
    this.expandedKeysChange.emit(keys);
  }

  private reconcileItems(): void {
    const items = this.items();
    if (items === this.lastItems) return;
    this.lastItems = items;
    this.controller.setItems(
      items.map((item) => ({
        key: item.key,
        label: item.label,
        disabled: item.disabled,
        hidden: item.visible === false,
        separator: item.separator,
      })),
    );
  }

  private focusActiveItem(): void {
    this.host
      .querySelector<HTMLElement>(
        `:scope > .neu-menu__list > [data-neu-menu-index="${this.controller.index}"]`,
      )
      ?.focus();
  }
}

@Component({
  selector: 'neu-menu-button',
  imports: [OverlayModule, NeuButtonComponent, NeuMenuComponent],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-menu-button' },
  template: `
    <button
      neu-button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      #trigger
      type="button"
      class="neu-menu-button__trigger"
      tone="neutral" variant="ghost"
      size="sm"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId"
      aria-haspopup="menu"
      [disabled]="disabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <ng-content>{{ label() }}</ng-content>
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="requestClose('outside-pointer', $event)"
      (detach)="close()"
      (attach)="onOverlayAttach()"
      (overlayKeydown)="onOverlayKeydown($event)"
    >
      <neu-menu
        class="neu-menu-button__panel"
        [id]="panelId"
        [items]="items()"
        [itemTemplate]="itemTpl()?.templateRef ?? null"
        (itemClick)="onItemClick($event)"
      />
    </ng-template>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuMenuButtonComponent {
  /* v8 ignore start -- Angular signal-query factory; projected-item behavior is covered. */
  readonly itemTpl = contentChild(NeuMenuItemDirective);
  /* v8 ignore stop */
  readonly items = input<NeuMenuItem[]>([]);
  readonly label = input('Menu');
  /** Prevents the trigger from opening the menu and exposes the disabled button state. */
  readonly disabled = input(false);
  readonly itemClick = output<NeuMenuItem>();
  readonly openChange = output<boolean>();
  readonly open = signal(false);
  /* v8 ignore start -- Angular signal-query factories; trigger/overlay behavior is covered. */
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  /* v8 ignore stop */
  protected readonly panelId = inject(NeuIdGenerator).getId('neu-menu-button-panel-');
  private readonly destroyRef = inject(DestroyRef);
  private focusLastOnAttach = false;
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });

  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openMenu(false);
    }
  }

  close(): void {
    if (this.open()) {
      this.open.set(false);
      this.openChange.emit(false);
      queueMicrotask(() => {
        if (!this.destroyRef.destroyed) this.trigger()?.nativeElement.focus({ preventScroll: true });
      });
    }
  }

  requestClose(reason: NeuOverlayDismissReason, event: Event): void {
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'menu',
        reason,
        originalEvent: event,
      })
    )
      return;
    this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.openMenu(event.key === 'ArrowUp');
  }

  onOverlayAttach(): void {
    queueMicrotask(() => {
      if (this.destroyRef.destroyed || !this.open()) return;
      const items = Array.from(
        this.connectedOverlay()?.overlayRef.overlayElement.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([disabled])',
        ) ?? [],
      );
      (this.focusLastOnAttach ? items.at(-1) : items[0])?.focus({ preventScroll: true });
      this.focusLastOnAttach = false;
    });
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose('escape', event);
    }
  }

  onItemClick(item: NeuMenuItem): void {
    this.itemClick.emit(item);
    this.close();
  }

  private openMenu(focusLast: boolean): void {
    if (this.open() || this.disabled()) return;
    this.focusLastOnAttach = focusLast;
    this.open.set(true);
    this.openChange.emit(true);
  }
}

@Component({
  selector: 'neu-menubar',
  imports: [NeuButtonComponent, NeuMenuButtonComponent, NeuMenuItemDirective, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-menubar' },
  template: `
    <nav
      class="neu-menubar__list"
      role="menubar"
      aria-orientation="horizontal"
      [attr.aria-label]="ariaLabel()"
      (keydown)="onKeydown($event)"
      (focusin)="onFocusin($event)"
    >
      @for (item of items(); track item.key; let index = $index) {
        @if (item.visible !== false && item.separator) {
          <span class="neu-menubar__separator" role="separator"></span>
        } @else if (item.visible !== false && item.children?.length) {
          <neu-menu-button
            #branchButton
            role="none"
            [attr.data-neu-menubar-index]="index"
            [items]="item.children"
            [label]="item.label"
            [disabled]="!!item.disabled"
            (pointerenter)="onBranchHover(branchButton)"
            (openChange)="onBranchOpenChange(branchButton, $event)"
            (itemClick)="itemClick.emit($event)"
          >
            @if (itemTpl(); as itemTemplate) {
              <ng-container
                [ngTemplateOutlet]="itemTemplate.templateRef"
                [ngTemplateOutletContext]="{ $implicit: item }"
              />
              <ng-template neuMenuItem let-childItem>
                <ng-container
                  [ngTemplateOutlet]="itemTemplate.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: childItem }"
                />
              </ng-template>
            } @else {
              {{ item.label }}
            }
          </neu-menu-button>
        } @else if (item.visible !== false) {
          <button
            neu-button
            type="button"
            class="neu-menubar__item"
            tone="neutral" variant="ghost"
            size="sm"
            role="menuitem"
            [attr.data-neu-menubar-index]="index"
            [disabled]="!!item.disabled"
            (click)="activate(item, $event)"
          >
            @if (itemTpl(); as itemTemplate) {
              <ng-container
                [ngTemplateOutlet]="itemTemplate.templateRef"
                [ngTemplateOutletContext]="{ $implicit: item }"
              />
            } @else {
              {{ item.label }}
            }
          </button>
        }
      }
    </nav>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuMenubarComponent {
  /* v8 ignore start -- Angular signal-query factory; projected-item behavior is covered. */
  readonly itemTpl = contentChild(NeuMenuItemDirective);
  /* v8 ignore stop */
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Menu bar');
  readonly itemClick = output<NeuMenuItem>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly controller = new NeuRovingMenuController({ orientation: 'horizontal' });
  private readonly branchButtons = viewChildren(NeuMenuButtonComponent);

  protected onBranchHover(target: NeuMenuButtonComponent): void {
    if (target.disabled() || target.open()) return;
    const opened = this.branchButtons().find((button) => button.open());
    if (!opened) return;
    opened.close();
    target.toggle();
  }

  protected onBranchOpenChange(target: NeuMenuButtonComponent, open: boolean): void {
    if (!open) return;
    for (const button of this.branchButtons()) {
      if (button !== target && button.open()) button.close();
    }
  }

  constructor() {
    afterRenderEffect(() => {
      this.items();
      this.reconcile();
    });
  }

  onFocusin(event: FocusEvent): void {
    this.reconcile();
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-neu-menubar-index]');
    const index = Number(target?.dataset['neuMenubarIndex']);
    if (Number.isInteger(index)) this.controller.setActiveIndex(index);
    this.applyTabIndexes();
  }

  onKeydown(event: KeyboardEvent): void {
    const itemElement = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-neu-menubar-index]',
    );
    const index = Number(itemElement?.dataset['neuMenubarIndex']);
    if (!Number.isInteger(index)) return;
    this.reconcile();
    this.controller.setActiveIndex(index);
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    this.controller.configure({ direction: direction === 'rtl' ? 'rtl' : 'ltr' });
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    if (result.activate) {
      (event.target as HTMLElement).click();
      return;
    }
    this.applyTabIndexes();
    this.focusItemAtIndex(result.activeIndex);
  }

  protected activate(item: NeuMenuItem, originalEvent: Event): void {
    if (item.disabled) return;
    item.command?.({ originalEvent, item });
    this.itemClick.emit(item);
  }

  private reconcile(): void {
    this.controller.setItems(
      this.items().map((item) => ({
        key: item.key,
        label: item.label,
        disabled: item.disabled,
        hidden: item.visible === false,
        separator: item.separator,
      })),
    );
    this.applyTabIndexes();
  }

  private itemElements(): HTMLElement[] {
    return Array.from(
      this.host.querySelectorAll<HTMLElement>(
        ':scope > .neu-menubar__list > button, :scope > .neu-menubar__list > neu-menu-button > button',
      ),
    );
  }

  private focusItemAtIndex(index: number): void {
    const owner = this.host.querySelector<HTMLElement>(
      `:scope > .neu-menubar__list > [data-neu-menubar-index="${index}"]`,
    );
    const target = owner?.matches('button') ? owner : owner?.querySelector<HTMLElement>('button');
    target?.focus();
  }

  private applyTabIndexes(): void {
    for (const element of this.itemElements()) {
      const owner = element.matches('[data-neu-menubar-index]') ? element : element.parentElement;
      const index = Number(owner?.dataset['neuMenubarIndex']);
      element.tabIndex = this.controller.tabIndexFor(index);
      element.setAttribute('role', 'menuitem');
    }
  }
}

function collectMenuBranchKeys(items: readonly NeuMenuItem[]): string[] {
  const keys: string[] = [];
  const stack = [...items].reverse();
  while (stack.length) {
    const item = stack.pop()!;
    if (!item.children?.length) continue;
    keys.push(item.key);
    for (let index = item.children.length - 1; index >= 0; index--) {
      stack.push(item.children[index]);
    }
  }
  return keys;
}
