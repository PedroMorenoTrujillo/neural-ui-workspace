import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, inject, input, output, signal } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';

export interface NeuDockItem<T = unknown> {
  key: string;
  label: string;
  icon?: string;
  image?: string;
  badge?: string;
  disabled?: boolean;
  data?: T;
}

@Component({
  selector: 'neu-dock',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-dock-host' },
  template: `
    <nav class="neu-dock neu-dock--{{ position() }}" [attr.aria-label]="ariaLabel()" (keydown)="onKeydown($event)">
      <ul class="neu-dock__list" role="menubar" [attr.aria-orientation]="isVertical() ? 'vertical' : 'horizontal'">
        @for (item of items(); track item.key; let index = $index) {
          <li role="none">
            <button
              class="neu-dock__item"
              type="button"
              role="menuitem"
              [disabled]="item.disabled"
              [class.is-active]="effectiveActiveKey() === item.key"
              [attr.aria-label]="item.label"
              [attr.aria-current]="effectiveActiveKey() === item.key ? 'page' : null"
              [attr.tabindex]="index === focusIndex() ? 0 : -1"
              [attr.data-index]="index"
              (focus)="focusIndex.set(index)"
              (click)="select(item)"
            >
              @if (item.image) { <img [src]="item.image" alt="" /> }
              @else { <span class="neu-dock__icon" aria-hidden="true">{{ item.icon || '•' }}</span> }
              @if (item.badge) { <span class="neu-dock__badge">{{ item.badge }}</span> }
              <span class="neu-dock__tooltip" role="tooltip">{{ item.label }}</span>
            </button>
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './neu-dock.component.scss',
})
export class NeuDockComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  readonly items = input<NeuDockItem<T>[]>([]);
  readonly position = input<'top' | 'bottom' | 'start' | 'end'>('bottom');
  readonly ariaLabel = input('Application dock');
  readonly activeKey = input<string | null>(null);
  readonly itemClick = output<NeuDockItem<T>>();
  readonly activeKeyChange = output<string>();
  readonly internalActiveKey = signal<string | null>(null);
  readonly focusIndex = signal(0);
  readonly effectiveActiveKey = () => this.activeKey() ?? this.internalActiveKey();
  readonly isVertical = () => this.position() === 'start' || this.position() === 'end';

  select(item: NeuDockItem<T>): void {
    if (item.disabled) return;
    this.internalActiveKey.set(item.key); this.activeKeyChange.emit(item.key); this.itemClick.emit(item);
  }
  onKeydown(event: KeyboardEvent): void {
    const horizontal = !this.isVertical();
    const previousKey = horizontal
      ? (this.directionality.valueSignal() === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
      : 'ArrowUp';
    const nextKey = horizontal
      ? (this.directionality.valueSignal() === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
      : 'ArrowDown';
    if (![previousKey, nextKey, 'Home', 'End'].includes(event.key)) return;
    const buttons = this.buttons(); if (!buttons.length) return;
    event.preventDefault();
    let index = this.focusIndex();
    index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === nextKey ? 1 : -1) + buttons.length) % buttons.length;
    this.focusIndex.set(index); buttons[index]?.focus();
  }
  private buttons(): HTMLButtonElement[] { return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-dock__item:not(:disabled)')); }
}
