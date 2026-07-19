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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuIconComponent } from '@neural-ui/core/icon';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import { NeuSelectComponent, NeuSelectOption } from '@neural-ui/core/select';
import { NeuTextareaComponent } from '@neural-ui/core/textarea';

export type NeuInlineEditorType = 'text' | 'number' | 'select' | 'textarea' | 'date';
export type NeuInlineEditorSize = 'sm' | 'md' | 'lg';

export interface NeuInlineEditorCommitEvent<T = string | number | null> {
  previousValue: T;
  value: T;
}

@Component({
  selector: 'neu-inline-editor',
  imports: [
    ReactiveFormsModule,
    NeuButtonComponent,
    NeuIconComponent,
    NeuInputComponent,
    NeuDateInputComponent,
    NeuNumberInputComponent,
    NeuSelectComponent,
    NeuTextareaComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuInlineEditorComponent),
      multi: true,
    },
  ],
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-disabled]': 'isDisabled()',
  },
  template: `
    @if (editing()) {
      <div
        class="neu-inline-editor__edit"
        (keydown)="onEditKeydown($event)"
        (focusout)="onEditFocusout($event)"
      >
        @switch (type()) {
          @case ('select') {
            <neu-select
              class="neu-inline-editor__control"
              [options]="options()"
              [formControl]="stringControl"
              [size]="size()"
              [floatingLabel]="false"
              [placeholder]="placeholder()"
            />
          }
          @case ('number') {
            <neu-number-input
              class="neu-inline-editor__control"
              [formControl]="numberControl"
              [size]="size()"
              [min]="min()"
              [max]="max()"
              [step]="step()"
            />
          }
          @case ('textarea') {
            <neu-textarea
              class="neu-inline-editor__control"
              [formControl]="stringControl"
              [size]="size()"
              [label]="placeholder()"
              [rows]="rows()"
            />
          }
          @case ('date') {
            <neu-date-input
              class="neu-inline-editor__control"
              [formControl]="stringControl"
              [size]="size()"
              [placeholder]="placeholder()"
            />
          }
          @default {
            <neu-input
              class="neu-inline-editor__control"
              [formControl]="stringControl"
              [size]="size()"
              [floatingLabel]="false"
              [placeholder]="placeholder()"
            />
          }
        }

        <div class="neu-inline-editor__actions">
          <button
            neu-button
            type="button"
            variant="primary"
            [size]="size()"
            icon="lucideCheck"
            [iconOnly]="true"
            [ariaLabel]="saveLabel()"
            [disabled]="isDisabled()"
            (click)="commit()"
          ></button>
          <button
            neu-button
            type="button"
            variant="ghost"
            [size]="size()"
            icon="lucideX"
            [iconOnly]="true"
            [ariaLabel]="cancelLabel()"
            (click)="cancel()"
          ></button>
        </div>
      </div>
    } @else {
      <button
        neu-button
        class="neu-inline-editor__display"
        type="button"
        variant="ghost"
        [size]="size()"
        [disabled]="isDisabled() || readonly()"
        [attr.aria-label]="editLabel()"
        (click)="beginEdit()"
      >
        <span class="neu-inline-editor__value" [class.neu-inline-editor__value--empty]="isEmpty()">
          {{ displayValue() }}
        </span>
        @if (!readonly()) {
          <neu-icon name="lucidePencil" size="14px" aria-hidden="true" />
        }
      </button>
    }
  `,
  styleUrl: './neu-inline-editor.component.scss',
})
export class NeuInlineEditorComponent implements ControlValueAccessor {
  private readonly _host = inject(ElementRef<HTMLElement>);

  readonly value = input<string | number | null>(null);
  readonly type = input<NeuInlineEditorType>('text');
  readonly size = input<NeuInlineEditorSize>('sm');
  readonly options = input<NeuSelectOption[]>([]);
  readonly placeholder = input('');
  readonly emptyLabel = input('Empty');
  readonly editLabel = input('Edit value');
  readonly saveLabel = input('Save value');
  readonly cancelLabel = input('Cancel edit');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly startInEdit = input(false);
  readonly saveOnBlur = input(false);
  readonly min = input(-Infinity);
  readonly max = input(Infinity);
  readonly step = input(1);
  readonly rows = input(3);

  readonly valueChange = output<string | number | null>();
  readonly editStart = output<string | number | null>();
  readonly editCancel = output<string | number | null>();
  readonly editCommit = output<NeuInlineEditorCommitEvent>();

  readonly stringControl = new FormControl<string | null>(null);
  readonly numberControl = new FormControl<number>(0, { nonNullable: true });
  readonly editing = signal(false);
  private readonly _value = signal<string | number | null>(null);
  private readonly _snapshot = signal<string | number | null>(null);
  private readonly _cvaDisabled = signal(false);
  private _onChange: (value: string | number | null) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly isDisabled = computed(() => this.disabled() || this._cvaDisabled());
  readonly isEmpty = computed(() => {
    const value = this._value();
    return value === null || value === undefined || value === '';
  });
  readonly displayValue = computed(() => {
    if (this.isEmpty()) return this.emptyLabel();
    const current = this._value();
    if (this.type() === 'select') {
      return this.options().find((option) => option.value === current)?.label ?? String(current);
    }
    return String(current);
  });

  constructor() {
    effect(() => {
      this._setValue(this.value(), false);
    });

    effect(() => {
      this.isDisabled();
      this._syncDisabledState();
    });

    effect(() => {
      if (this.startInEdit() && !this.editing()) {
        this.beginEdit();
      }
    });

    this.stringControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (this.type() !== 'number') {
        this._value.set(value);
      }
    });
    this.numberControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (this.type() === 'number') {
        this._value.set(Number.isFinite(value) ? value : null);
      }
    });
  }

  writeValue(value: string | number | null): void {
    this._setValue(value, false);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
    this._syncDisabledState();
  }

  beginEdit(): void {
    if (this.isDisabled() || this.readonly()) return;
    this._snapshot.set(this._value());
    this._syncControls(this._value());
    this.editing.set(true);
    this.editStart.emit(this._value());
    queueMicrotask(() => this._focusFirstControl());
  }

  commit(): void {
    if (this.isDisabled()) return;
    const previousValue = this._snapshot();
    const value = this.type() === 'number' ? this.numberControl.value : this.stringControl.value;
    const normalized = this._normalizeValue(value);
    this._setValue(normalized, true);
    this.editing.set(false);
    this._onTouched();
    this.editCommit.emit({ previousValue, value: normalized });
  }

  cancel(): void {
    const previousValue = this._snapshot();
    this._setValue(previousValue, false);
    this.editing.set(false);
    this._onTouched();
    this.editCancel.emit(previousValue);
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key === 'Enter' && this.type() !== 'textarea') {
      event.preventDefault();
      this.commit();
    }
  }

  onEditFocusout(event: FocusEvent): void {
    if (!this.saveOnBlur() || !this.editing()) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this._host.nativeElement.contains(nextTarget)) return;
    queueMicrotask(() => {
      if (this.editing()) {
        this.commit();
      }
    });
  }

  hostClasses(): Record<string, boolean> {
    return {
      'neu-inline-editor': true,
      [`neu-inline-editor--${this.size()}`]: true,
      'neu-inline-editor--editing': this.editing(),
      'neu-inline-editor--disabled': this.isDisabled(),
      'neu-inline-editor--readonly': this.readonly(),
    };
  }

  private _setValue(value: string | number | null | undefined, emit: boolean): void {
    const normalized = this._normalizeValue(value);
    this._value.set(normalized);
    this._syncControls(normalized);
    if (emit) {
      this.valueChange.emit(normalized);
      this._onChange(normalized);
    }
  }

  private _normalizeValue(value: string | number | null | undefined): string | number | null {
    if (value === undefined) return null;
    if (this.type() === 'number') {
      const next = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(next) ? next : null;
    }
    return value === null ? null : String(value);
  }

  private _syncControls(value: string | number | null): void {
    this.stringControl.setValue(value === null ? null : String(value), { emitEvent: false });
    this.numberControl.setValue(typeof value === 'number' ? value : Number(value ?? 0), {
      emitEvent: false,
    });
    this._syncDisabledState();
  }

  private _syncDisabledState(): void {
    const method = this.isDisabled() ? 'disable' : 'enable';
    this.stringControl[method]({ emitEvent: false });
    this.numberControl[method]({ emitEvent: false });
  }

  private _focusFirstControl(): void {
    const control = (this._host.nativeElement as HTMLElement).querySelector(
      '.neu-input__field, .neu-number-input__field, .neu-select__trigger, .neu-textarea__field',
    ) as HTMLElement | null;
    control?.focus();
  }
}
