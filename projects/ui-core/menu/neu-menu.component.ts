import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { Directionality } from '@angular/cdk/bidi';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuIconComponent } from '@neural-ui/core/icon';

export interface NeuMenuItem {
  key: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: NeuMenuItem[];
  data?: unknown;
}

/** Custom visual content for each menu item; menu semantics remain owned by the component. */
@Directive({ selector: 'ng-template[neuMenuItem]' })
export class NeuMenuItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuMenuItem }>) {}
}

@Component({
  selector: 'neu-menu',
  imports: [NeuButtonComponent, NeuIconComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-menu' },
  template: `
    <div
      class="neu-menu__list"
      role="menu"
      [attr.aria-label]="ariaLabel()"
      (keydown)="onKeydown($event)"
    >
      @for (item of items(); track item.key) {
        @if (item.separator) {
          <div class="neu-menu__separator" role="separator"></div>
        } @else {
          <button
            neu-button
            type="button"
            role="menuitem"
            class="neu-menu__item"
            variant="ghost"
            size="sm"
            [disabled]="!!item.disabled"
            [attr.tabindex]="item.disabled ? -1 : item.key === firstEnabledKey() ? 0 : -1"
            (click)="activate(item)"
          >
            @if (itemTemplateRef()) {
              <ng-container
                [ngTemplateOutlet]="itemTemplateRef()"
                [ngTemplateOutletContext]="{ $implicit: item }"
              />
            } @else if (item.icon) {
              <neu-icon class="neu-menu__icon" [name]="item.icon" size="1rem" aria-hidden="true" />
            }
            <span class="neu-menu__label">{{ item.label }}</span>
            @if (item.shortcut) {
              <kbd class="neu-menu__shortcut">{{ item.shortcut }}</kbd>
            }
            @if (item.children?.length) {
              <span class="neu-menu__chevron" aria-hidden="true">{{ submenuArrow() }}</span>
            }
          </button>
          @if (item.children?.length) {
            <div class="neu-menu__child">
              <neu-menu
                [items]="item.children ?? []"
                [ariaLabel]="item.label"
                [itemTemplate]="itemTemplateRef()"
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  readonly itemTpl = contentChild(NeuMenuItemDirective);
  readonly itemTemplate = input<TemplateRef<{ $implicit: NeuMenuItem }> | null>(null);
  readonly itemTemplateRef = computed(
    () => this.itemTemplate() ?? this.itemTpl()?.templateRef ?? null,
  );
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Menu');
  readonly itemClick = output<NeuMenuItem>();
  readonly firstEnabledKey = computed(
    () => this.items().find((item) => !item.separator && !item.disabled)?.key ?? null,
  );
  readonly submenuArrow = computed(() => (this.directionality.valueSignal() === 'rtl' ? '‹' : '›'));

  activate(item: NeuMenuItem): void {
    if (!item.disabled) {
      this.itemClick.emit(item);
    }
  }

  focusFirstItem(): void {
    this.enabledItems()[0]?.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = this.enabledItems();
    if (!items.length) return;
    event.preventDefault();
    const activeIndex = items.indexOf(event.target as HTMLButtonElement);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (Math.max(activeIndex, -1) + 1) % items.length
            : (activeIndex <= 0 ? items.length : activeIndex) - 1;
    items[nextIndex]?.focus();
  }

  private enabledItems(): HTMLButtonElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
        ':scope > .neu-menu__list > .neu-menu__item:not(:disabled)',
      ),
    );
  }
}

@Component({
  selector: 'neu-menu-button',
  imports: [OverlayModule, NeuButtonComponent, NeuMenuComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-menu-button' },
  template: `
    <button
      neu-button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      class="neu-menu-button__trigger"
      variant="ghost"
      size="sm"
      [attr.aria-expanded]="open()"
      aria-haspopup="menu"
      (click)="toggle()"
    >
      <ng-content>{{ label() }}</ng-content>
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <neu-menu
        class="neu-menu-button__panel"
        [items]="items()"
        [itemTemplate]="itemTpl()?.templateRef ?? null"
        (itemClick)="onItemClick($event)"
      />
    </ng-template>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuMenuButtonComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly itemTpl = contentChild(NeuMenuItemDirective);
  readonly panel = viewChild(NeuMenuComponent);
  readonly items = input<NeuMenuItem[]>([]);
  readonly label = input('Menu');
  readonly itemClick = output<NeuMenuItem>();
  readonly openChange = output<boolean>();
  readonly open = signal(false);

  toggle(): void {
    this.open.set(!this.open());
    this.openChange.emit(this.open());
    if (this.open()) {
      queueMicrotask(() => this.panel()?.focusFirstItem());
    }
  }

  close(restoreFocus = false): void {
    if (this.open()) {
      this.open.set(false);
      this.openChange.emit(false);
      if (restoreFocus) {
        queueMicrotask(() =>
          this.host.nativeElement.querySelector<HTMLElement>('.neu-menu-button__trigger')?.focus(),
        );
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    this.close(true);
  }

  onItemClick(item: NeuMenuItem): void {
    this.itemClick.emit(item);
    this.close();
  }
}

@Component({
  selector: 'neu-menubar',
  imports: [NeuButtonComponent, NeuMenuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-menubar' },
  template: `
    <nav class="neu-menubar__list" [attr.aria-label]="ariaLabel()" (keydown)="onKeydown($event)">
      @for (item of items(); track item.key) {
        @if (item.children?.length) {
          <neu-menu-button
            [items]="item.children ?? []"
            [label]="item.label"
            (itemClick)="itemClick.emit($event)"
          >
            {{ item.label }}
          </neu-menu-button>
        } @else {
          <button
            neu-button
            type="button"
            class="neu-menubar__item"
            variant="ghost"
            size="sm"
            [disabled]="!!item.disabled"
            (click)="itemClick.emit(item)"
          >
            {{ item.label }}
          </button>
        }
      }
    </nav>
  `,
  styleUrl: './neu-menu.component.scss',
})
export class NeuMenubarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Menu bar');
  readonly itemClick = output<NeuMenuItem>();

  onKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
        '.neu-menubar__list > .neu-menubar__item, .neu-menubar__list > neu-menu-button > .neu-menu-button__trigger',
      ),
    ).filter((item) => !item.disabled);
    if (!items.length) return;
    event.preventDefault();
    const activeIndex = items.indexOf(event.target as HTMLButtonElement);
    const physicalDelta = event.key === 'ArrowRight' ? 1 : -1;
    const delta = this.directionality.valueSignal() === 'rtl' ? -physicalDelta : physicalDelta;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (Math.max(activeIndex, 0) + delta + items.length) % items.length;
    items[nextIndex]?.focus();
  }
}

@Component({
  selector: 'neu-tiered-menu',
  imports: [NeuMenuComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-tiered-menu' },
  template: `<neu-menu
    [items]="items()"
    [ariaLabel]="ariaLabel()"
    (itemClick)="itemClick.emit($event)"
  />`,
  styleUrl: './neu-menu.component.scss',
})
export class NeuTieredMenuComponent {
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Tiered menu');
  readonly itemClick = output<NeuMenuItem>();
}
