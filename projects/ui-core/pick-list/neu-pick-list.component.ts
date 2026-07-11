import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, signal } from '@angular/core';

export interface NeuTransferItem {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

@Component({
  selector: 'neu-pick-list',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-pick-list' },
  template: `
    <section class="neu-pick-list__column">
      <h3>{{ sourceHeader() }}</h3>
      @for (item of source(); track item.value) {
        <button type="button" [class.is-selected]="sourceSelection().has(item.value)" [disabled]="item.disabled" (click)="toggleSource(item.value)">
          {{ item.label }}
        </button>
      }
    </section>
    <div class="neu-pick-list__actions">
      <button type="button" (click)="moveToTarget()" [disabled]="!sourceSelection().size">›</button>
      <button type="button" (click)="moveToSource()" [disabled]="!targetSelection().size">‹</button>
    </div>
    <section class="neu-pick-list__column">
      <h3>{{ targetHeader() }}</h3>
      @for (item of target(); track item.value) {
        <button type="button" [class.is-selected]="targetSelection().has(item.value)" [disabled]="item.disabled" (click)="toggleTarget(item.value)">
          {{ item.label }}
        </button>
      }
    </section>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuPickListComponent {
  readonly source = input<NeuTransferItem[]>([]);
  readonly target = input<NeuTransferItem[]>([]);
  readonly sourceHeader = input('Available');
  readonly targetHeader = input('Selected');
  readonly sourceChange = output<NeuTransferItem[]>();
  readonly targetChange = output<NeuTransferItem[]>();
  readonly itemsChange = output<{ source: NeuTransferItem[]; target: NeuTransferItem[] }>();
  readonly sourceSelection = signal(new Set<string>());
  readonly targetSelection = signal(new Set<string>());

  toggleSource(value: string): void {
    this.sourceSelection.set(this.toggleSet(this.sourceSelection(), value));
  }

  toggleTarget(value: string): void {
    this.targetSelection.set(this.toggleSet(this.targetSelection(), value));
  }

  moveToTarget(): void {
    const selected = this.sourceSelection();
    const moved = this.source().filter((item) => selected.has(item.value));
    this.commit(
      this.source().filter((item) => !selected.has(item.value)),
      [...this.target(), ...moved],
    );
    this.sourceSelection.set(new Set());
  }

  moveToSource(): void {
    const selected = this.targetSelection();
    const moved = this.target().filter((item) => selected.has(item.value));
    this.commit(
      [...this.source(), ...moved],
      this.target().filter((item) => !selected.has(item.value)),
    );
    this.targetSelection.set(new Set());
  }

  private commit(source: NeuTransferItem[], target: NeuTransferItem[]): void {
    this.sourceChange.emit(source);
    this.targetChange.emit(target);
    this.itemsChange.emit({ source, target });
  }

  private toggleSet(source: Set<string>, value: string): Set<string> {
    const next = new Set(source);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }
}

@Component({
  selector: 'neu-order-list',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-order-list' },
  template: `
    <div class="neu-order-list__items">
      @for (item of items(); track item.value; let i = $index) {
        <div class="neu-order-list__item">
          <span>{{ item.label }}</span>
          <button type="button" [disabled]="i === 0" (click)="move(i, -1)">↑</button>
          <button type="button" [disabled]="i === items().length - 1" (click)="move(i, 1)">↓</button>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-pick-list.component.scss',
})
export class NeuOrderListComponent {
  readonly items = input<NeuTransferItem[]>([]);
  readonly orderChange = output<NeuTransferItem[]>();

  move(index: number, direction: -1 | 1): void {
    const next = [...this.items()];
    const target = index + direction;
    [next[index], next[target]] = [next[target]!, next[index]!];
    this.orderChange.emit(next);
  }
}
