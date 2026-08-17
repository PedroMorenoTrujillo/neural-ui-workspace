import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface NeuCascadeOption<T = unknown> {
  value: string;
  label: string;
  children?: NeuCascadeOption<T>[];
  disabled?: boolean;
  data?: T;
}

let cascadeId = 0;

@Component({
  selector: 'neu-cascade-select',
  imports: [OverlayModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuCascadeSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-cascade-select-host',
    '(keydown.escape)': 'close(true)',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-cascade-select__static-label" [for]="triggerId">{{ label() }}</label>
    }
    <div
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="neu-cascade-select"
      [class.neu-cascade-select--open]="open()"
      [class.neu-cascade-select--disabled]="isDisabled()"
      [class.neu-cascade-select--error]="error()"
      [class.neu-cascade-select--has-value]="selectedPath().length > 0"
    >
      <button
        #trigger
        class="neu-cascade-select__trigger"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        [id]="triggerId"
        [attr.aria-label]="label() || placeholder()"
        [disabled]="isDisabled()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="panelId"
        [attr.aria-invalid]="error() || null"
        [attr.aria-describedby]="describedBy() || null"
        (click)="toggle()"
        (keydown.arrowDown)="openPanel($event)"
      >
        @if (floatingLabel() && label()) {
          <span class="neu-cascade-select__label">{{ label() }}</span>
        }
        <span class="neu-cascade-select__value" [class.is-placeholder]="!selectedPath().length">
          {{ displayValue() || placeholder() }}
        </span>
        <span class="neu-cascade-select__chevron" aria-hidden="true">⌄</span>
      </button>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      [cdkConnectedOverlayPush]="true"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <div
        class="neu-cascade-select__panel"
        [id]="panelId"
        role="group"
        [attr.aria-label]="panelAriaLabel()"
        (keydown)="onPanelKeydown($event)"
      >
        @for (column of columns(); track $index; let columnIndex = $index) {
          <div
            class="neu-cascade-select__column"
            role="listbox"
            [attr.aria-label]="levelAriaLabel() + ' ' + (columnIndex + 1)"
          >
            @for (option of column; track option.value; let optionIndex = $index) {
              <button
                class="neu-cascade-select__option"
                type="button"
                role="option"
                [disabled]="option.disabled"
                [attr.data-column]="columnIndex"
                [attr.data-index]="optionIndex"
                [attr.aria-selected]="selectedPath()[columnIndex]?.value === option.value"
                [class.is-active]="selectedPath()[columnIndex]?.value === option.value"
                [attr.tabindex]="columnIndex === activeColumn() && optionIndex === activeRow() ? 0 : -1"
                (click)="choose(option, columnIndex)"
              >
                <span>{{ option.label }}</span>
                @if (option.children?.length) {
                  <span aria-hidden="true">{{ childArrow() }}</span>
                }
              </button>
            }
          </div>
        }
        @if (!options().length) {
          <div class="neu-cascade-select__empty" role="status">{{ emptyLabel() }}</div>
        }
      </div>
    </ng-template>
    @if (error()) {
      <p class="neu-cascade-select__error" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p class="neu-cascade-select__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-cascade-select.component.scss',
})
export class NeuCascadeSelectComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly directionality = inject(Directionality);

  readonly options = input<NeuCascadeOption[]>([]);
  readonly label = input('');
  readonly placeholder = input('Select an option');
  readonly separator = input(' / ');
  readonly floatingLabel = input(true);
  readonly disabled = input(false);
  readonly hint = input('');
  readonly error = input('');
  readonly describedBy = input('');
  readonly panelAriaLabel = input('Hierarchical options');
  readonly levelAriaLabel = input('Level');
  readonly emptyLabel = input('No options available');

  readonly valueChange = output<string | null>();
  readonly pathChange = output<NeuCascadeOption[]>();
  readonly openChange = output<boolean>();

  readonly triggerId = `neu-cascade-select-${++cascadeId}`;
  readonly panelId = `${this.triggerId}-panel`;
  readonly open = signal(false);
  readonly activeColumn = signal(0);
  readonly activeRow = signal(0);
  private readonly cvaDisabled = signal(false);
  private readonly value = signal<string | null>(null);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly childArrow = computed(() =>
    this.directionality.valueSignal() === 'rtl' ? '‹' : '›',
  );
  readonly selectedPath = computed(() => this.findPath(this.options(), this.value()) ?? []);
  readonly columns = computed(() => {
    const path = this.selectedPath();
    const result: NeuCascadeOption[][] = [this.options()];
    for (const item of path) {
      if (item.children?.length) result.push(item.children);
    }
    return result;
  });
  readonly displayValue = computed(() =>
    this.selectedPath()
      .map((option) => option.label)
      .join(this.separator()),
  );

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const columns = this.columns();
      if (this.activeColumn() >= columns.length) this.activeColumn.set(Math.max(0, columns.length - 1));
    });
  }

  writeValue(value: string | null): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
  }

  toggle(): void {
    this.open() ? this.close() : this.openPanel();
  }
  openPanel(event?: Event): void {
    if (this.isDisabled()) return;
    event?.preventDefault();
    this.open.set(true);
    this.openChange.emit(true);
    queueMicrotask(() => this.focusActive());
  }
  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    this.openChange.emit(false);
    this.onTouched();
    if (restoreFocus) queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('.neu-cascade-select__trigger')?.focus());
  }

  choose(option: NeuCascadeOption, columnIndex: number): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.activeColumn.set(columnIndex);
    this.activeRow.set(Math.max(0, this.columns()[columnIndex]?.findIndex((item) => item.value === option.value) ?? 0));
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.pathChange.emit(this.selectedPath());
    if (option.children?.length) {
      this.activeColumn.set(columnIndex + 1);
      this.activeRow.set(this.firstEnabledIndex(option.children));
      queueMicrotask(() => this.focusActive());
    } else {
      this.close(true);
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const rtl = this.directionality.valueSignal() === 'rtl';
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const previousKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (!['ArrowDown', 'ArrowUp', nextKey, previousKey, 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    const column = this.columns()[this.activeColumn()] ?? [];
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.activeRow.set(this.nextEnabledIndex(column, this.activeRow(), direction));
    } else if (event.key === 'Home') {
      this.activeRow.set(this.firstEnabledIndex(column));
    } else if (event.key === 'End') {
      this.activeRow.set(this.lastEnabledIndex(column));
    } else if (event.key === nextKey) {
      const active = column[this.activeRow()];
      if (active?.children?.length) this.choose(active, this.activeColumn());
    } else if (event.key === previousKey && this.activeColumn() > 0) {
      this.activeColumn.update((value) => value - 1);
      const selected = this.selectedPath()[this.activeColumn()];
      this.activeRow.set(Math.max(0, this.columns()[this.activeColumn()]?.findIndex((item) => item.value === selected?.value) ?? 0));
    } else {
      const active = column[this.activeRow()];
      if (active) this.choose(active, this.activeColumn());
    }
    queueMicrotask(() => this.focusActive());
  }

  private focusActive(): void {
    this.document.querySelector<HTMLElement>(
      `#${this.panelId} .neu-cascade-select__option[data-column="${this.activeColumn()}"][data-index="${this.activeRow()}"]`,
    )?.focus();
  }
  private firstEnabledIndex(options: NeuCascadeOption[]): number {
    return Math.max(0, options.findIndex((option) => !option.disabled));
  }
  private lastEnabledIndex(options: NeuCascadeOption[]): number {
    const index = [...options].reverse().findIndex((option) => !option.disabled);
    return index < 0 ? 0 : options.length - index - 1;
  }
  private nextEnabledIndex(options: NeuCascadeOption[], current: number, direction: 1 | -1): number {
    if (!options.length) return 0;
    let index = current;
    for (let attempt = 0; attempt < options.length; attempt += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return current;
  }
  private findPath(options: NeuCascadeOption[], value: string | null): NeuCascadeOption[] | null {
    if (value === null) return null;
    for (const option of options) {
      if (option.value === value) return [option];
      const childPath = this.findPath(option.children ?? [], value);
      if (childPath) return [option, ...childPath];
    }
    return null;
  }
}
