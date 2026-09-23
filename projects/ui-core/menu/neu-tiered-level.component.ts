import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { NeuralIcon } from '@neural-icons/angular';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuRovingMenuController } from '@neural-ui/core/internal';
import type { NeuMenuItem } from './neu-menu.component';

export interface NeuTieredOwner {
  readonly id: string;
  overlayReady(): boolean;
  isExpanded(key: string): boolean;
  openBranch(ancestors: readonly string[], key: string): void;
  closeBranch(key: string): void;
  closeDeepest(): void;
  activateLeaf(item: NeuMenuItem, event: Event): void;
  direction(): 'ltr' | 'rtl';
}

/** Private focus/renderer context: one roving controller per visible menu level. */
@Component({
  selector: 'neu-tiered-level',
  imports: [OverlayModule, NeuButtonComponent, NeuralIcon, NgTemplateOutlet, forwardRef(() => NeuTieredLevelComponent)],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-tiered-level' },
  template: `
    <div
      class="neu-menu__list neu-tiered-menu__list"
      role="menu"
      [id]="levelId()"
      [attr.dir]="parentKey() ? owner().direction() : null"
      [attr.aria-label]="label()"
      [attr.data-neu-tiered-owner]="owner().id"
    >
      @for (item of items(); track item.key; let index = $index) {
        @if (item.visible !== false && item.separator) {
          <div class="neu-menu__separator" role="separator"></div>
        } @else if (item.visible !== false) {
          <button
            neu-button
            cdkOverlayOrigin
            #origin="cdkOverlayOrigin"
            type="button"
            [id]="triggerId(item.key)"
            class="neu-menu__item neu-tiered-menu__item"
            role="menuitem"
            tone="neutral" variant="ghost" size="sm"
            [disabled]="!!item.disabled"
            [tabIndex]="tabIndexFor(index)"
            [attr.data-neu-tiered-index]="index"
            [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
            [attr.aria-expanded]="item.children?.length ? owner().isExpanded(item.key) : null"
            [attr.aria-controls]="item.children?.length ? submenuId(item.key) : null"
            (focus)="setActiveIndex(index)"
            (pointerenter)="onPointerEnter(item)"
            (keydown)="onKeydown(item, index, $event)"
            (click)="onClick(item, $event)"
          >
            @if (itemTemplate(); as template) {
              <span class="neu-menu__custom-content">
                <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }" />
              </span>
            } @else {
              @if (item.icon) {
                <neural-icon class="neu-menu__icon" [icon]="item.icon" size="1rem" aria-hidden="true" />
              }
              <span class="neu-menu__label">{{ item.label }}</span>
              @if (item.shortcut) { <kbd class="neu-menu__shortcut">{{ item.shortcut }}</kbd> }
            }
            @if (item.children?.length) {
              <span class="neu-tiered-menu__chevron" aria-hidden="true">›</span>
            }
          </button>
          @if (item.children?.length) {
            <ng-template
              cdkConnectedOverlay
              #submenuOverlay="cdkConnectedOverlay"
              [cdkConnectedOverlayOrigin]="origin"
              [cdkConnectedOverlayOpen]="owner().overlayReady() && owner().isExpanded(item.key)"
              [cdkConnectedOverlayPositions]="positions()"
              [cdkConnectedOverlayPush]="true"
              (attach)="onAttach(submenuOverlay, item.key)"
            >
              <neu-tiered-level
                class="neu-tiered-menu__panel"
                [owner]="owner()"
                [items]="item.children"
                [label]="item.label"
                [levelId]="submenuId(item.key)"
                [ancestors]="childPath(item.key)"
                [parentKey]="item.key"
                [parentTriggerId]="triggerId(item.key)"
                [itemTemplate]="itemTemplate()"
              />
            </ng-template>
          }
        }
      }
    </div>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuTieredLevelComponent {
  readonly owner = input.required<NeuTieredOwner>();
  readonly items = input<readonly NeuMenuItem[]>([]);
  readonly label = input('Menu');
  readonly levelId = input.required<string>();
  readonly ancestors = input<readonly string[]>([]);
  readonly parentKey = input<string | null>(null);
  readonly parentTriggerId = input<string | null>(null);
  readonly itemTemplate = input<TemplateRef<{ $implicit: NeuMenuItem }> | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly controller = new NeuRovingMenuController({ orientation: 'vertical' });
  private lastItems: readonly NeuMenuItem[] | null = null;
  private focusOnAttach: string | null = null;

  tabIndexFor(index: number): 0 | -1 {
    this.reconcile();
    return this.controller.tabIndexFor(index);
  }

  setActiveIndex(index: number): void {
    this.reconcile();
    this.controller.setActiveIndex(index);
  }

  childPath(key: string): string[] {
    return [...this.ancestors(), key];
  }

  triggerId(key: string): string {
    return `${this.levelId()}-item-${tieredKeyToken(key)}`;
  }

  submenuId(key: string): string {
    return `${this.triggerId(key)}-submenu`;
  }

  positions(): ConnectedPosition[] {
    const rtl = this.owner().direction() === 'rtl';
    const primary: ConnectedPosition = rtl
      ? { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' }
      : { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' };
    const fallback: ConnectedPosition = rtl
      ? { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' }
      : { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' };
    return [primary, fallback];
  }

  onPointerEnter(item: NeuMenuItem): void {
    if (item.disabled || !item.children?.length || this.owner().isExpanded(item.key)) return;
    this.owner().openBranch(this.ancestors(), item.key);
  }

  onClick(item: NeuMenuItem, event: Event): void {
    if (item.disabled) return;
    if (item.children?.length) {
      if (!this.owner().isExpanded(item.key)) this.owner().openBranch(this.ancestors(), item.key);
    } else {
      this.owner().activateLeaf(item, event);
    }
  }

  onKeydown(item: NeuMenuItem, index: number, event: KeyboardEvent): void {
    this.setActiveIndex(index);
    const openKey = this.owner().direction() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = this.owner().direction() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Escape' || event.key === closeKey) {
      if (this.parentKey()) {
        event.preventDefault();
        event.stopPropagation();
        this.closeCurrent();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.owner().closeDeepest();
        return;
      }
    }
    if (event.key === openKey && item.children?.length) {
      event.preventDefault();
      event.stopPropagation();
      this.openAndFocus(item);
      return;
    }
    this.controller.configure({ direction: this.owner().direction() });
    const result = this.controller.handleKey(event);
    if (!result.handled) return;
    event.stopPropagation();
    if (result.activate) {
      if (item.children?.length) {
        if (this.owner().isExpanded(item.key)) this.owner().closeBranch(item.key);
        else this.openAndFocus(item);
      } else {
        this.owner().activateLeaf(item, event);
      }
      return;
    }
    this.focusActiveItem();
  }

  onAttach(overlay: CdkConnectedOverlay, key: string): void {
    if (this.focusOnAttach !== key) return;
    this.focusOnAttach = null;
    queueMicrotask(() => {
      if (this.destroyRef.destroyed || !this.owner().isExpanded(key)) return;
      overlay.overlayRef.overlayElement
        .querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')
        ?.focus({ preventScroll: true });
    });
  }

  private openAndFocus(item: NeuMenuItem): void {
    if (this.owner().isExpanded(item.key)) {
      this.host.ownerDocument.getElementById(this.submenuId(item.key))
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')
        ?.focus({ preventScroll: true });
    } else {
      this.focusOnAttach = item.key;
      this.owner().openBranch(this.ancestors(), item.key);
    }
  }

  private closeCurrent(): void {
    const key = this.parentKey();
    if (key) this.owner().closeBranch(key);
    const parentId = this.parentTriggerId();
    if (parentId) this.host.ownerDocument.getElementById(parentId)?.focus({ preventScroll: true });
  }

  private reconcile(): void {
    const items = this.items();
    if (items === this.lastItems) return;
    this.lastItems = items;
    this.controller.setItems(items.map((item) => ({
      key: item.key,
      label: item.label,
      disabled: item.disabled,
      hidden: item.visible === false,
      separator: item.separator,
    })));
  }

  private focusActiveItem(): void {
    this.host.querySelector<HTMLElement>(
      `:scope > .neu-tiered-menu__list > [data-neu-tiered-index="${this.controller.index}"]`,
    )?.focus({ preventScroll: true });
  }
}

function tieredKeyToken(key: string): string {
  return [...key].map((character) => character.codePointAt(0)!.toString(16)).join('-') || 'empty';
}
