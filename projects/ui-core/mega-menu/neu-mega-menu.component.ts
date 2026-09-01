import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
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
  NeuIdGenerator,
  NeuResponsiveState,
  walkNeuTreeDepthFirst,
} from '@neural-ui/core/internal';
import {
  NeuMenuActionLike,
  NeuResolvedMenuAction,
  NeuRovingMenuController,
  NeuTextDirection,
  activateNeuMenuAction,
  resolveNeuMenuAction,
} from '@neural-ui/core/internal';

export type NeuMegaMenuOrientation = 'horizontal' | 'vertical';

export interface NeuMegaMenuItem extends NeuMenuActionLike<NeuMegaMenuItem> {
  key: string;
  label: string;
  items?: NeuMegaMenuItem[] | NeuMegaMenuItem[][];
  data?: unknown;
}

export interface NeuMegaMenuItemTemplateContext {
  $implicit: NeuMegaMenuItem;
  index: number;
  level: number;
  active: boolean;
}

@Directive({ selector: 'ng-template[neuMegaMenuItem]' })
export class NeuMegaMenuItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuMegaMenuItemTemplateContext>) {}
}

@Directive({ selector: 'ng-template[neuMegaMenuStart]' })
export class NeuMegaMenuStartDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuMegaMenuEnd]' })
export class NeuMegaMenuEndDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

interface ProcessedMegaItem {
  action: NeuResolvedMenuAction<NeuMegaMenuItem>;
  index: number;
  level: number;
  children: ProcessedMegaItem[];
}

interface ProcessedMegaRoot extends ProcessedMegaItem {
  columns: ProcessedMegaItem[][];
}

@Component({
  selector: 'neu-mega-menu',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, NeuBadgeComponent, NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-mega-menu',
    '[class.neu-mega-menu--horizontal]': 'orientation() === "horizontal"',
    '[class.neu-mega-menu--vertical]': 'orientation() === "vertical"',
    '[class.neu-mega-menu--mobile]': 'mobile()',
    '[class.neu-mega-menu--mobile-active]': 'mobileActive()',
    '[class.neu-mega-menu--disabled]': 'disabled()',
    '[attr.dir]': 'direction()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <nav
      class="neu-mega-menu__nav"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
    >
      @if (startTemplate()) {
        <div class="neu-mega-menu__start">
          <ng-container [ngTemplateOutlet]="startTemplate()!.templateRef" />
        </div>
      }

      @if (mobile()) {
        <button
          #menuButton
          class="neu-mega-menu__toggle"
          type="button"
          [attr.aria-label]="menuButtonAriaLabel()"
          [attr.aria-expanded]="mobileActive()"
          [attr.aria-controls]="rootListId()"
          (click)="toggleMobile($event)"
          (keydown.escape)="close(true)"
        >
          <span aria-hidden="true">☰</span>
        </button>
      }

      <ul
        class="neu-mega-menu__root-list"
        [id]="rootListId()"
        role="menubar"
        [attr.aria-orientation]="orientation()"
        [attr.aria-hidden]="mobile() && !mobileActive()"
      >
        @for (root of processedRoots(); track root.action.key; let rootIndex = $index) {
          <li
            class="neu-mega-menu__root-item"
            role="none"
            [class.neu-mega-menu__root-item--active]="activeRootKey() === root.action.key"
          >
            @if (root.columns.length) {
              <button
                #rootAction
                class="neu-mega-menu__root-action"
                type="button"
                role="menuitem"
                [disabled]="disabled() || root.action.disabled"
                [attr.tabindex]="rootTabIndex(rootIndex)"
                aria-haspopup="menu"
                [attr.aria-expanded]="activeRootKey() === root.action.key"
                [attr.aria-controls]="panelId(rootIndex)"
                [class.neu-mega-menu__root-action--active]="root.action.active"
                (click)="toggleRoot($event, root, rootIndex)"
                (mouseenter)="onRootMouseenter(root, rootIndex)"
                (focus)="setRootFocus(rootIndex)"
                (keydown)="onRootKeydown($event, root, rootIndex)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex)"
                />
                <span class="neu-mega-menu__chevron" aria-hidden="true">⌄</span>
              </button>
            } @else if (root.action.kind === 'router') {
              <a
                #rootAction
                class="neu-mega-menu__root-action"
                routerLinkActive="neu-mega-menu__root-action--router-active"
                [routerLink]="root.action.routerLink ?? null"
                role="menuitem"
                [attr.aria-disabled]="disabled() || root.action.disabled"
                [attr.tabindex]="rootTabIndex(rootIndex)"
                [class.neu-mega-menu__root-action--active]="root.action.active"
                (click)="activate($event, root.action)"
                (focus)="setRootFocus(rootIndex)"
                (keydown)="onRootKeydown($event, root, rootIndex)"
                ><ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex)"
              /></a>
            } @else if (root.action.kind === 'external') {
              <a
                #rootAction
                class="neu-mega-menu__root-action"
                [href]="root.action.url"
                [target]="root.action.target"
                [rel]="root.action.rel"
                role="menuitem"
                [attr.aria-disabled]="disabled() || root.action.disabled"
                [attr.tabindex]="rootTabIndex(rootIndex)"
                [class.neu-mega-menu__root-action--active]="root.action.active"
                (click)="activate($event, root.action)"
                (focus)="setRootFocus(rootIndex)"
                (keydown)="onRootKeydown($event, root, rootIndex)"
                ><ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex)"
              /></a>
            } @else {
              <button
                #rootAction
                class="neu-mega-menu__root-action"
                type="button"
                role="menuitem"
                [disabled]="disabled() || root.action.disabled"
                [attr.tabindex]="rootTabIndex(rootIndex)"
                [class.neu-mega-menu__root-action--active]="root.action.active"
                (click)="activate($event, root.action)"
                (focus)="setRootFocus(rootIndex)"
                (keydown)="onRootKeydown($event, root, rootIndex)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex)"
                />
              </button>
            }

            @if (root.columns.length) {
              <div
                class="neu-mega-menu__panel"
                [id]="panelId(rootIndex)"
                role="menu"
                [attr.aria-label]="root.action.label"
                [attr.aria-hidden]="activeRootKey() !== root.action.key"
                [style.max-height]="scrollHeight()"
                (keydown)="onPanelKeydown($event, root, rootIndex)"
              >
                <div class="neu-mega-menu__grid">
                  @for (column of root.columns; track $index) {
                    <ul class="neu-mega-menu__column" role="group">
                      <ng-container
                        [ngTemplateOutlet]="renderItems"
                        [ngTemplateOutletContext]="{ $implicit: column, rootIndex: rootIndex }"
                      />
                    </ul>
                  }
                </div>
              </div>
            }
          </li>
        }
      </ul>

      @if (endTemplate()) {
        <div class="neu-mega-menu__end">
          <ng-container [ngTemplateOutlet]="endTemplate()!.templateRef" />
        </div>
      }
    </nav>

    <ng-template #renderItems let-list let-rootIndex="rootIndex">
      @for (item of list; track item.action.key; let index = $index) {
        @if (item.action.separator) {
          <li class="neu-mega-menu__separator" role="separator"></li>
        } @else if (item.action.visible) {
          <li class="neu-mega-menu__item" role="none">
            @if (item.action.kind === 'router') {
              <a
                class="neu-mega-menu__item-action"
                data-neu-mega-child
                routerLinkActive="neu-mega-menu__item-action--router-active"
                [routerLink]="item.action.routerLink ?? null"
                role="menuitem"
                tabindex="-1"
                [attr.aria-disabled]="item.action.disabled"
                [class.neu-mega-menu__item-action--active]="item.action.active"
                (click)="activate($event, item.action)"
                ><ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(item, index)"
              /></a>
            } @else if (item.action.kind === 'external') {
              <a
                class="neu-mega-menu__item-action"
                data-neu-mega-child
                [href]="item.action.url"
                [target]="item.action.target"
                [rel]="item.action.rel"
                role="menuitem"
                tabindex="-1"
                [attr.aria-disabled]="item.action.disabled"
                [class.neu-mega-menu__item-action--active]="item.action.active"
                (click)="activate($event, item.action)"
                ><ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(item, index)"
              /></a>
            } @else {
              <button
                class="neu-mega-menu__item-action"
                data-neu-mega-child
                type="button"
                role="menuitem"
                tabindex="-1"
                [disabled]="item.action.disabled"
                [attr.aria-haspopup]="item.children.length ? 'menu' : null"
                [attr.aria-expanded]="item.children.length ? true : null"
                [class.neu-mega-menu__item-action--active]="item.action.active"
                (click)="activate($event, item.action)"
              >
                <ng-container
                  [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(item, index)"
                />
              </button>
            }
            @if (item.children.length) {
              <ul class="neu-mega-menu__submenu" role="menu" [attr.aria-label]="item.action.label">
                <ng-container
                  [ngTemplateOutlet]="renderItems"
                  [ngTemplateOutletContext]="{ $implicit: item.children, rootIndex: rootIndex }"
                />
              </ul>
            }
          </li>
        }
      }
    </ng-template>

    <ng-template #defaultItem let-item let-level="level">
      @if (item.icon) {
        <neu-icon class="neu-mega-menu__icon" [name]="item.icon" size="1rem" aria-hidden="true" />
      }
      <span class="neu-mega-menu__label">{{ item.label }}</span>
      @if (item.badge != null) {
        <neu-badge class="neu-mega-menu__badge" size="sm">{{ item.badge }}</neu-badge>
      }
    </ng-template>
  `,
  styleUrl: './neu-mega-menu.component.scss',
})
export class NeuMegaMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly responsive = inject(NeuResponsiveState);
  /* v8 ignore start -- Angular signal-query factories; rendered menu/template behavior is covered. */
  private readonly rootActions = viewChildren<ElementRef<HTMLElement>>('rootAction');
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly defaultTemplate =
    viewChild.required<TemplateRef<NeuMegaMenuItemTemplateContext>>('defaultItem');
  protected readonly itemTemplate = contentChild(NeuMegaMenuItemDirective);
  protected readonly startTemplate = contentChild(NeuMegaMenuStartDirective);
  protected readonly endTemplate = contentChild(NeuMegaMenuEndDirective);
  /* v8 ignore stop */
  private readonly rootController = new NeuRovingMenuController({ orientation: 'horizontal' });
  private readonly childController = new NeuRovingMenuController({ orientation: 'vertical' });
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-mega-menu-');

  readonly id = input<string>();
  readonly items = input<NeuMegaMenuItem[]>([]);
  readonly orientation = input<NeuMegaMenuOrientation>('horizontal');
  readonly breakpoint = input('960px');
  readonly scrollHeight = input('min(28rem, 70vh)');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly tabindex = input(0, { transform: numberAttribute });
  readonly ariaLabel = input('Main navigation');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly menuButtonAriaLabel = input('Toggle navigation');
  readonly direction = input<NeuTextDirection>('ltr');

  readonly itemClick = output<NeuMegaMenuItem>();
  readonly activeItemChange = output<NeuMegaMenuItem | null>();
  readonly mobileActiveChange = output<boolean>();

  readonly mobile = this.responsive.observe(computed(() => `(max-width: ${this.breakpoint()})`));
  readonly mobileActive = signal(false);
  readonly activeRootKey = signal<string | null>(null);
  readonly focusedRootIndex = signal(-1);
  readonly rootListId = computed(() => `${this.id() ?? this.generatedId}-list`);
  readonly processedRoots = computed(() =>
    this.items()
      .map((item, index) => this.processRoot(item, index))
      .filter((item) => item.action.visible),
  );

  constructor() {
    effect(() => {
      const roots = this.processedRoots();
      this.rootController.configure({
        orientation: this.orientation(),
        direction: this.direction(),
      });
      this.focusedRootIndex.set(
        this.rootController.setItems(
          roots.map((root) => ({
            key: root.action.key,
            label: root.action.label,
            disabled: root.action.disabled || this.disabled(),
          })),
        ),
      );
      const activeKey = this.activeRootKey();
      if (
        activeKey &&
        !roots.some((root) => root.action.key === activeKey && !root.action.disabled)
      )
        this.close(false);
    });
  }

  protected itemTemplateRef(): TemplateRef<NeuMegaMenuItemTemplateContext> {
    return this.itemTemplate()?.templateRef ?? this.defaultTemplate();
  }

  protected templateContext(
    item: ProcessedMegaItem,
    index: number,
  ): NeuMegaMenuItemTemplateContext {
    return {
      $implicit: item.action.original,
      index,
      level: item.level,
      active: item.action.active,
    };
  }

  protected panelId(index: number): string {
    return `${this.id() ?? this.generatedId}-panel-${index}`;
  }

  protected rootTabIndex(index: number): number {
    return index === this.rootController.index ? this.tabindex() : -1;
  }

  protected setRootFocus(index: number): void {
    this.rootController.setActiveIndex(index);
    this.focusedRootIndex.set(this.rootController.index);
  }

  toggleRoot(event: Event, root: ProcessedMegaRoot, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled() || root.action.disabled) return;
    const opening = this.activeRootKey() !== root.action.key;
    this.activeRootKey.set(opening ? root.action.key : null);
    this.activeItemChange.emit(opening ? root.action.original : null);
    if (opening) queueMicrotask(() => this.focusFirstChild(root, index));
  }

  activate(event: Event, action: NeuResolvedMenuAction<NeuMegaMenuItem>): void {
    if (this.disabled() || !activateNeuMenuAction(action, event)) return;
    this.itemClick.emit(action.original);
    if (!action.original.items?.length) this.close(false);
  }

  onRootMouseenter(root: ProcessedMegaRoot, index: number): void {
    if (this.activeRootKey() && root.columns.length && !root.action.disabled) {
      this.activeRootKey.set(root.action.key);
      this.setRootFocus(index);
    }
  }

  onRootKeydown(event: KeyboardEvent, root: ProcessedMegaRoot, index: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true, index);
      return;
    }
    const openKey =
      this.orientation() === 'horizontal'
        ? 'ArrowDown'
        : this.direction() === 'rtl'
          ? 'ArrowLeft'
          : 'ArrowRight';
    if (
      root.columns.length &&
      (event.key === openKey || event.key === 'Enter' || event.key === ' ')
    ) {
      this.toggleRoot(event, root, index);
      return;
    }
    this.rootController.setActiveIndex(index);
    const result = this.rootController.handleKey(event);
    if (!result.handled) return;
    this.focusedRootIndex.set(result.activeIndex);
    const target = this.rootActions()[result.activeIndex]?.nativeElement;
    result.activate ? target?.click() : target?.focus();
  }

  onPanelKeydown(event: KeyboardEvent, root: ProcessedMegaRoot, rootIndex: number): void {
    if (
      event.key === 'Escape' ||
      event.key === (this.direction() === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.close(true, rootIndex);
      return;
    }
    const elements = this.childElements(rootIndex);
    const current = elements.indexOf(event.target as HTMLElement);
    if (current >= 0) this.childController.setActiveIndex(current);
    const result = this.childController.handleKey(event);
    if (!result.handled) return;
    event.stopPropagation();
    const target = elements[result.activeIndex];
    result.activate ? target?.click() : target?.focus();
  }

  toggleMobile(event: Event): void {
    event.stopPropagation();
    const next = !this.mobileActive();
    this.mobileActive.set(next);
    this.mobileActiveChange.emit(next);
    if (!next) this.close(false);
  }

  close(restoreFocus = false, rootIndex = this.rootController.index): void {
    const wasOpen = this.activeRootKey() != null;
    this.activeRootKey.set(null);
    if (wasOpen) this.activeItemChange.emit(null);
    if (restoreFocus) {
      (this.rootActions()[rootIndex]?.nativeElement ?? this.menuButton()?.nativeElement)?.focus();
    }
  }

  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
      if (this.mobileActive()) {
        this.mobileActive.set(false);
        this.mobileActiveChange.emit(false);
      }
    }
  }

  private processRoot(item: NeuMegaMenuItem, index: number): ProcessedMegaRoot {
    const rawColumns = this.toColumns(item.items);
    const columns = rawColumns.map((column) => this.processColumn(column, 1, [item]));
    return { action: resolveNeuMenuAction(item, index), index, level: 0, children: [], columns };
  }

  private processColumn(
    items: readonly NeuMegaMenuItem[],
    level: number,
    initialAncestry: readonly NeuMegaMenuItem[],
  ): ProcessedMegaItem[] {
    const entries = walkNeuTreeDepthFirst(items, (item) => this.toColumns(item.items).flat(), {
      initialAncestry,
    });
    const processed = new Map<number, ProcessedMegaItem>();
    for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex -= 1) {
      const entry = entries[entryIndex];
      processed.set(entryIndex, {
        action: resolveNeuMenuAction(entry.node, entry.index),
        index: entry.index,
        level: level + entry.level,
        children: entry.childEntryIndices.map((childIndex) => processed.get(childIndex)!),
      });
    }
    return entries.flatMap((entry, entryIndex) =>
      entry.parentEntryIndex == null ? [processed.get(entryIndex)!] : [],
    );
  }

  private toColumns(items: NeuMegaMenuItem['items']): NeuMegaMenuItem[][] {
    if (!items?.length) return [];
    return Array.isArray(items[0]) ? (items as NeuMegaMenuItem[][]) : [items as NeuMegaMenuItem[]];
  }

  private flattened(root: ProcessedMegaRoot): ProcessedMegaItem[] {
    return walkNeuTreeDepthFirst(root.columns.flat(), (item) => item.children)
      .map((entry) => entry.node)
      .filter((item) => item.action.visible && !item.action.separator);
  }

  private focusFirstChild(root: ProcessedMegaRoot, rootIndex: number): void {
    const flat = this.flattened(root);
    this.childController.configure({ direction: this.direction() });
    this.childController.setItems(
      flat.map((item) => ({
        key: item.action.key,
        label: item.action.label,
        disabled: item.action.disabled,
      })),
    );
    this.childElements(rootIndex)[this.childController.index]?.focus();
  }

  private childElements(rootIndex: number): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        `#${this.panelId(rootIndex)} [data-neu-mega-child]`,
      ),
    );
  }
}
