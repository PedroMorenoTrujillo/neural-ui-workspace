import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// ── Exported types ───────────────────────────────────────────────────────────

/** Rango de fechas seleccionado / Selected date range */
export interface NeuDateRange {
  start: Date | null;
  end: Date | null;
}

export interface NeuDatePreset {
  label: string;
  range: NeuDateRange | (() => NeuDateRange);
}

// ── Private helpers ──────────────────────────────────────────────────────────

let _neuDateInputIdSeq = 0;

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
}

interface DrumSlot {
  value: number;
  offset: number;
  label: string;
}

interface RangeCell {
  date: Date;
  day: number;
  ts: number;
  current: boolean;
  today: boolean;
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  label: string;
  disabled: boolean;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function cloneDate(d: Date): Date {
  return new Date(d.getTime());
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * NeuralUI DateInput — campo de fecha/hora unificado con modo rango.
 * Unified date/time field with range mode.
 *
 * Uso básico / Basic usage:
 *   <neu-date-input type="date"             [formControl]="dateCtrl" />
 *   <neu-date-input type="time"             [formControl]="timeCtrl" />
 *   <neu-date-input type="datetime-local"   [formControl]="dateTimeCtrl" />
 *   <neu-date-input type="range"            [formControl]="rangeCtrl" />
 */
@Component({
  selector: 'neu-date-input',
  imports: [OverlayModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-date-input-host',
    '[class.neu-date-input-host--sm]': 'size() === "sm"',
    '[class.neu-date-input-host--lg]': 'size() === "lg"',
    '[class.neu-drp]': '_isRange()',
    '[class.neu-drp--open]': '_isRange() && isOpen()',
    '[class.neu-drp--disabled]': '_isRange() && isDisabledFinal()',
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
    @if (_isRange()) {
      @if (label()) {
        <label class="neu-drp__label" [for]="_id">{{ label() }}</label>
      }
      <button
        cdkOverlayOrigin
        #rangeOrigin="cdkOverlayOrigin"
        type="button"
        [id]="_id"
        class="neu-drp__trigger"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="label() || _texts().rangeAriaLabel"
        [disabled]="isDisabledFinal()"
        (click)="toggle()"
      >
        <span class="neu-drp__icon" aria-hidden="true">
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
        </span>
        <span class="neu-drp__value" [class.neu-drp__value--placeholder]="!_hasRange()">
          {{ _hasRange() ? _rangeDisplayValue() : _rangePlaceholderText() }}
        </span>
      </button>
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="rangeOrigin"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="rangeOverlayPositions"
        [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayViewportMargin]="_viewportMargin"
        (backdropClick)="close()"
        (detach)="close()"
      >
        <div
          class="neu-drp__panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="_texts().rangeAriaLabel"
          (click)="$event.stopPropagation()"
        >
          @if (presets().length > 0) {
            <div class="neu-drp__presets" role="list">
              @for (preset of presets(); track preset.label) {
                <button type="button" class="neu-drp__preset" (click)="_applyPreset(preset)">
                  {{ preset.label }}
                </button>
              }
            </div>
          }
          <div class="neu-drp__calendars">
            <div class="neu-drp__cal">
              <div class="neu-drp__cal-nav">
                <button type="button" [attr.aria-label]="_texts().prevMonth" (click)="_prevLeft()">
                  ‹
                </button>
                <span class="neu-drp__cal-title">{{ _leftTitle() }}</span>
                <button type="button" [attr.aria-label]="_texts().nextMonth" (click)="_nextLeft()">
                  ›
                </button>
              </div>
              <div class="neu-drp__cal-grid">
                @for (d of _weekDayLabels(); track d) {
                  <span class="neu-drp__day-label">{{ d }}</span>
                }
                @for (cell of _leftDays(); track cell.ts) {
                  <button
                    type="button"
                    class="neu-drp__cell"
                    [class.neu-drp__cell--other-month]="!cell.current"
                    [class.neu-drp__cell--today]="cell.today"
                    [class.neu-drp__cell--selected]="cell.selected"
                    [class.neu-drp__cell--range-start]="cell.rangeStart"
                    [class.neu-drp__cell--range-end]="cell.rangeEnd"
                    [class.neu-drp__cell--in-range]="cell.inRange"
                    [disabled]="cell.disabled"
                    [attr.aria-label]="cell.label"
                    [attr.aria-pressed]="cell.selected"
                    (click)="_selectDay(cell.date)"
                    (mouseenter)="_hoverDay(cell.date)"
                  >
                    {{ cell.day }}
                  </button>
                }
              </div>
            </div>
            <div class="neu-drp__cal">
              <div class="neu-drp__cal-nav">
                <button type="button" [attr.aria-label]="_texts().prevMonth" (click)="_prevRight()">
                  ‹
                </button>
                <span class="neu-drp__cal-title">{{ _rightTitle() }}</span>
                <button type="button" [attr.aria-label]="_texts().nextMonth" (click)="_nextRight()">
                  ›
                </button>
              </div>
              <div class="neu-drp__cal-grid">
                @for (d of _weekDayLabels(); track d) {
                  <span class="neu-drp__day-label">{{ d }}</span>
                }
                @for (cell of _rightDays(); track cell.ts) {
                  <button
                    type="button"
                    class="neu-drp__cell"
                    [class.neu-drp__cell--other-month]="!cell.current"
                    [class.neu-drp__cell--today]="cell.today"
                    [class.neu-drp__cell--selected]="cell.selected"
                    [class.neu-drp__cell--range-start]="cell.rangeStart"
                    [class.neu-drp__cell--range-end]="cell.rangeEnd"
                    [class.neu-drp__cell--in-range]="cell.inRange"
                    [disabled]="cell.disabled"
                    [attr.aria-label]="cell.label"
                    [attr.aria-pressed]="cell.selected"
                    (click)="_selectDay(cell.date)"
                    (mouseenter)="_hoverDay(cell.date)"
                  >
                    {{ cell.day }}
                  </button>
                }
              </div>
            </div>
          </div>
          <div class="neu-drp__footer">
            <button type="button" class="neu-drp__clear" (click)="_clearRange()">
              {{ _texts().clear }}
            </button>
            <button
              type="button"
              class="neu-drp__apply"
              [disabled]="!_canApply()"
              (click)="_applyRange()"
            >
              {{ _texts().apply }}
            </button>
          </div>
        </div>
      </ng-template>
    } @else {
      @if (!floatingLabel() && label()) {
        <label class="neu-date-input__label" [for]="_id">{{ label() }}</label>
      }
      <div
        class="neu-date-input"
        [class.neu-date-input--open]="isOpen()"
        [class.neu-date-input--disabled]="isDisabledFinal()"
        [class.neu-date-input--error]="hasError()"
        [class.neu-date-input--has-value]="_value()"
        [class.neu-date-input--float]="floatingLabel()"
      >
        <button
          cdkOverlayOrigin
          #singleOrigin="cdkOverlayOrigin"
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
            {{ displayValue() || (floatingLabel() ? '' : placeholderText()) }}
          </span>
        </button>
        @if (floatingLabel() && label()) {
          <label class="neu-date-input__float-label" [for]="_id">{{ label() }}</label>
        }
        <ng-template
          cdkConnectedOverlay
          [cdkConnectedOverlayOrigin]="singleOrigin"
          [cdkConnectedOverlayOpen]="isOpen()"
          [cdkConnectedOverlayPositions]="singleOverlayPositions"
          [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
          [cdkConnectedOverlayHasBackdrop]="true"
          [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
          [cdkConnectedOverlayPush]="true"
          [cdkConnectedOverlayViewportMargin]="_viewportMargin"
          (backdropClick)="close()"
          (detach)="close()"
        >
          <div
            class="neu-date-input__panel"
            [class.neu-date-input__panel--time-only]="type() === 'time'"
            role="dialog"
            [attr.aria-label]="_texts().chooseDate + (monthLabel() ? ': ' + monthLabel() : '')"
            (click)="$event.stopPropagation()"
          >
            @if (type() !== 'time') {
              <div class="neu-date-input__calendar">
                <div class="neu-date-input__cal-nav">
                  <button
                    class="neu-date-input__cal-arrow"
                    type="button"
                    (click)="prevMonth()"
                    [attr.aria-label]="_texts().prevMonth"
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
                  @if (showMonthYearPicker()) {
                    <span class="neu-date-input__cal-title neu-date-input__cal-title--pickers">
                      <select
                        class="neu-date-input__picker"
                        [value]="_viewMonth()"
                        [attr.aria-label]="_texts().chooseMonth"
                        (change)="setViewMonth($any($event.target).value)"
                      >
                        @for (month of monthOptions(); track month.value) {
                          <option [value]="month.value">{{ month.label }}</option>
                        }
                      </select>
                      <select
                        class="neu-date-input__picker"
                        [value]="_viewYear()"
                        [attr.aria-label]="_texts().chooseYear"
                        (change)="setViewYear($any($event.target).value)"
                      >
                        @for (year of yearOptions(); track year) {
                          <option [value]="year">{{ year }}</option>
                        }
                      </select>
                    </span>
                  } @else {
                    <span class="neu-date-input__cal-title">{{ monthLabel() }}</span>
                  }
                  <button
                    class="neu-date-input__cal-arrow"
                    type="button"
                    (click)="nextMonth()"
                    [attr.aria-label]="_texts().nextMonth"
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
                  @for (d of weekdays(); track d) {
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
                      [disabled]="day.disabled"
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
                    {{ _texts().delete }}
                  </button>
                  <button
                    class="neu-date-input__cal-footer-btn neu-date-input__cal-footer-btn--today"
                    type="button"
                    (click)="today()"
                  >
                    {{ _texts().today }}
                  </button>
                </div>
              </div>
            }
            @if (type() === 'datetime-local') {
              <div class="neu-date-input__sep"></div>
            }
            @if (type() !== 'date') {
              <div class="neu-date-input__time">
                <div class="neu-date-input__drum">
                  <button
                    class="neu-date-input__drum-arrow"
                    type="button"
                    (click)="changeHour(-1)"
                    [attr.aria-label]="_texts().prevHour"
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
                    [attr.aria-label]="_texts().nextHour"
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
                <div class="neu-date-input__drum">
                  <button
                    class="neu-date-input__drum-arrow"
                    type="button"
                    (click)="changeMinute(-1)"
                    [attr.aria-label]="_texts().prevMinute"
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
                    [attr.aria-label]="_texts().nextMinute"
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
        </ng-template>
      </div>
      @if (hasError()) {
        <p class="neu-date-input__error" role="alert">{{ errorMessage() }}</p>
      } @else if (hint()) {
        <p class="neu-date-input__hint">{{ hint() }}</p>
      }
    }
  `,
  styleUrl: './neu-date-input.component.scss',
})
export class NeuDateInputComponent implements ControlValueAccessor, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly overlay = inject(Overlay);
  private _langObserver?: MutationObserver;

  /** Tipo del campo / Field type */
  type = input<'date' | 'time' | 'datetime-local' | 'range'>('date');
  /** Etiqueta / Label */
  label = input<string>('');
  /** Texto de ayuda / Help text */
  hint = input<string>('');
  /** Mensaje de error / Error message */
  errorMessage = input<string>('');
  /** Deshabilita / Disabled */
  disabled = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<'sm' | 'md' | 'lg'>('md');
  /** Solo lectura / Read only */
  readonly = input<boolean>(false);
  /** Nombre / Field name */
  name = input<string>('');
  /** ID accesible / Accessible ID */
  inputId = input<string>('');
  /** Requerido / Required */
  required = input<boolean>(false);
  /** Mínimo / Minimum */
  min = input<string | null>(null);
  /** Máximo / Maximum */
  max = input<string | null>(null);
  /** Paso / Step */
  step = input<number | null>(null);
  /** Locale explícito opcional / Optional explicit locale */
  locale = input<string | null>(null);
  /** Fechas deshabilitadas / Disabled dates */
  disabledDates = input<((date: Date) => boolean) | Array<Date | string>>([]);
  /** Permite seleccionar varias fechas en type="date" / Multiple date selection for type="date" */
  multiple = input<boolean>(false);
  /** Muestra selectores de mes/año en el calendario / Shows month/year picker controls */
  showMonthYearPicker = input<boolean>(false);
  /** Rango de años para el selector / Year picker range */
  yearRange = input<number>(12);

  // ── Range-mode inputs ────────────────────────────────────────────
  /** Placeholder del trigger / Trigger placeholder */
  placeholder = input<string>('');
  /** Formato de fecha en modo rango / Date display format in range mode */
  dateFormat = input<'short' | 'medium' | 'long' | 'full' | 'numeric'>('short');
  /** Etiqueta flotante / Floating label */
  floatingLabel = input<boolean>(false);
  /** Presets rápidos para rangos / Quick range presets */
  presets = input<NeuDatePreset[]>([]);

  // ── Outputs ──────────────────────────────────────────────────────
  /** Emitido al confirmar el rango / Emitted when range is confirmed */
  readonly rangeChange = output<NeuDateRange>();

  // ── Estado interno / Internal state ──────────────────────────────
  protected readonly _id = `neu-date-input-${++_neuDateInputIdSeq}`;
  readonly isOpen = signal(false);
  readonly _viewportMargin = 16;
  readonly singleOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];
  readonly rangeOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly _isRange = computed(() => this.type() === 'range');
  private readonly _cvaDisabled = signal(false);
  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());
  readonly hasError = computed(() => !!this.errorMessage());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _onChange: (v: any) => void = () => {};
  private _onTouched: () => void = () => {};

  // ── State — single ────────────────────────────────────────────────
  protected readonly _value = signal<string>('');
  protected readonly _viewYear = signal(new Date().getFullYear());
  protected readonly _viewMonth = signal(new Date().getMonth());
  protected readonly _selYear = signal<number | null>(null);
  protected readonly _selMonth = signal<number | null>(null);
  protected readonly _selDay = signal<number | null>(null);
  protected readonly _selHour = signal(0);
  protected readonly _selMinute = signal(0);
  protected readonly _selectedDates = signal<string[]>([]);

  // ── State — range ─────────────────────────────────────────────────
  private readonly _today = new Date();
  private readonly _documentLang = signal(
    this.#normalizedLocale(this.doc.documentElement.lang) || 'es',
  );
  private readonly _pickStart = signal<Date | null>(null);
  private readonly _pickEnd = signal<Date | null>(null);
  private readonly _hoverDate = signal<Date | null>(null);
  readonly _leftCursor = signal<Date>(
    new Date(this._today.getFullYear(), this._today.getMonth(), 1),
  );
  readonly _rightCursor = computed(() => {
    const l = this._leftCursor();
    return new Date(l.getFullYear(), l.getMonth() + 1, 1);
  });
  readonly _hasRange = computed(() => !!this._pickStart());
  readonly _canApply = computed(() => this._pickStart() !== null && this._pickEnd() !== null);
  readonly _resolvedLocale = computed(
    () => this.#normalizedLocale(this.locale()) || this._documentLang() || 'es',
  );
  readonly _texts = computed(() => {
    const spanish = this._resolvedLocale().toLowerCase().startsWith('es');
    return spanish
      ? {
          rangeAriaLabel: 'Seleccionar rango de fechas',
          prevMonth: 'Mes anterior',
          nextMonth: 'Mes siguiente',
          clear: 'Limpiar',
          apply: 'Aplicar',
          chooseDate: 'Seleccionar fecha',
          delete: 'Borrar',
          today: 'Hoy',
          prevHour: 'Hora anterior',
          nextHour: 'Hora siguiente',
          prevMinute: 'Minuto anterior',
          nextMinute: 'Minuto siguiente',
          rangePlaceholder: 'Seleccionar fechas',
          timePlaceholder: 'hh:mm',
          datePlaceholder: 'dd/mm/aaaa',
          dateTimePlaceholder: 'dd/mm/aaaa, hh:mm',
          chooseMonth: 'Seleccionar mes',
          chooseYear: 'Seleccionar año',
        }
      : {
          rangeAriaLabel: 'Select date range',
          prevMonth: 'Previous month',
          nextMonth: 'Next month',
          clear: 'Clear',
          apply: 'Apply',
          chooseDate: 'Choose date',
          delete: 'Clear',
          today: 'Today',
          prevHour: 'Previous hour',
          nextHour: 'Next hour',
          prevMinute: 'Previous minute',
          nextMinute: 'Next minute',
          rangePlaceholder: 'Select dates',
          timePlaceholder: 'hh:mm',
          datePlaceholder: 'mm/dd/yyyy',
          dateTimePlaceholder: 'mm/dd/yyyy, hh:mm',
          chooseMonth: 'Choose month',
          chooseYear: 'Choose year',
        };
  });

  readonly _weekDayLabels = computed(() => this.#buildWeekdayLabels('short'));
  readonly _leftTitle = computed(() => this._monthTitle(this._leftCursor()));
  readonly _rightTitle = computed(() => this._monthTitle(this._rightCursor()));
  readonly _leftDays = computed(() => this._buildRangeMonth(this._leftCursor()));
  readonly _rightDays = computed(() => this._buildRangeMonth(this._rightCursor()));
  readonly _rangePlaceholderText = computed(
    () => this.placeholder() || this._texts().rangePlaceholder,
  );

  constructor() {
    if (typeof MutationObserver !== 'undefined') {
      this._langObserver = new MutationObserver(() => {
        this._documentLang.set(this.#normalizedLocale(this.doc.documentElement.lang) || 'es');
      });
      this._langObserver.observe(this.doc.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
      });
    }
  }

  ngOnDestroy(): void {
    this._langObserver?.disconnect();
  }

  private _monthTitle(d: Date): string {
    return this.#capitalize(
      new Intl.DateTimeFormat(this._resolvedLocale(), { month: 'long', year: 'numeric' }).format(d),
    );
  }

  readonly _rangeDisplayValue = computed(() => {
    const s = this._pickStart();
    const e = this._pickEnd();
    if (!s) return this.placeholder();
    if (!e) return this._fmtDate(s);
    return `${this._fmtDate(s)} – ${this._fmtDate(e)}`;
  });

  private _fmtDate(d: Date): string {
    const fmt = this.dateFormat();
    const opts: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      medium: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
      numeric: { day: 'numeric', month: 'numeric', year: '2-digit' },
    };
    return d.toLocaleDateString(this._resolvedLocale(), opts[fmt] ?? opts['short']);
  }

  private _buildRangeMonth(cursor: Date): RangeCell[] {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: RangeCell[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(this._rangeCell(new Date(year, month, -i), false));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(this._rangeCell(new Date(year, month, d), true));
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push(
        this._rangeCell(
          new Date(year, month + 1, cells.length - startOffset - lastDay.getDate() + 1),
          false,
        ),
      );
    }
    return cells;
  }

  private _rangeCell(date: Date, current: boolean): RangeCell {
    const s = this._pickStart();
    const e = this._pickEnd();
    const h = this._hoverDate();
    const rangeEnd = e ?? h;
    const inRange =
      s && rangeEnd
        ? (date > s && date < rangeEnd) || (rangeEnd < s && date > rangeEnd && date < s)
        : false;
    return {
      date,
      day: date.getDate(),
      ts: date.getTime(),
      current,
      today: sameDay(date, this._today),
      selected: (s && sameDay(date, s)) || (e && sameDay(date, e)) || false,
      rangeStart: s ? sameDay(date, s) : false,
      rangeEnd: e ? sameDay(date, e) : false,
      inRange: !!inRange,
      label: date.toLocaleDateString(this._resolvedLocale()),
      disabled: this.isDateDisabled(date),
    };
  }

  // ── Range actions ─────────────────────────────────────────────────
  _prevLeft(): void {
    this._leftCursor.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  _nextLeft(): void {
    this._leftCursor.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  _prevRight(): void {
    this._leftCursor.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  _nextRight(): void {
    this._leftCursor.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  _selectDay(date: Date): void {
    if (this.isDateDisabled(date)) return;
    const s = this._pickStart();
    if (!s || this._pickEnd()) {
      this._pickStart.set(cloneDate(date));
      this._pickEnd.set(null);
      this._hoverDate.set(null);
    } else {
      if (date < s) {
        this._pickEnd.set(cloneDate(s));
        this._pickStart.set(cloneDate(date));
      } else {
        this._pickEnd.set(cloneDate(date));
      }
      this._hoverDate.set(null);
    }
  }

  _hoverDay(date: Date): void {
    if (this._pickStart() && !this._pickEnd()) this._hoverDate.set(date);
  }

  _applyRange(): void {
    const range: NeuDateRange = { start: this._pickStart(), end: this._pickEnd() };
    this._onChange(range);
    this.rangeChange.emit(range);
    this._onTouched();
    this.isOpen.set(false);
  }

  _applyPreset(preset: NeuDatePreset): void {
    const range = typeof preset.range === 'function' ? preset.range() : preset.range;
    this._pickStart.set(range.start ? cloneDate(range.start) : null);
    this._pickEnd.set(range.end ? cloneDate(range.end) : null);
  }

  _clearRange(): void {
    this._pickStart.set(null);
    this._pickEnd.set(null);
    this._hoverDate.set(null);
    const range: NeuDateRange = { start: null, end: null };
    this._onChange(range);
    this.rangeChange.emit(range);
  }

  // ── Single computed ───────────────────────────────────────────────
  readonly displayValue = computed(() => {
    const v = this._value();
    if (!v) return '';
    const t = this.type();
    if (t === 'date' && this.multiple()) {
      return this._selectedDates()
        .map((value) => new Date(value + 'T00:00:00'))
        .filter((date) => !isNaN(date.getTime()))
        .map((date) =>
          date.toLocaleDateString(this._resolvedLocale(), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        )
        .join(', ');
    }
    if (t === 'date') {
      const d = new Date(v + 'T00:00:00');
      return isNaN(d.getTime())
        ? v
        : d.toLocaleDateString(this._resolvedLocale(), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
    }
    if (t === 'time') return v;
    const [datePart, timePart] = v.split('T');
    const d = new Date(datePart + 'T00:00:00');
    return (
      (isNaN(d.getTime())
        ? datePart
        : d.toLocaleDateString(this._resolvedLocale(), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })) +
      ', ' +
      (timePart?.slice(0, 5) ?? '')
    );
  });

  readonly placeholderText = computed(() => {
    if (this.placeholder()) {
      return this.placeholder();
    }

    switch (this.type()) {
      case 'time':
        return this._texts().timePlaceholder;
      case 'datetime-local':
        return this._texts().dateTimePlaceholder;
      default:
        return this._texts().datePlaceholder;
    }
  });

  readonly monthLabel = computed(() =>
    this.#capitalize(
      new Date(this._viewYear(), this._viewMonth(), 1).toLocaleDateString(this._resolvedLocale(), {
        month: 'long',
        year: 'numeric',
      }),
    ),
  );

  readonly weekdays = computed(() => this.#buildWeekdayLabels('narrow'));

  readonly monthOptions = computed(() =>
    Array.from({ length: 12 }, (_, value) => ({
      value,
      label: this.#capitalize(
        new Date(2024, value, 1).toLocaleDateString(this._resolvedLocale(), { month: 'long' }),
      ),
    })),
  );

  readonly yearOptions = computed(() => {
    const center = this._viewYear();
    const span = Math.max(1, this.yearRange());
    const start = center - span;
    return Array.from({ length: span * 2 + 1 }, (_, index) => start + index);
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const year = this._viewYear();
    const month = this._viewMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7;
    const days: CalendarDay[] = [];
    for (let i = startDow; i > 0; i--) {
      days.push({
        date: new Date(year, month, 1 - i),
        inMonth: false,
        isToday: false,
        isSelected: false,
        disabled: this.isDateDisabled(new Date(year, month, 1 - i)),
      });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        inMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: this.isDateSelected(date),
        disabled: this.isDateDisabled(date),
      });
    }
    let next = 1;
    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, next++),
        inMonth: false,
        isToday: false,
        isSelected: false,
        disabled: this.isDateDisabled(new Date(year, month + 1, next - 1)),
      });
    }
    return days;
  });

  readonly hourSlots = computed(() => this._drumSlots(this._selHour(), 24));
  readonly minuteSlots = computed(() => this._drumSlots(this._selMinute(), 60));

  private _drumSlots(value: number, max: number): DrumSlot[] {
    return [-1, 0, 1].map((offset) => {
      const v = (((value + offset) % max) + max) % max;
      return { value: v, offset, label: String(v).padStart(2, '0') };
    });
  }

  // ── Single actions ────────────────────────────────────────────────
  toggle(): void {
    if (this.isDisabledFinal()) return;
    if (!this._isRange() && this.readonly()) return;
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsidePanel = !!target?.closest('.neu-date-input__panel, .neu-drp__panel');
    if (!isInsidePanel) {
      this.close();
    }
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
    if (!day.inMonth || day.disabled) return;
    const value = this._toDateValue(day.date);
    if (this.type() === 'date' && this.multiple()) {
      this._selectedDates.update((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      );
      this._value.set(this._selectedDates().join(','));
      this._onChange(this._selectedDates());
      return;
    }
    this._selYear.set(day.date.getFullYear());
    this._selMonth.set(day.date.getMonth());
    this._selDay.set(day.date.getDate());
    this._emitValue();
    if (this.type() === 'date') this.close();
  }

  setViewMonth(value: string | number): void {
    const month = Number(value);
    if (Number.isInteger(month) && month >= 0 && month <= 11) {
      this._viewMonth.set(month);
    }
  }

  setViewYear(value: string | number): void {
    const year = Number(value);
    if (Number.isInteger(year)) {
      this._viewYear.set(year);
    }
  }

  formatDayLabel(date: Date): string {
    return date.toLocaleDateString(this._resolvedLocale(), {
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
    this.selectDay({ date: d, inMonth: true, isToday: true, isSelected: false, disabled: false });
  }

  clear(): void {
    this._selYear.set(null);
    this._selMonth.set(null);
    this._selDay.set(null);
    this._selectedDates.set([]);
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

  isDateSelected(date: Date): boolean {
    if (this.type() === 'date' && this.multiple()) {
      return this._selectedDates().includes(this._toDateValue(date));
    }

    return (
      this._selYear() === date.getFullYear() &&
      this._selMonth() === date.getMonth() &&
      this._selDay() === date.getDate()
    );
  }

  isDateDisabled(date: Date): boolean {
    const disabled = this.disabledDates();
    if (typeof disabled === 'function') {
      return disabled(date);
    }

    return disabled.some((value) => {
      const candidate = value instanceof Date ? value : new Date(`${value}T00:00:00`);
      return !isNaN(candidate.getTime()) && sameDay(candidate, date);
    });
  }

  private _toDateValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  }

  // ── CVA ───────────────────────────────────────────────────────────
  writeValue(value: string | string[] | NeuDateRange | null): void {
    if (this.type() === 'range') {
      const v = value as NeuDateRange | null;
      this._pickStart.set(v?.start ?? null);
      this._pickEnd.set(v?.end ?? null);
    } else {
      if (this.type() === 'date' && this.multiple()) {
        const values = Array.isArray(value)
          ? value
          : typeof value === 'string' && value
            ? value.split(',').map((item) => item.trim())
            : [];
        this._selectedDates.set(values.filter(Boolean));
        this._value.set(this._selectedDates().join(','));
        return;
      }
      const v = (value as string) ?? '';
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
  }

  registerOnChange(fn: (v: string | string[] | NeuDateRange) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  #normalizedLocale(locale: string | null | undefined): string {
    return locale?.trim() || '';
  }

  #capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  #buildWeekdayLabels(style: 'short' | 'narrow'): string[] {
    const formatter = new Intl.DateTimeFormat(this._resolvedLocale(), {
      weekday: style,
      timeZone: 'UTC',
    });
    return Array.from({ length: 7 }, (_, index) => {
      const label = formatter
        .format(new Date(Date.UTC(2024, 0, 1 + index)))
        .replace(/\.$/, '')
        .trim();
      if (style === 'narrow') {
        return label.slice(0, 1).toUpperCase();
      }
      return this.#capitalize(label);
    });
  }
}
