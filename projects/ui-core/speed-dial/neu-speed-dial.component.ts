import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, inject, input, output, signal } from '@angular/core';

export interface NeuSpeedDialAction<T = unknown> {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  data?: T;
}

@Component({
  selector: 'neu-speed-dial',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-speed-dial-host' },
  template: `
    <div class="neu-speed-dial neu-speed-dial--{{ type() }} neu-speed-dial--{{ direction() }}" [style.--neu-speed-radius.px]="radius()">
      <button
        class="neu-speed-dial__trigger"
        type="button"
        [attr.aria-label]="open() ? closeLabel() : triggerLabel()"
        [attr.aria-expanded]="open()"
        aria-haspopup="menu"
        (click)="toggle()"
        (keydown.arrowdown)="openMenu($event)"
      ><span aria-hidden="true">{{ open() ? closeIcon() : icon() }}</span></button>
      @if (open()) {
        <div class="neu-speed-dial__menu" role="menu" [attr.aria-label]="menuAriaLabel()" (keydown)="onKeydown($event)">
          @for (action of actions(); track action.key; let index = $index) {
            <button
              class="neu-speed-dial__action"
              type="button"
              role="menuitem"
              [disabled]="action.disabled"
              [attr.aria-label]="action.label"
              [attr.data-index]="index"
              [style.--neu-speed-angle.deg]="actionAngle(index)"
              (click)="select(action)"
            >
              <span class="neu-speed-dial__action-icon" aria-hidden="true">{{ action.icon || '•' }}</span>
              @if (showLabels()) { <span class="neu-speed-dial__label">{{ action.label }}</span> }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './neu-speed-dial.component.scss',
})
export class NeuSpeedDialComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly actions = input<NeuSpeedDialAction<T>[]>([]);
  readonly type = input<'linear' | 'circle' | 'semi-circle' | 'quarter-circle'>('linear');
  readonly direction = input<'up' | 'down' | 'start' | 'end'>('up');
  readonly radius = input(92);
  readonly icon = input('+');
  readonly closeIcon = input('×');
  readonly triggerLabel = input('Open actions');
  readonly closeLabel = input('Close actions');
  readonly menuAriaLabel = input('Quick actions');
  readonly showLabels = input(true);
  readonly actionClick = output<NeuSpeedDialAction<T>>();
  readonly openChange = output<boolean>();
  readonly open = signal(false);

  toggle(): void { this.open() ? this.close() : this.openMenu(); }
  openMenu(event?: Event): void {
    event?.preventDefault();
    if (this.open()) return;
    this.open.set(true); this.openChange.emit(true);
    queueMicrotask(() => this.buttons()[0]?.focus());
  }
  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false); this.openChange.emit(false);
    if (restoreFocus) queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('.neu-speed-dial__trigger')?.focus());
  }
  select(action: NeuSpeedDialAction<T>): void { if (!action.disabled) { this.actionClick.emit(action); this.close(true); } }
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); this.close(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = this.buttons(); if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (forward ? 1 : -1) + buttons.length) % buttons.length;
    buttons[index]?.focus();
  }
  actionAngle(index: number): number {
    const count = Math.max(1, this.actions().length);
    if (this.type() === 'circle') return (360 / count) * index;
    if (this.type() === 'semi-circle') return -90 + (count === 1 ? 90 : (180 / (count - 1)) * index);
    return this.direction() === 'up' || this.direction() === 'end'
      ? (count === 1 ? 45 : (90 / Math.max(1, count - 1)) * index)
      : 180 + (count === 1 ? 45 : (90 / Math.max(1, count - 1)) * index);
  }
  private buttons(): HTMLButtonElement[] { return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-speed-dial__action:not(:disabled)')); }
}
