import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _neuDateInputIdSeq = 0;

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface DrumSlot {
  value: number;
  offset: number;
  label: string;
}

@Component({
  selector: 'neu-date-input',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-date-input-host',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuDateInputComponent),
      multi: true,
    },
  ],
  template: `
    @if (label()) {
      <label class="neu-date-input__label" [for]="_id">{{ label() }}</label>
    }
    <div
      class="neu-date-input"
      [class.neu-date-input--open]="isOpen()"
      [class.neu-date-input--disabled]="isDisabledFinal()"
      [class.neu-date-input--error]="hasError()"
    >
      <!-- Trigger -->
      <button
        class="neu-date-input__trigger"
        type="button"
        [id]="_id"
        [disabled]="isDisabledFinal() || readonly()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'dialog'"
        (click)="toggle()"
      >
        <span class="neu-date-input__icon" aria-hidden="true">
          @if (type() === 'time') {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          } @else {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        </span>
        <span
          class="neu-date-input__display"
          [class.neu-date-input__display--placeholder]="!_value()"
        >
          {{ displayValue() || placeholderText() }}
        </span>
      </button>

      <!-- Panel -->
      @if (isOpen()) {
        <div
          class="neu-date-input__panel"
          [class.neu-date-input__panel--time-only]="type() === 'time'"
          role="dialog"
          [attr.aria-label]="'Choose date' + (monthLabel() ? ': ' + monthLabel() : '')"
          (click)="$event.stopPropagation()"
        >
          <!-- ── Calendar (date / datetime-local) ── -->
          @if (type() !== 'time') {
            <div class="neu-date-input__calendar">
              <div class="neu-date-input__cal-nav">
                <button
                  class="neu-date-input__cal-arrow"
                  type="button"
                  (click)="prevMonth()"
                  aria-label="Mes anterior"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span class="neu-date-input__cal-title">{{ monthLabel() }}</span>
                <button
                  class="neu-date-input__cal-arrow"
                  type="button"
                  (click)="nextMonth()"
                  aria-label="Mes siguiente"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div class="neu-date-input__cal-weekdays">
                @for (d of weekdays; track d) {
                  <span>{{ d }}</span>
                }
              </div>

              <div class="neu-date-input__cal-grid">
                @for (day of calendarDays(); track day.date.getTime()) {
                  <button
                    class="neu-date-input__cal-day"
                    type="button"
                    [class.neu-date-input__cal-day--other]="!day.inMonth"
                    [class.neu-date-input__cal-day--today]="day.isToday"
                    [class.neu-date-input__cal-day--selected]="day.isSelected"
                    [attr.aria-label]="formatDayLabel(day.date)"
                    [attr.aria-pressed]="day.isSelected"
                    (click)="selectDay(day)"
                  >
                    {{ day.date.getDate() }}
                  </button>
                }
              </div>

              <div class="neu-date-input__cal-footer">
                <button class="neu-date-input__cal-footer-btn" type="button" (click)="clear()">
                  Borrar
                </button>
                <button
                  class="neu-date-input__cal-footer-btn neu-date-input__cal-footer-btn--today"
                  type="button"
                  (click)="today()"
                >
                  Hoy
                </button>
              </div>
            </div>
          }

          <!-- ── Separator ── -->
          @if (type() === 'datetime-local') {
            <div class="neu-date-input__sep"></div>
          }

          <!-- ── Time drum (time / datetime-local) ── -->
          @if (type() !== 'date') {
            <div class="neu-date-input__time">
              <!-- Hours -->
              <div class="neu-date-input__drum">
                <button
                  class="neu-date-input__drum-arrow"
                  type="button"
                  (click)="changeHour(-1)"
                  aria-label="Hora anterior"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <div class="neu-date-input__drum-track" (wheel)="onHourWheel($event)">
                  @for (slot of hourSlots(); track slot.offset) {
                    <div
                      class="neu-date-input__drum-item"
                      [class.neu-date-input__drum-item--selected]="slot.offset === 0"
                      [class.neu-date-input__drum-item--adjacent]="slot.offset !== 0"
                      (click)="slot.offset !== 0 && changeHour(slot.offset)"
                    >
                      {{ slot.label }}
                    </div>
                  }
                </div>
                <button
                  class="neu-date-input__drum-arrow"
                  type="button"
                  (click)="changeHour(1)"
                  aria-label="Hora siguiente"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              <span class="neu-date-input__time-colon">:</span>

              <!-- Minutes -->
              <div class="neu-date-input__drum">
                <button
                  class="neu-date-input__drum-arrow"
                  type="button"
                  (click)="changeMinute(-1)"
                  aria-label="Minuto anterior"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <div class="neu-date-input__drum-track" (wheel)="onMinuteWheel($event)">
                  @for (slot of minuteSlots(); track slot.offset) {
                    <div
                      class="neu-date-input__drum-item"
                      [class.neu-date-input__drum-item--selected]="slot.offset === 0"
                      [class.neu-date-input__drum-item--adjacent]="slot.offset !== 0"
                      (click)="slot.offset !== 0 && changeMinute(slot.offset)"
                    >
                      {{ slot.label }}
                    </div>
                  }
                </div>
                <button
                  class="neu-date-input__drum-arrow"
                  type="button"
                  (click)="changeMinute(1)"
                  aria-label="Minuto siguiente"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (hasError()) {
      <p class="neu-date-input__error" role="alert">{{ errorMessage() }}</p>
    } @else if (hint()) {
      <p class="neu-date-input__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-date-input.component.scss',
})
export class NeuDateInputComponent implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Tipo: date | time | datetime-local / Type: date | time | datetime-local */
  type = input<'date' | 'time' | 'datetime-local'>('date');

  /** Etiqueta del campo / Field label */
  label = input<string>('');

  /** Texto de ayuda / Help text */
  hint = input<string>('');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Deshabilita el campo / Disables the field */
  disabled = input<boolean>(false);

  /** Solo lectura / Read only */
  readonly = input<boolean>(false);

  /** Nombre del campo (formularios nativos) / Field name (native forms) */
  name = input<string>('');

  /** ID accesible / Accessible ID */
  inputId = input<string>('');

  /** Requerido / Required */
  required = input<boolean>(false);

  /** Mínimo (no implementado visualmente en v1) / Minimum (not visually implemented in v1) */
  min = input<string | null>(null);

  /** Máximo (no implementado visualmente en v1) / Maximum (not visually implemented in v1) */
  max = input<string | null>(null);

  /** Paso / Step */
  step = input<number | null>(null);

  // ── Estado ──────────────────────────────────────────────
  protected readonly _id = `neu-date-input-${++_neuDateInputIdSeq}`;
  readonly isOpen = signal(false);

  protected readonly _value = signal<string>('');
  protected readonly _viewYear = signal(new Date().getFullYear());
  protected readonly _viewMonth = signal(new Date().getMonth());
  protected readonly _selYear = signal<number | null>(null);
  protected readonly _selMonth = signal<number | null>(null);
  protected readonly _selDay = signal<number | null>(null);
  protected readonly _selHour = signal(0);
  protected readonly _selMinute = signal(0);

  readonly hasError = computed(() => !!this.errorMessage());

  // ── Display ──────────────────────────────────────────────
  readonly displayValue = computed(() => {
    const v = this._value();
    if (!v) return '';
    const t = this.type();
    if (t === 'date') {
      const d = new Date(v + 'T00:00:00');
      return isNaN(d.getTime())
        ? v
        : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (t === 'time') return v;
    const [datePart, timePart] = v.split('T');
    const d = new Date(datePart + 'T00:00:00');
    return (
      (isNaN(d.getTime())
        ? datePart
        : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })) +
      ', ' +
      (timePart?.slice(0, 5) ?? '')
    );
  });

  readonly placeholderText = computed(() => {
    switch (this.type()) {
      case 'time':
        return 'hh:mm';
      case 'datetime-local':
        return 'dd/mm/aaaa, hh:mm';
      default:
        return 'dd/mm/aaaa';
    }
  });

  // ── Calendar ─────────────────────────────────────────────
  readonly monthLabel = computed(() =>
    new Date(this._viewYear(), this._viewMonth(), 1).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  readonly calendarDays = computed((): CalendarDay[] => {
    const year = this._viewYear();
    const month = this._viewMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6
    const days: CalendarDay[] = [];

    for (let i = startDow; i > 0; i--) {
      days.push({
        date: new Date(year, month, 1 - i),
        inMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        inMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: this._selYear() === year && this._selMonth() === month && this._selDay() === d,
      });
    }
    let next = 1;
    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, next++),
        inMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    return days;
  });

  // ── Drum ─────────────────────────────────────────────────
  readonly hourSlots = computed(() => this._drumSlots(this._selHour(), 24));
  readonly minuteSlots = computed(() => this._drumSlots(this._selMinute(), 60));

  private _drumSlots(value: number, max: number): DrumSlot[] {
    return [-1, 0, 1].map((offset) => {
      const v = (((value + offset) % max) + max) % max;
      return { value: v, offset, label: String(v).padStart(2, '0') };
    });
  }

  // ── Actions ──────────────────────────────────────────────
  toggle(): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) this.close();
  }

  prevMonth(): void {
    if (this._viewMonth() === 0) {
      this._viewMonth.set(11);
      this._viewYear.update((y) => y - 1);
    } else this._viewMonth.update((m) => m - 1);
  }

  nextMonth(): void {
    if (this._viewMonth() === 11) {
      this._viewMonth.set(0);
      this._viewYear.update((y) => y + 1);
    } else this._viewMonth.update((m) => m + 1);
  }

  selectDay(day: CalendarDay): void {
    if (!day.inMonth) return;
    this._selYear.set(day.date.getFullYear());
    this._selMonth.set(day.date.getMonth());
    this._selDay.set(day.date.getDate());
    this._emitValue();
    if (this.type() === 'date') this.close();
  }

  formatDayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  today(): void {
    const d = new Date();
    this._viewYear.set(d.getFullYear());
    this._viewMonth.set(d.getMonth());
    this.selectDay({ date: d, inMonth: true, isToday: true, isSelected: false });
  }

  clear(): void {
    this._selYear.set(null);
    this._selMonth.set(null);
    this._selDay.set(null);
    this._value.set('');
    this._onChange('');
    this.close();
  }

  changeHour(delta: number): void {
    this._selHour.update((h) => (((h + delta) % 24) + 24) % 24);
    this._emitValue();
  }

  changeMinute(delta: number): void {
    this._selMinute.update((m) => (((m + delta) % 60) + 60) % 60);
    this._emitValue();
  }

  onHourWheel(e: WheelEvent): void {
    e.preventDefault();
    this.changeHour(e.deltaY > 0 ? 1 : -1);
  }
  onMinuteWheel(e: WheelEvent): void {
    e.preventDefault();
    this.changeMinute(e.deltaY > 0 ? 1 : -1);
  }

  private _emitValue(): void {
    const t = this.type();
    let v = '';
    if (t === 'date' || t === 'datetime-local') {
      if (this._selYear() === null) return;
      const y = this._selYear()!;
      const mo = String(this._selMonth()! + 1).padStart(2, '0');
      const d = String(this._selDay()!).padStart(2, '0');
      const ds = `${y}-${mo}-${d}`;
      v =
        t === 'date'
          ? ds
          : `${ds}T${String(this._selHour()).padStart(2, '0')}:${String(this._selMinute()).padStart(2, '0')}`;
    } else {
      v = `${String(this._selHour()).padStart(2, '0')}:${String(this._selMinute()).padStart(2, '0')}`;
    }
    this._value.set(v);
    this._onChange(v);
  }

  // ── CVA ─────────────────────────────────────────────────
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const v = value ?? '';
    this._value.set(v);
    if (!v) return;
    const t = this.type();
    if (t === 'date') {
      const d = new Date(v + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        this._selYear.set(d.getFullYear());
        this._selMonth.set(d.getMonth());
        this._selDay.set(d.getDate());
        this._viewYear.set(d.getFullYear());
        this._viewMonth.set(d.getMonth());
      }
    } else if (t === 'time') {
      const [h, m] = v.split(':').map(Number);
      if (!isNaN(h)) this._selHour.set(h);
      if (!isNaN(m)) this._selMinute.set(m);
    } else {
      const [datePart, timePart] = v.split('T');
      if (datePart) {
        const d = new Date(datePart + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          this._selYear.set(d.getFullYear());
          this._selMonth.set(d.getMonth());
          this._selDay.set(d.getDate());
          this._viewYear.set(d.getFullYear());
          this._viewMonth.set(d.getMonth());
        }
      }
      if (timePart) {
        const [h, m] = timePart.split(':').map(Number);
        if (!isNaN(h)) this._selHour.set(h);
        if (!isNaN(m)) this._selMinute.set(m);
      }
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  private readonly _cvaDisabled = signal(false);
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());
}
