import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, computed, inject, input, output, signal } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';

export interface NeuMegaMenuItem<T = unknown> {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: NeuMegaMenuItem<T>[];
  data?: T;
}

@Component({
  selector: 'neu-mega-menu',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-mega-menu-host', '(keydown.escape)': 'close(true)' },
  template: `
    <nav class="neu-mega-menu" [attr.aria-label]="ariaLabel()" (mouseleave)="close()">
      <div class="neu-mega-menu__bar" role="menubar" (keydown)="onBarKeydown($event)">
        @for (item of items(); track item.key; let index = $index) {
          <button
            class="neu-mega-menu__trigger"
            type="button"
            role="menuitem"
            [disabled]="item.disabled"
            [attr.data-index]="index"
            [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
            [attr.aria-expanded]="item.children?.length ? activeKey() === item.key : null"
            [attr.tabindex]="index === activeTopIndex() ? 0 : -1"
            (mouseenter)="item.children?.length ? open(item, index) : null"
            (focus)="activeTopIndex.set(index)"
            (click)="activateTop(item, index)"
          >
            {{ item.label }} @if (item.children?.length) { <span aria-hidden="true">⌄</span> }
          </button>
        }
      </div>
      @if (activeItem(); as active) {
        <div class="neu-mega-menu__panel" role="menu" [attr.aria-label]="active.label" (keydown)="onPanelKeydown($event)">
          @for (group of active.children ?? []; track group.key) {
            <section class="neu-mega-menu__group">
              <h3>{{ group.label }}</h3>
              @if (group.description) { <p>{{ group.description }}</p> }
              <div class="neu-mega-menu__items">
                @for (item of group.children ?? []; track item.key) {
                  @if (item.separator) { <hr role="separator" /> }
                  @else {
                    <button class="neu-mega-menu__item" type="button" role="menuitem" [disabled]="item.disabled" (click)="select(item)">
                      @if (item.icon) { <span class="neu-mega-menu__icon" aria-hidden="true">{{ item.icon }}</span> }
                      <span><strong>{{ item.label }}</strong>@if (item.description) { <small>{{ item.description }}</small> }</span>
                      @if (item.badge) { <span class="neu-mega-menu__badge">{{ item.badge }}</span> }
                    </button>
                  }
                }
              </div>
            </section>
          }
        </div>
      }
    </nav>
  `,
  styleUrl: './neu-mega-menu.component.scss',
})
export class NeuMegaMenuComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  readonly items = input<NeuMegaMenuItem<T>[]>([]);
  readonly ariaLabel = input('Main navigation');
  readonly itemClick = output<NeuMegaMenuItem<T>>();
  readonly openChange = output<string | null>();
  readonly activeKey = signal<string | null>(null);
  readonly activeTopIndex = signal(0);
  readonly activeItem = computed(() => this.items().find((item) => item.key === this.activeKey()) ?? null);

  open(item: NeuMegaMenuItem<T>, index: number): void {
    if (item.disabled || !item.children?.length) return;
    this.activeTopIndex.set(index);
    this.activeKey.set(item.key);
    this.openChange.emit(item.key);
  }
  close(restoreFocus = false): void {
    if (!this.activeKey()) return;
    this.activeKey.set(null);
    this.openChange.emit(null);
    if (restoreFocus) queueMicrotask(() => this.topButtons()[this.activeTopIndex()]?.focus());
  }
  activateTop(item: NeuMegaMenuItem<T>, index: number): void {
    if (item.children?.length) this.activeKey() === item.key ? this.close() : this.open(item, index);
    else this.select(item);
  }
  select(item: NeuMegaMenuItem<T>): void { if (!item.disabled) { this.itemClick.emit(item); this.close(true); } }
  onBarKeydown(event: KeyboardEvent): void {
    const previousKey = this.directionality.valueSignal() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const nextKey = this.directionality.valueSignal() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const buttons = this.topButtons();
    if (!buttons.length) return;
    let index = this.activeTopIndex();
    if (event.key === previousKey) index = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === nextKey) index = (index + 1) % buttons.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = buttons.length - 1;
    else if (event.key === 'ArrowDown') {
      const item = this.items()[index]; if (item) this.open(item, index); queueMicrotask(() => this.panelButtons()[0]?.focus()); event.preventDefault(); return;
    } else return;
    event.preventDefault(); this.activeTopIndex.set(index); buttons[index]?.focus();
  }
  onPanelKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const buttons = this.panelButtons(); if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowDown' ? (Math.max(current, -1) + 1) % buttons.length : (current <= 0 ? buttons.length : current) - 1;
    buttons[index]?.focus();
  }
  private topButtons(): HTMLButtonElement[] { return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-mega-menu__trigger:not(:disabled)')); }
  private panelButtons(): HTMLButtonElement[] { return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-mega-menu__item:not(:disabled)')); }
}
