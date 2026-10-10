import { NgTemplateOutlet } from '@angular/common';
import { CdkOverlayOrigin, OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  linkedSignal,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuBadgeComponent } from '@neural-ui/core/badge';
import { InternalNeuIconOutletComponent } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { NeuIdGenerator, NeuResponsiveState, type NeuTextDirection } from '@neural-ui/core/internal';

export type NeuMegaMenuOrientation = 'horizontal' | 'vertical';

interface NeuMegaMenuEntry {
  readonly key: string;
  readonly label: string;
  readonly icon?: NeuIconKey;
  readonly badge?: string | number;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly visible?: boolean;
  readonly tooltip?: string;
  readonly data?: unknown;
}

type NeuMegaMenuDestination =
  | { readonly routerLink: string | unknown[]; readonly url?: never; readonly target?: never; readonly rel?: never }
  | { readonly url: string; readonly routerLink?: never; readonly target?: string; readonly rel?: string };

type NeuMegaMenuCommand = (event: {
  originalEvent: Event;
  item: NeuMegaMenuItem | NeuMegaMenuLeaf;
}) => void;

export type NeuMegaMenuLeaf =
  | (NeuMegaMenuEntry & NeuMegaMenuDestination & { readonly kind: 'link'; readonly command?: never; readonly panel?: never })
  | (NeuMegaMenuEntry & { readonly kind: 'command'; readonly command: NeuMegaMenuCommand; readonly url?: never; readonly routerLink?: never; readonly panel?: never });

export interface NeuMegaMenuGroup {
  readonly key: string;
  readonly label?: string;
  readonly items: readonly NeuMegaMenuLeaf[];
}

export interface NeuMegaMenuColumn {
  readonly key: string;
  readonly groups: readonly NeuMegaMenuGroup[];
}

export interface NeuMegaMenuPanel {
  readonly columns: readonly NeuMegaMenuColumn[];
}

export type NeuMegaMenuItem =
  | (NeuMegaMenuEntry & NeuMegaMenuDestination & { readonly kind: 'link'; readonly command?: never; readonly panel?: never })
  | (NeuMegaMenuEntry & { readonly kind: 'command'; readonly command: NeuMegaMenuCommand; readonly url?: never; readonly routerLink?: never; readonly panel?: never })
  | (NeuMegaMenuEntry & { readonly kind: 'panel'; readonly panel: NeuMegaMenuPanel; readonly url?: never; readonly routerLink?: never; readonly command?: never });

/** Visual content only: the component retains ownership of the native link or button. */
export interface NeuMegaMenuItemTemplateContext {
  $implicit: NeuMegaMenuItem | NeuMegaMenuLeaf;
  index: number;
  level: 0 | 3;
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

interface ValidatedMegaMenu {
  roots: readonly NeuMegaMenuItem[];
  invalid: ReadonlySet<string>;
}

@Component({
  selector: 'neu-mega-menu',
  imports: [NgTemplateOutlet, OverlayModule, RouterLink, NeuBadgeComponent, InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-mega-menu',
    '[class.neu-mega-menu--horizontal]': 'orientation() === "horizontal"',
    '[class.neu-mega-menu--vertical]': 'orientation() === "vertical"',
    '[class.neu-mega-menu--mobile]': 'mobile()',
    '[class.neu-mega-menu--mobile-active]': 'mobileActive()',
    '[class.neu-mega-menu--disabled]': 'disabled()',
    '[attr.dir]': 'direction()',
  },
  template: `
    <nav class="neu-mega-menu__nav" [attr.aria-label]="ariaLabel()" [attr.aria-labelledby]="ariaLabelledBy()">
      @if (startTemplate()) {
        <div class="neu-mega-menu__start">
          <ng-container [ngTemplateOutlet]="startTemplate()!.templateRef" />
        </div>
      }

      @if (mobile()) {
        <button #menuButton class="neu-mega-menu__toggle" type="button"
          [attr.aria-label]="menuButtonAriaLabel()" [attr.aria-expanded]="mobileActive()"
          [attr.aria-controls]="rootListId()" [disabled]="disabled()"
          (click)="toggleMobile()" (keydown.escape)="onMobileEscape($event)">
          <span aria-hidden="true">☰</span>
        </button>
      }

      <ul class="neu-mega-menu__root-list" [id]="rootListId()" [hidden]="mobile() && !mobileActive()">
        @for (root of validated().roots; track invalid('root/' + root.key) ? 'invalid-root-' + rootIndex : root.key; let rootIndex = $index) {
          <li class="neu-mega-menu__root-item" [class.neu-mega-menu__root-item--open]="isOpen(root)">
            @if (root.kind === 'panel') {
              <button #rootAction cdkOverlayOrigin #origin="cdkOverlayOrigin"
                class="neu-mega-menu__root-action" type="button"
                [attr.data-neu-mega-key]="root.key"
                [disabled]="disabled() || root.disabled || invalid('root/' + root.key)"
                [attr.title]="root.tooltip ?? null"
                [attr.aria-expanded]="isOpen(root)"
                [attr.aria-controls]="panelId(root.key)"
                [class.neu-mega-menu__root-action--active]="root.active"
                (click)="toggleRoot(root)"
                (mouseenter)="onRootMouseenter(root)"
                (keydown)="onRootKeydown($event, root)">
                <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex, 0)" />
                <svg class="neu-mega-menu__chevron" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              @if (mobile() && isOpen(root)) {
                <ng-container [ngTemplateOutlet]="panelContent"
                  [ngTemplateOutletContext]="{ $implicit: root }" />
              }
            } @else if (root.kind === 'link' && !disabled() && !root.disabled && !invalid('root/' + root.key)) {
              @if (root.routerLink != null) {
                <a #rootAction class="neu-mega-menu__root-action" [routerLink]="root.routerLink"
                  [attr.title]="root.tooltip ?? null" [attr.aria-current]="root.active ? 'page' : null"
                  [class.neu-mega-menu__root-action--active]="root.active"
                  (click)="activate(root, $event)">
                  <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                    [ngTemplateOutletContext]="templateContext(root, rootIndex, 0)" />
                </a>
              } @else {
                <a #rootAction class="neu-mega-menu__root-action" [href]="root.url"
                  [target]="root.target" [rel]="root.rel" [attr.title]="root.tooltip ?? null"
                  [attr.aria-current]="root.active ? 'page' : null"
                  [class.neu-mega-menu__root-action--active]="root.active"
                  (click)="activate(root, $event)">
                  <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                    [ngTemplateOutletContext]="templateContext(root, rootIndex, 0)" />
                </a>
              }
            } @else if (root.kind === 'command' && !invalid('root/' + root.key)) {
              <button #rootAction class="neu-mega-menu__root-action" type="button"
                [disabled]="disabled() || root.disabled" [attr.title]="root.tooltip ?? null"
                (click)="activate(root, $event)">
                <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex, 0)" />
              </button>
            } @else {
              <span class="neu-mega-menu__root-action neu-mega-menu__root-action--disabled" aria-disabled="true">
                <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                  [ngTemplateOutletContext]="templateContext(root, rootIndex, 0)" />
              </span>
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

    @if (!mobile() && openRoot(); as root) {
      @if (openOrigin(); as origin) {
        <ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="origin"
          [cdkConnectedOverlayOpen]="true" [cdkConnectedOverlayPositions]="overlayPositions()"
          [cdkConnectedOverlayPush]="true" [cdkConnectedOverlayViewportMargin]="8"
          (attach)="onOverlayAttach()" (detach)="onOverlayDetach()"
          (overlayKeydown)="onOverlayKeydown($event)">
          <ng-container [ngTemplateOutlet]="panelContent"
            [ngTemplateOutletContext]="{ $implicit: root }" />
        </ng-template>
      }
    }

    <ng-template #panelContent let-root>
      <div class="neu-mega-menu__panel" role="region" [id]="panelId(root.key)"
        [attr.aria-label]="root.label" [attr.dir]="direction()"
        [style.max-height]="scrollHeight()" (keydown)="onPanelKeydown($event)">
        <div class="neu-mega-menu__grid">
          @for (column of root.panel.columns; track column.key + ':' + $index) {
            <div class="neu-mega-menu__column">
              @for (group of column.groups; track group.key + ':' + $index) {
                <section class="neu-mega-menu__group">
                  @if (group.label) {
                    <h2 class="neu-mega-menu__group-heading">{{ group.label }}</h2>
                  }
                  <ul class="neu-mega-menu__group-list">
                    @for (leaf of group.items; track leaf.key + ':' + $index; let leafIndex = $index) {
                      @if (leaf.visible !== false) {
                        <li class="neu-mega-menu__item">
                          @if (leaf.kind === 'link' && !disabled() && !leaf.disabled && !invalidLeaf(root.key, column.key, group.key, leaf.key)) {
                            @if (leaf.routerLink != null) {
                              <a class="neu-mega-menu__item-action" [routerLink]="leaf.routerLink"
                                [attr.title]="leaf.tooltip ?? null"
                                [attr.aria-current]="leaf.active ? 'page' : null"
                                [class.neu-mega-menu__item-action--active]="leaf.active"
                                (click)="activate(leaf, $event)">
                                <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                                  [ngTemplateOutletContext]="templateContext(leaf, leafIndex, 3)" />
                              </a>
                            } @else {
                              <a class="neu-mega-menu__item-action" [href]="leaf.url"
                                [target]="leaf.target" [rel]="leaf.rel"
                                [attr.title]="leaf.tooltip ?? null"
                                [attr.aria-current]="leaf.active ? 'page' : null"
                                [class.neu-mega-menu__item-action--active]="leaf.active"
                                (click)="activate(leaf, $event)">
                                <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                                  [ngTemplateOutletContext]="templateContext(leaf, leafIndex, 3)" />
                              </a>
                            }
                          } @else if (leaf.kind === 'command' && !invalidLeaf(root.key, column.key, group.key, leaf.key)) {
                            <button class="neu-mega-menu__item-action" type="button"
                              [disabled]="disabled() || leaf.disabled" [attr.title]="leaf.tooltip ?? null"
                              (click)="activate(leaf, $event)">
                              <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                                [ngTemplateOutletContext]="templateContext(leaf, leafIndex, 3)" />
                            </button>
                          } @else {
                            <span class="neu-mega-menu__item-action neu-mega-menu__item-action--disabled" aria-disabled="true">
                              <ng-container [ngTemplateOutlet]="itemTemplateRef()"
                                [ngTemplateOutletContext]="templateContext(leaf, leafIndex, 3)" />
                            </span>
                          }
                        </li>
                      }
                    }
                  </ul>
                </section>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #defaultItem let-item>
      @if (item.icon) {
        <neu-icon-outlet class="neu-mega-menu__icon" [icon]="item.icon" size="1rem" aria-hidden="true" />
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
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly responsive = inject(NeuResponsiveState);
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-mega-menu-');
  private readonly warned = new Set<string>();
  private unlistenOutside: (() => void) | null = null;
  private readonly mobileOpen = signal(false);
  private readonly origins = viewChildren(CdkOverlayOrigin);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly defaultTemplate = viewChild.required<TemplateRef<NeuMegaMenuItemTemplateContext>>('defaultItem');
  protected readonly itemTemplate = contentChild(NeuMegaMenuItemDirective);
  protected readonly startTemplate = contentChild(NeuMegaMenuStartDirective);
  protected readonly endTemplate = contentChild(NeuMegaMenuEndDirective);

  readonly id = input<string>();
  readonly items = input<readonly NeuMegaMenuItem[]>([]);
  readonly orientation = input<NeuMegaMenuOrientation>('horizontal');
  readonly breakpoint = input('960px');
  readonly scrollHeight = input('min(28rem, 70vh)');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('Main navigation');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly menuButtonAriaLabel = input('Toggle navigation');
  readonly direction = input<NeuTextDirection>('ltr');
  private readonly openKey = linkedSignal({
    source: computed(() => ({ items: this.items(), disabled: this.disabled() })),
    computation: (source, previous: { value: string | null } | undefined): string | null => {
      const key = previous?.value;
      return !source.disabled && key && source.items.filter((item) =>
        item.key === key && item.kind === 'panel' && item.visible !== false && !item.disabled,
      ).length === 1 && source.items.filter((item) => item.key === key && item.visible !== false).length === 1
        ? key : null;
    },
  });

  readonly itemClick = output<NeuMegaMenuItem | NeuMegaMenuLeaf>();
  readonly mobileActiveChange = output<boolean>();

  protected readonly mobile = this.responsive.observe(computed(() => `(max-width: ${this.breakpoint()})`));
  protected readonly mobileActive = this.mobileOpen.asReadonly();
  protected readonly rootListId = computed(() => `${this.id() ?? this.generatedId}-list`);
  protected readonly validated = computed<ValidatedMegaMenu>(() => this.validate(this.items()));
  protected readonly openRoot = computed(() =>
    this.validated().roots.find((root) =>
      root.kind === 'panel' && root.key === this.openKey() &&
      !root.disabled && !this.disabled() && !this.invalid('root/' + root.key),
    ) as Extract<NeuMegaMenuItem, { kind: 'panel' }> | undefined,
  );
  protected readonly overlayPositions = computed<ConnectedPosition[]>(() => {
    const rtl = this.direction() === 'rtl';
    if (this.orientation() === 'vertical') {
      return [
        { originX: rtl ? 'start' : 'end', originY: 'top', overlayX: rtl ? 'end' : 'start', overlayY: 'top', offsetX: rtl ? -8 : 8 },
        { originX: rtl ? 'end' : 'start', originY: 'top', overlayX: rtl ? 'start' : 'end', overlayY: 'top', offsetX: rtl ? 8 : -8 },
      ];
    }
    return [
      { originX: rtl ? 'end' : 'start', originY: 'bottom', overlayX: rtl ? 'end' : 'start', overlayY: 'top', offsetY: 8 },
      { originX: rtl ? 'end' : 'start', originY: 'top', overlayX: rtl ? 'end' : 'start', overlayY: 'bottom', offsetY: -8 },
    ];
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.onOverlayDetach());
  }

  protected itemTemplateRef(): TemplateRef<NeuMegaMenuItemTemplateContext> {
    return this.itemTemplate()?.templateRef ?? this.defaultTemplate();
  }

  protected templateContext(item: NeuMegaMenuItem | NeuMegaMenuLeaf, index: number, level: 0 | 3): NeuMegaMenuItemTemplateContext {
    return { $implicit: item, index, level, active: !!item.active };
  }

  protected panelId(key: string): string {
    return `${this.id() ?? this.generatedId}-panel-${encodeURIComponent(key)}`;
  }

  protected invalid(path: string): boolean {
    return this.validated().invalid.has(path);
  }

  protected invalidLeaf(root: string, column: string, group: string, leaf: string): boolean {
    const base = `root/${root}/column/${column}`;
    return this.invalid(`root/${root}`) || this.invalid(base) ||
      this.invalid(`${base}/group/${group}`) || this.invalid(`${base}/group/${group}/leaf/${leaf}`);
  }

  protected isOpen(root: NeuMegaMenuItem): boolean {
    return this.openRoot()?.key === root.key;
  }

  protected openOrigin(): CdkOverlayOrigin | undefined {
    const key = this.openRoot()?.key;
    return this.origins().find((origin) => origin.elementRef.nativeElement.getAttribute('data-neu-mega-key') === key);
  }

  protected toggleRoot(root: NeuMegaMenuItem): void {
    if (root.kind !== 'panel' || this.disabled() || root.disabled || this.invalid('root/' + root.key)) return;
    this.openKey.set(this.openRoot()?.key === root.key ? null : root.key);
  }

  protected onRootMouseenter(root: NeuMegaMenuItem): void {
    if (!this.mobile() && this.openRoot() && root.kind === 'panel' &&
      !root.disabled && !this.disabled() && !this.invalid('root/' + root.key)) {
      this.openKey.set(root.key);
    }
  }

  protected onRootKeydown(event: KeyboardEvent, root: NeuMegaMenuItem): void {
    if (event.key === 'Escape' && this.openRoot()) {
      event.preventDefault();
      this.close(true);
    } else if (event.key === 'Tab' && !event.shiftKey && !this.mobile() && this.openRoot()?.key === root.key) {
      const first = this.panelElement()?.querySelector<HTMLElement>('a, button:not([disabled])');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mobile()) {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.openRoot()) {
      event.preventDefault();
      this.close(true);
    }
  }

  protected onOverlayAttach(): void {
    if (this.unlistenOutside) return;
    this.unlistenOutside = this.renderer.listen('document', 'pointerdown', (event: PointerEvent) => {
      const target = event.target as Node;
      if (!this.host.nativeElement.contains(target) && !this.panelElement()?.contains(target)) this.close();
    });
  }

  protected onOverlayDetach(): void {
    this.unlistenOutside?.();
    this.unlistenOutside = null;
  }

  protected onMobileEscape(event: Event): void {
    if (!this.mobileOpen()) return;
    event.preventDefault();
    this.mobileOpen.set(false);
    this.mobileActiveChange.emit(false);
    this.close();
    this.menuButton()?.nativeElement.focus();
  }

  protected toggleMobile(): void {
    if (this.disabled()) return;
    const next = !this.mobileOpen();
    this.mobileOpen.set(next);
    this.mobileActiveChange.emit(next);
    if (!next) this.close();
  }

  protected activate(item: NeuMegaMenuItem | NeuMegaMenuLeaf, event: MouseEvent): void {
    if (this.disabled() || item.disabled) return;
    if (item.kind === 'command') item.command({ originalEvent: event, item });
    if (item.kind !== 'panel') this.itemClick.emit(item);
    this.close();
  }

  /** Closes the local panel; useful before consumer-driven navigation. */
  close(restoreFocus = false): void {
    const key = this.openRoot()?.key;
    if (!key) return;
    const trigger = restoreFocus ? this.origins().find((origin) =>
      origin.elementRef.nativeElement.getAttribute('data-neu-mega-key') === key,
    )?.elementRef.nativeElement as HTMLElement | undefined : undefined;
    this.openKey.set(null);
    trigger?.focus();
  }

  private panelElement(): HTMLElement | null {
    const root = this.openRoot();
    return root ? this.host.nativeElement.ownerDocument.getElementById(this.panelId(root.key)) : null;
  }

  private validate(items: readonly NeuMegaMenuItem[]): ValidatedMegaMenu {
    const roots = items.filter((item) => item.visible !== false);
    const invalid = new Set<string>();
    const checkSiblings = (entries: readonly { key: string }[], prefix: string): void => {
      const seen = new Set<string>();
      for (const entry of entries) {
        const path = `${prefix}/${entry.key}`;
        if (seen.has(entry.key)) {
          invalid.add(path);
          this.diagnose(`duplicate:${path}`, `Duplicate sibling key "${entry.key}" at ${prefix}`);
        }
        seen.add(entry.key);
      }
    };
    checkSiblings(roots, 'root');
    for (const root of roots) {
      const rootPath = `root/${root.key}`;
      if (root.kind === 'panel') {
        if (this.hasActionConflict(root)) this.diagnose(`dual:${rootPath}`, `Panel root "${root.key}" also has an action; panel takes precedence`);
        const columns = root.panel?.columns ?? [];
        checkSiblings(columns, `${rootPath}/column`);
        for (const column of columns) {
          const columnPath = `${rootPath}/column/${column.key}`;
          checkSiblings(column.groups, `${columnPath}/group`);
          for (const group of column.groups) {
            const groupPath = `${columnPath}/group/${group.key}`;
            checkSiblings(group.items, `${groupPath}/leaf`);
            for (const leaf of group.items) {
              if (this.hasActionConflict(leaf)) {
                const path = `${groupPath}/leaf/${leaf.key}`;
                invalid.add(path);
                this.diagnose(`dual:${path}`, `Leaf "${leaf.key}" has conflicting actions`);
              }
            }
          }
        }
      } else if (this.hasActionConflict(root)) {
        invalid.add(rootPath);
        this.diagnose(`dual:${rootPath}`, `Root "${root.key}" has conflicting actions`);
      }
    }
    return { roots, invalid };
  }

  private hasActionConflict(item: NeuMegaMenuItem | NeuMegaMenuLeaf): boolean {
    const value = item as unknown as Record<string, unknown>;
    const actions = [value['routerLink'] != null, value['url'] != null, typeof value['command'] === 'function'];
    return actions.filter(Boolean).length !== (item.kind === 'panel' ? 0 : 1);
  }

  private diagnose(code: string, message: string): void {
    if (!isDevMode() || this.warned.has(code)) return;
    this.warned.add(code);
    console.warn(`NeuMegaMenu: ${message}`);
  }
}
