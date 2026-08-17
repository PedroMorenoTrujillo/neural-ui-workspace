import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';

export interface NeuPanelMenuItem<T = unknown> {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
  expanded?: boolean;
  children?: NeuPanelMenuItem<T>[];
  data?: T;
}

@Component({
  selector: 'neu-panel-menu',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-panel-menu-host' },
  template: `
    <nav class="neu-panel-menu" [attr.aria-label]="ariaLabel()" (keydown)="onKeydown($event)">
      <ul class="neu-panel-menu__list neu-panel-menu__list--root" role="none">
        <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: items(), level: 1 }" />
      </ul>
    </nav>

    <ng-template #branch let-branchItems let-level="level">
      @for (item of branchItems; track item.key) {
        <li class="neu-panel-menu__entry" role="none">
          <button
            class="neu-panel-menu__item"
            type="button"
            [disabled]="item.disabled"
            [attr.data-key]="item.key"
            [attr.aria-expanded]="item.children?.length ? isExpanded(item.key) : null"
            [attr.aria-current]="selectedKey() === item.key ? 'page' : null"
            [style.padding-inline-start.rem]=".75 + (level - 1) * 1.1"
            (click)="activate(item)"
          >
            @if (item.icon) { <span class="neu-panel-menu__icon" aria-hidden="true">{{ item.icon }}</span> }
            <span class="neu-panel-menu__copy"><strong>{{ item.label }}</strong>@if (item.description) { <small>{{ item.description }}</small> }</span>
            @if (item.badge) { <span class="neu-panel-menu__badge">{{ item.badge }}</span> }
            @if (item.children?.length) { <span class="neu-panel-menu__chevron" [class.is-open]="isExpanded(item.key)" aria-hidden="true">{{ childArrow() }}</span> }
          </button>
          @if (item.children?.length && isExpanded(item.key)) {
            <ul class="neu-panel-menu__list" role="group">
              <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: item.children ?? [], level: level + 1 }" />
            </ul>
          }
        </li>
      }
    </ng-template>
  `,
  styleUrl: './neu-panel-menu.component.scss',
})
export class NeuPanelMenuComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  readonly items = input<NeuPanelMenuItem<T>[]>([]);
  readonly multiple = input(false);
  readonly ariaLabel = input('Panel menu');
  readonly itemClick = output<NeuPanelMenuItem<T>>();
  readonly selectionChange = output<NeuPanelMenuItem<T> | null>();
  readonly expansionChange = output<string[]>();
  readonly selectedKey = signal<string | null>(null);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly childArrow = () => this.directionality.valueSignal() === 'rtl' ? '‹' : '›';

  constructor() {
    effect(() => this.expandedKeys.set(new Set(this.collectExpanded(this.items()))));
  }

  isExpanded(key: string): boolean { return this.expandedKeys().has(key); }
  activate(item: NeuPanelMenuItem<T>): void {
    if (item.disabled) return;
    if (item.children?.length) this.toggle(item.key);
    else {
      this.selectedKey.set(item.key);
      this.itemClick.emit(item);
      this.selectionChange.emit(item);
    }
  }
  toggle(key: string): void {
    const next = new Set(this.multiple() ? this.expandedKeys() : []);
    if (this.expandedKeys().has(key)) next.delete(key); else next.add(key);
    this.expandedKeys.set(next);
    this.expansionChange.emit([...next]);
  }
  onKeydown(event: KeyboardEvent): void {
    const buttons = this.buttons();
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); buttons[(current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); (event.key === 'Home' ? buttons[0] : buttons.at(-1))?.focus();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const key = (event.target as HTMLElement).dataset['key'];
      const item = key ? this.findItem(this.items(), key) : null;
      if (!item?.children?.length) return;
      const expandKey = this.directionality.valueSignal() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      event.preventDefault();
      if (event.key === expandKey && !this.isExpanded(item.key)) this.toggle(item.key);
      else if (event.key !== expandKey && this.isExpanded(item.key)) this.toggle(item.key);
    }
  }
  private buttons(): HTMLButtonElement[] { return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-panel-menu__item:not(:disabled)')); }
  private collectExpanded(items: NeuPanelMenuItem<T>[]): string[] { return items.flatMap((item) => [...(item.expanded ? [item.key] : []), ...this.collectExpanded(item.children ?? [])]); }
  private findItem(items: NeuPanelMenuItem<T>[], key: string): NeuPanelMenuItem<T> | null {
    for (const item of items) { if (item.key === key) return item; const child = this.findItem(item.children ?? [], key); if (child) return child; }
    return null;
  }
}
