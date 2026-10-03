import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuIdGenerator, NeuInitialTemporalState } from '@neural-ui/core/internal';
import {
  civilDate,
  emptyDateValue,
  isCivilDate,
  isLocalDateTime,
  isLocalTime,
  localDateTime,
  localTime,
  type CivilDate,
  type CivilDateRange,
  type CivilMonth,
  type CivilYear,
  type LocalDateTime,
  type LocalTime,
  type NeuDateMode,
  type NeuDatePresentation,
  type NeuDateValue,
} from './neu-date-value';
import {
  compareCivilMonth,
  compareCivilYear,
  isCivilMonth,
  isCivilYear,
  isoWeekNumber,
  shiftCivilMonth,
  validCivilYear,
} from './neu-date-period';

export interface NeuDateViewChangeEvent {
  readonly start: CivilDate;
  /** Exclusive civil-date boundary. */
  readonly end: CivilDate;
}

export interface NeuDatePreset {
  readonly label: string;
  readonly range: CivilDateRange | (() => CivilDateRange);
}

interface CalendarCell {
  readonly civil: CivilDate;
  readonly day: number;
  readonly inMonth: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  readonly inRange: boolean;
  readonly disabled: boolean;
  readonly label: string;
}

interface DrumSlot {
  readonly value: number;
  readonly offset: number;
  readonly label: string;
}

interface CalendarWeek {
  readonly number: number;
  readonly cells: readonly CalendarCell[];
}

type ParseState = 'valid' | 'incomplete' | 'invalid';
type NeuDateAnyValue = NeuDateValue<NeuDateMode>;

/** Civil date/time field with a single mode-dependent ModelSignal. */
@Component({
  selector: 'neu-date-input',
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-date-input-host',
    '[class.neu-date-input-host--sm]': 'size() === "sm"',
    '[class.neu-date-input-host--lg]': 'size() === "lg"',
    '[hidden]': 'hidden()',
    '(focusout)': 'onCompositeFocusOut()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-date-input__label" [for]="controlId()">{{ label() }}</label>
    }
    <div
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="neu-date-input"
      [class.neu-date-input--open]="isOpen() && presentation() === 'overlay'"
      [class.neu-date-input--inline]="presentation() === 'inline'"
      [class.neu-date-input--disabled]="disabled()"
      [class.neu-date-input--readonly]="readonly()"
      [class.neu-date-input--error]="hasError()"
      [class.neu-date-input--has-value]="hasValue()"
      [class.neu-date-input--float]="floatingLabel()"
    >
      <div class="neu-date-input__trigger" (click)="onTriggerClick($event)">
        <span class="neu-date-input__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" focusable="false">
            @if (mode() === 'time') {
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            } @else {
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            }
          </svg>
        </span>
        <input
          #textInput
          class="neu-date-input__field"
          type="text"
          autocomplete="off"
          [id]="controlId()"
          [attr.name]="name() || null"
          [attr.placeholder]="floatingLabel() ? null : placeholderText()"
          [attr.required]="required() ? '' : null"
          [attr.readonly]="textReadonly() ? '' : null"
          [attr.aria-label]="label() || ariaLabel() || null"
          [attr.aria-describedby]="resolvedDescribedBy() || null"
          [attr.role]="presentation() === 'overlay' ? 'combobox' : null"
          [attr.aria-autocomplete]="presentation() === 'overlay' ? 'none' : null"
          [attr.aria-expanded]="presentation() === 'overlay' ? isOpen() : null"
          [attr.aria-haspopup]="presentation() === 'overlay' ? 'dialog' : null"
          [attr.aria-controls]="presentation() === 'overlay' ? panelId() : null"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.aria-busy]="pending() ? 'true' : null"
          [disabled]="disabled()"
          [value]="displayText()"
          (focus)="beginEditing()"
          (input)="onTextInput($event)"
          (keydown)="onInputKeydown($event)"
        />
        @if (hasValue() && !disabled() && !readonly()) {
          <button
            type="button"
            class="neu-date-input__clear"
            [attr.aria-label]="texts().clear"
            (click)="clear()"
          >
            ×
          </button>
        }
        @if (presentation() === 'overlay') {
          <button
            type="button"
            class="neu-date-input__open"
            [disabled]="disabled()"
            [attr.aria-label]="texts().chooseDate"
            [attr.aria-expanded]="isOpen()"
            [attr.aria-controls]="panelId()"
            (click)="toggle()"
          >
            <svg class="neu-date-input__chevron" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true" focusable="false">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        }
      </div>
      @if (floatingLabel() && label()) {
        <label class="neu-date-input__float-label" [for]="controlId()">{{ label() }}</label>
      }
    </div>
    @if (hasError() && errorMessage()) {
      <p class="neu-date-input__error" role="alert" [id]="errorId()">{{ errorMessage() }}</p>
    } @else if (hint()) {
      <p class="neu-date-input__hint" [id]="hintId()">{{ hint() }}</p>
    }

    <ng-template #pickerSurface>
      <div
        class="neu-date-input__panel"
        [class.neu-date-input__panel--time-only]="mode() === 'time'"
        [class.neu-date-input__panel--inline]="presentation() === 'inline'"
        [id]="panelId()"
        [attr.data-neu-date-owner]="controlId()"
        [attr.role]="presentation() === 'inline' ? 'group' : 'dialog'"
        [attr.aria-modal]="presentation() === 'overlay' ? 'true' : null"
        [attr.aria-label]="texts().chooseDate"
        (focusin)="onPickerFocusIn()"
        (focusout)="onCompositeFocusOut()"
        (keydown.escape)="onPickerEscape($event)"
      >
        @if (presets().length && mode() === 'range') {
          <div class="neu-drp__presets" role="list">
            @for (preset of presets(); track preset.label) {
              <button
                type="button"
                class="neu-drp__preset"
                [disabled]="readonly()"
                (click)="applyPreset(preset)"
              >
                {{ preset.label }}
              </button>
            }
          </div>
        }
        @if (mode() !== 'time') {
          <div class="neu-date-input__calendar">
            <div class="neu-date-input__cal-nav">
              <button
                type="button"
                class="neu-date-input__cal-arrow"
                [attr.aria-label]="mode() === 'year' ? texts().prevYearPage : texts().prevMonth"
                [disabled]="disabled()"
                (click)="navigateMonth(mode() === 'year' ? -12 : mode() === 'month' ? -12 : -1)"
              >
                ‹
              </button>
              @if (mode() === 'month' || mode() === 'year') {
                <span class="neu-date-input__cal-title" aria-live="polite">
                  {{ mode() === 'month' ? viewYear() : yearPageLabel() }}
                </span>
              } @else if (showMonthYearPicker()) {
                <span class="neu-date-input__cal-title neu-date-input__cal-title--pickers">
                  <select
                    class="neu-date-input__picker"
                    [attr.aria-label]="texts().chooseMonth"
                    [value]="viewMonth()"
                    (change)="onMonthSelect($event)"
                  >
                    @for (month of monthOptions(); track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                  <select
                    class="neu-date-input__picker"
                    [attr.aria-label]="texts().chooseYear"
                    [value]="viewYear()"
                    (change)="onYearSelect($event)"
                  >
                    @for (year of yearOptions(); track year) {
                      <option [value]="year">{{ year }}</option>
                    }
                  </select>
                </span>
              } @else {
                <span class="neu-date-input__cal-title" aria-live="polite">{{ monthLabel() }}</span>
              }
              <button
                type="button"
                class="neu-date-input__cal-arrow"
                [attr.aria-label]="mode() === 'year' ? texts().nextYearPage : texts().nextMonth"
                [disabled]="disabled()"
                (click)="navigateMonth(mode() === 'year' ? 12 : mode() === 'month' ? 12 : 1)"
              >
                ›
              </button>
            </div>
            @if (mode() === 'month') {
              <div class="neu-date-input__period-grid neu-date-input__period-grid--month" role="grid">
                @for (row of monthRows(); track $index) {
                  <div class="neu-date-input__period-row" role="row">
                  @for (month of row; track month.value) {
                  <button type="button" role="gridcell" class="neu-date-input__period-cell"
                    [attr.data-civil-month]="month.value + 1"
                    [attr.aria-label]="month.label + ' ' + viewYear()"
                    [attr.aria-selected]="isMonthSelected(month.value + 1)"
                    [disabled]="disabled()"
                    [attr.aria-disabled]="readonly() || isMonthDisabled(month.value + 1) ? 'true' : null"
                    [tabindex]="focusedMonth() === month.value + 1 ? 0 : -1"
                    (click)="selectMonth(month.value + 1)"
                    (keydown)="onMonthKeydown($event, month.value + 1)"
                  >{{ month.label }}</button>
                  }
                  </div>
                }
              </div>
            } @else if (mode() === 'year') {
              <div class="neu-date-input__period-grid neu-date-input__period-grid--year" role="grid">
                @for (row of yearRows(); track $index) {
                  <div class="neu-date-input__period-row" role="row">
                  @for (year of row; track $index) {
                  <button type="button" role="gridcell" class="neu-date-input__period-cell"
                    [attr.data-civil-year]="year"
                    [attr.aria-label]="year"
                    [attr.aria-selected]="isYearSelected(year)"
                    [disabled]="disabled()"
                    [attr.aria-disabled]="readonly() || isYearDisabled(year) ? 'true' : null"
                    [tabindex]="focusedYear() === year ? 0 : -1"
                    (click)="selectYear(year)"
                    (keydown)="onYearKeydown($event, year)"
                  >{{ year }}</button>
                  }
                  </div>
                }
              </div>
            } @else {
              <div class="neu-date-input__cal-weekdays" [class.neu-date-input__cal-weekdays--numbered]="showWeekNumbers()" aria-hidden="true">
                @if (showWeekNumbers()) { <span></span> }
                @for (day of weekdays(); track $index) { <span>{{ day }}</span> }
              </div>
              <div class="neu-date-input__cal-grid" role="grid"
                [class.neu-date-input__cal-grid--numbered]="showWeekNumbers()"
                [attr.aria-multiselectable]="mode() === 'multiple' || mode() === 'range' ? 'true' : null">
                @for (week of calendarWeeks(); track $index) {
                  <div class="neu-date-input__cal-week" role="row">
                    @if (showWeekNumbers()) {
                      <span class="neu-date-input__week-number" aria-hidden="true">{{ week.number }}</span>
                    }
                    @for (cell of week.cells; track cell.civil) {
                      <button type="button" role="gridcell" class="neu-date-input__cal-day"
                        [class.neu-date-input__cal-day--other]="!cell.inMonth"
                        [class.neu-date-input__cal-day--today]="cell.today"
                        [class.neu-date-input__cal-day--selected]="cell.selected"
                        [class.neu-drp__cell--range-start]="cell.rangeStart"
                        [class.neu-drp__cell--range-end]="cell.rangeEnd"
                        [class.neu-drp__cell--in-range]="cell.inRange"
                        [disabled]="cell.disabled"
                        [tabindex]="cell.civil === activeDate() ? 0 : -1"
                        [attr.data-civil-date]="cell.civil"
                        [attr.aria-label]="cell.label"
                        [attr.aria-selected]="cell.selected"
                        [attr.aria-current]="cell.today ? 'date' : null"
                        (click)="selectCivilDate(cell.civil)"
                        (mouseenter)="hoverDate.set(cell.disabled ? null : cell.civil)"
                        (keydown)="onCalendarKeydown($event, cell.civil)"
                      >{{ cell.day }}</button>
                    }
                  </div>
                }
              </div>
            }
            <div class="neu-date-input__cal-footer">
              <button type="button" class="neu-date-input__cal-footer-btn" [disabled]="readonly()" (click)="clear()">{{ texts().clear }}</button>
              @if (mode() !== 'month' && mode() !== 'year') {
                <button type="button" class="neu-date-input__cal-footer-btn neu-date-input__cal-footer-btn--today"
                  [disabled]="readonly() || isDateDisabled(todayCivil)" (click)="selectCivilDate(todayCivil)">{{ texts().today }}</button>
              }
            </div>
            @if (mode() === 'range') {
              <p class="neu-date-input__range-announcement" aria-live="polite">{{ rangeAnnouncement() }}</p>
            }
          </div>
        }
        @if (mode() === 'time' || mode() === 'datetime') {
          <div class="neu-date-input__time" role="group" [attr.aria-label]="texts().chooseTime">
            <div class="neu-date-input__drum">
              <button type="button" class="neu-date-input__drum-arrow" [disabled]="readonly()" [attr.aria-label]="texts().prevHour" (click)="changeHour(-1)">▲</button>
              <div class="neu-date-input__drum-track">
                @for (slot of hourSlots(); track slot.offset) {
                  <button type="button" class="neu-date-input__drum-item" [class.neu-date-input__drum-item--selected]="slot.offset === 0" [disabled]="readonly()" (click)="slot.offset && changeHour(slot.offset)">{{ slot.label }}</button>
                }
              </div>
              <button type="button" class="neu-date-input__drum-arrow" [disabled]="readonly()" [attr.aria-label]="texts().nextHour" (click)="changeHour(1)">▼</button>
            </div>
            <span class="neu-date-input__time-colon">:</span>
            <div class="neu-date-input__drum">
              <button type="button" class="neu-date-input__drum-arrow" [disabled]="readonly()" [attr.aria-label]="texts().prevMinute" (click)="changeMinute(-1)">▲</button>
              <div class="neu-date-input__drum-track">
                @for (slot of minuteSlots(); track slot.offset) {
                  <button type="button" class="neu-date-input__drum-item" [class.neu-date-input__drum-item--selected]="slot.offset === 0" [disabled]="readonly()" (click)="slot.offset && changeMinute(slot.offset)">{{ slot.label }}</button>
                }
              </div>
              <button type="button" class="neu-date-input__drum-arrow" [disabled]="readonly()" [attr.aria-label]="texts().nextMinute" (click)="changeMinute(1)">▼</button>
            </div>
          </div>
        }
      </div>
    </ng-template>
    @if (presentation() === 'inline') {
      <ng-container [ngTemplateOutlet]="pickerSurface" />
    }
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="presentation() === 'overlay' && isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="16"
      (backdropClick)="close(true)"
      (attach)="onPanelAttached()"
      (detach)="onPanelDetached()"
    >
      <ng-container [ngTemplateOutlet]="pickerSurface" />
    </ng-template>
  `,
  styleUrl: './neu-date-input.component.scss',
})
export class NeuDateInputControl<V = NeuDateAnyValue> implements FormValueControl<V> {
  /** `V` is inferred directly from Angular Forms and remains exact in mode specializations. */
  readonly value = model<V>(null as V);
  readonly mode = input<NeuDateMode>('date');
  readonly presentation = input<NeuDatePresentation>('overlay');
  readonly showWeekNumbers = input<boolean>(false);

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly name = input<string>('');
  readonly inputId = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly minDate = input<NonNullable<V> | undefined>(undefined, { alias: 'min' });
  readonly maxDate = input<NonNullable<V> | undefined>(undefined, { alias: 'max' });
  readonly step = input<number>(1);
  readonly locale = input<string | null>(null);
  readonly disabledDates = input<readonly CivilDate[] | ((date: CivilDate) => boolean)>([]);
  readonly showMonthYearPicker = input<boolean>(false);
  readonly yearRange = input<number>(12);
  readonly placeholder = input<string>('');
  readonly dateFormat = input<'short' | 'medium' | 'long' | 'full' | 'numeric'>('short');
  readonly floatingLabel = input<boolean>(false);
  readonly presets = input<readonly NeuDatePreset[]>([]);
  readonly firstDayOfWeek = input<number>(1);

  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly viewChange = output<NeuDateViewChangeEvent>();

  private readonly doc = inject(DOCUMENT);
  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultLocale = inject(NEURAL_LOCALE);
  private readonly initialToday = inject(NeuInitialTemporalState).today();
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-date-input-');
  private readonly textInput = viewChild.required<ElementRef<HTMLInputElement>>('textInput');

  readonly todayCivil = civilDate(
    `${this.initialToday.getFullYear().toString().padStart(4, '0')}-${String(this.initialToday.getMonth() + 1).padStart(2, '0')}-${String(this.initialToday.getDate()).padStart(2, '0')}`,
  );
  readonly isOpen = linkedSignal<boolean>(() => {
    this.presentation();
    return false;
  });
  readonly viewYear = linkedSignal(() => this.initialViewAnchor().year);
  readonly viewMonth = linkedSignal(() => this.initialViewAnchor().monthIndex);
  readonly focusedMonth = signal(this.initialToday.getMonth() + 1);
  readonly focusedYear = signal(this.initialToday.getFullYear());
  readonly activeDate = signal<CivilDate>(this.todayCivil);
  readonly hoverDate = signal<CivilDate | null>(null);
  readonly draftState = signal<ParseState>('valid');
  private readonly draft = signal<{ readonly raw: string; readonly base: string } | null>(null);
  private panelAttached = false;
  private focusVisitActive = false;
  private returnFocusElement: HTMLElement | null = null;
  private destroyed = false;

  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  ];
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly controlId = computed(() => this.inputId() || this.generatedId);
  readonly panelId = computed(() => `${this.controlId()}-panel`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly resolvedLocale = computed(() => this.locale()?.trim() || this.defaultLocale || 'en-US');
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly resolvedDescribedBy = computed(() =>
    [
      this.ariaDescribedBy(),
      this.hasError() && this.errorMessage() ? this.errorId() : '',
      !this.hasError() && this.hint() ? this.hintId() : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly textReadonly = computed(
    () => this.readonly() || ['multiple', 'range', 'month', 'year'].includes(this.mode()),
  );
  readonly valueSignature = computed(() => JSON.stringify(this.value()));
  readonly hasValue = computed(() => !this.isEmptyValue());
  readonly displayText = computed(() => {
    const draft = this.draft();
    return draft && draft.base === this.valueSignature() ? draft.raw : this.formatValue();
  });
  readonly placeholderText = computed(() => {
    if (this.placeholder()) return this.placeholder();
    if (this.mode() === 'time') return this.texts().timePlaceholder;
    if (this.mode() === 'datetime') return this.texts().dateTimePlaceholder;
    if (this.mode() === 'range') return this.texts().rangePlaceholder;
    if (this.mode() === 'multiple') return this.texts().multiplePlaceholder;
    if (this.mode() === 'month') return this.texts().chooseMonth;
    if (this.mode() === 'year') return this.texts().chooseYear;
    return this.texts().datePlaceholder;
  });
  readonly texts = computed(() => {
    const spanish = this.resolvedLocale().toLowerCase().startsWith('es');
    return spanish
      ? {
          chooseDate: 'Seleccionar fecha',
          chooseTime: 'Seleccionar hora',
          prevMonth: 'Mes anterior',
          nextMonth: 'Mes siguiente',
          clear: 'Limpiar',
          today: 'Hoy',
          prevHour: 'Hora anterior',
          nextHour: 'Hora siguiente',
          prevMinute: 'Minuto anterior',
          nextMinute: 'Minuto siguiente',
          chooseMonth: 'Seleccionar mes',
          chooseYear: 'Seleccionar año',
          prevYearPage: 'Años anteriores',
          nextYearPage: 'Años siguientes',
          datePlaceholder: 'aaaa-mm-dd',
          timePlaceholder: 'hh:mm',
          dateTimePlaceholder: 'aaaa-mm-ddThh:mm',
          rangePlaceholder: 'Seleccionar rango',
          multiplePlaceholder: 'Seleccionar fechas',
          rangeStart: 'Inicio',
          rangeEnd: 'Fin',
        }
      : {
          chooseDate: 'Choose date',
          chooseTime: 'Choose time',
          prevMonth: 'Previous month',
          nextMonth: 'Next month',
          clear: 'Clear',
          today: 'Today',
          prevHour: 'Previous hour',
          nextHour: 'Next hour',
          prevMinute: 'Previous minute',
          nextMinute: 'Next minute',
          chooseMonth: 'Choose month',
          chooseYear: 'Choose year',
          prevYearPage: 'Previous years',
          nextYearPage: 'Next years',
          datePlaceholder: 'yyyy-mm-dd',
          timePlaceholder: 'hh:mm',
          dateTimePlaceholder: 'yyyy-mm-ddThh:mm',
          rangePlaceholder: 'Select date range',
          multiplePlaceholder: 'Select dates',
          rangeStart: 'Start',
          rangeEnd: 'End',
        };
  });
  readonly monthLabel = computed(() =>
    this.capitalize(
      new Intl.DateTimeFormat(this.resolvedLocale(), {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(this.viewYear(), this.viewMonth(), 1))),
    ),
  );
  readonly monthOptions = computed(() =>
    Array.from({ length: 12 }, (_, value) => ({
      value,
      label: this.capitalize(
        new Intl.DateTimeFormat(this.resolvedLocale(), {
          month: 'long',
          timeZone: 'UTC',
        }).format(new Date(Date.UTC(2024, value, 1))),
      ),
    })),
  );
  readonly monthRows = computed(() =>
    Array.from({ length: 3 }, (_, row) => this.monthOptions().slice(row * 4, row * 4 + 4)),
  );
  readonly yearOptions = computed(() => {
    const span = Math.max(1, Math.trunc(this.yearRange()));
    return Array.from({ length: span * 2 + 1 }, (_, index) => this.viewYear() - span + index);
  });
  readonly yearPage = computed(() => {
    const start = Math.floor((this.viewYear() - 1) / 12) * 12 + 1;
    return Array.from({ length: Math.min(12, 10000 - start) }, (_, index) => start + index);
  });
  readonly yearRows = computed(() =>
    Array.from({ length: Math.ceil(this.yearPage().length / 4) }, (_, row) =>
      this.yearPage().slice(row * 4, row * 4 + 4),
    ),
  );
  readonly yearPageLabel = computed(() => {
    const page = this.yearPage();
    return `${page[0]}–${page.at(-1)}`;
  });
  readonly weekdays = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.resolvedLocale(), {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
    return Array.from({ length: 7 }, (_, index) =>
      formatter
        .format(new Date(Date.UTC(2024, 0, 7 + this.normalizedFirstDay() + index)))
        .toUpperCase(),
    );
  });
  readonly calendarDays = computed(() => this.buildCalendarDays());
  readonly calendarWeeks = computed<readonly CalendarWeek[]>(() => {
    const cells = this.calendarDays();
    const thursdayIndex = (4 - this.normalizedFirstDay() + 7) % 7;
    return Array.from({ length: 6 }, (_, row) => {
      const start = row * 7;
      return {
        number: this.showWeekNumbers() ? isoWeekNumber(cells[start + thursdayIndex].civil) : 0,
        cells: cells.slice(start, start + 7),
      };
    });
  });
  readonly currentTime = computed(() => this.readCurrentTime() ?? localTime('00:00'));
  readonly hourSlots = computed(() => this.drumSlots(Number(this.currentTime().slice(0, 2)), 24));
  readonly minuteSlots = computed(() => this.drumSlots(Number(this.currentTime().slice(3, 5)), 60));
  readonly rangeAnnouncement = computed(() => {
    const range = this.readRange();
    const start = range.start ? `${this.texts().rangeStart}: ${this.formatCivil(range.start)}` : '';
    const end = range.end ? `${this.texts().rangeEnd}: ${this.formatCivil(range.end)}` : '';
    return [start, end].filter(Boolean).join('. ');
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.isOpen.set(false);
      this.draft.set(null);
      this.hoverDate.set(null);
    });
  }

  beginEditing(): void {
    if (this.disabled()) return;
    this.focusVisitActive = true;
    if (!this.textReadonly()) {
      this.draft.set({ raw: this.editableValue(), base: this.valueSignature() });
      this.draftState.set('valid');
    }
  }

  focus(options?: FocusOptions): void {
    this.textInput().nativeElement.focus(options);
  }

  onTextInput(event: Event): void {
    if (this.destroyed || this.disabled() || this.readonly() || this.textReadonly()) return;
    const raw = (event.target as HTMLInputElement).value;
    const base = this.valueSignature();
    if (raw.trim() === '') {
      const changed = this.commitEmpty();
      this.draft.set({ raw: '', base: this.valueSignature() });
      this.draftState.set('valid');
      if (changed) this.cleared.emit();
      return;
    }
    const state = this.parseAndCommit(raw.trim());
    this.draft.set({ raw, base: state === 'valid' ? this.valueSignature() : base });
    this.draftState.set(state);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && this.mode() !== 'time' && this.presentation() === 'overlay') {
      event.preventDefault();
      this.open();
    } else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && this.mode() === 'time') {
      event.preventDefault();
      this.changeMinute(event.key === 'ArrowUp' ? 1 : -1);
    } else if (event.key === 'Enter') {
      this.finishEditing();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.draft.set(null);
      this.close(true);
    }
  }

  toggle(): void {
    if (this.disabled() || this.presentation() !== 'overlay') return;
    if (this.isOpen()) this.close(true);
    else this.open();
  }

  protected onTriggerClick(event: MouseEvent): void {
    if (this.disabled() || this.destroyed || this.presentation() !== 'overlay') return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    this.focus({ preventScroll: true });
    this.open();
  }

  open(): void {
    if (this.disabled() || this.destroyed || this.isOpen() || this.presentation() !== 'overlay') return;
    this.focusVisitActive = true;
    const active = this.doc.activeElement;
    this.returnFocusElement =
      active instanceof HTMLElement && this.host.nativeElement.contains(active) ? active : null;
    this.seedCalendarView();
    this.isOpen.set(true);
  }

  close(returnFocus = false): void {
    if (!this.isOpen() || this.presentation() !== 'overlay') return;
    this.isOpen.set(false);
    this.hoverDate.set(null);
    this.finishEditing();
    if (returnFocus) {
      const target = this.returnFocusElement;
      queueMicrotask(() => {
        if (!this.destroyed && this.presentation() === 'overlay')
          (target?.isConnected ? target : this.textInput().nativeElement).focus();
      });
    }
  }

  onPanelAttached(): void {
    if (this.destroyed || this.panelAttached || this.presentation() !== 'overlay') return;
    this.panelAttached = true;
    this.opened.emit();
    if (this.mode() !== 'time') queueMicrotask(() => this.focusActiveCell());
  }

  onPanelDetached(): void {
    const attached = this.panelAttached;
    this.panelAttached = false;
    if (this.destroyed) return;
    this.isOpen.set(false);
    if (attached) this.closed.emit();
  }

  onPickerEscape(event: Event): void {
    if (this.presentation() === 'overlay') {
      event.stopPropagation();
      this.close(true);
    }
  }

  onPickerFocusIn(): void {
    if (!this.disabled() && !this.destroyed) this.focusVisitActive = true;
  }

  onCompositeFocusOut(): void {
    queueMicrotask(() => {
      if (this.destroyed || !this.focusVisitActive) return;
      const active = this.doc.activeElement;
      const insideHost = active instanceof Node && this.host.nativeElement.contains(active);
      const panel = this.doc.querySelector(`[data-neu-date-owner="${this.controlId()}"]`);
      const insidePanel = active instanceof Node && !!panel?.contains(active);
      if (insideHost || insidePanel) return;
      this.focusVisitActive = false;
      this.touch.emit();
    });
  }

  clear(): void {
    if (this.disabled() || this.readonly() || this.destroyed) return;
    if (this.commitEmpty()) this.cleared.emit();
    this.resetEphemeral();
    if (this.presentation() === 'overlay') this.close(true);
  }

  reset(): void {
    this.resetEphemeral();
    this.isOpen.set(false);
    this.focusVisitActive = false;
  }

  navigateMonth(delta: number): void {
    if (this.disabled() || this.destroyed || this.mode() === 'time') return;
    if (this.mode() === 'month') {
      const next = shiftCivilMonth({ year: this.viewYear(), month: this.viewMonth() + 1 }, delta);
      if (!next) return;
      this.viewYear.set(next.year);
      this.viewMonth.set(next.month - 1);
      this.focusedMonth.set(next.month);
      return;
    }
    if (this.mode() === 'year') {
      const next = this.viewYear() + delta;
      if (!validCivilYear(next)) return;
      this.viewYear.set(next);
      this.focusedYear.set(next);
      return;
    }
    const previous = this.visibleInterval();
    const next = new Date(Date.UTC(this.viewYear(), this.viewMonth() + delta, 1));
    this.viewYear.set(next.getUTCFullYear());
    this.viewMonth.set(next.getUTCMonth());
    this.emitViewChange(previous);
  }

  onMonthSelect(event: Event): void {
    if (this.disabled() || this.mode() === 'time') return;
    const month = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(month) || month < 0 || month > 11) return;
    const previous = this.visibleInterval();
    this.viewMonth.set(month);
    this.emitViewChange(previous);
  }

  onYearSelect(event: Event): void {
    if (this.disabled() || this.mode() === 'time') return;
    const year = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(year) || year < 1 || year > 9999) return;
    const previous = this.visibleInterval();
    this.viewYear.set(year);
    this.emitViewChange(previous);
  }

  selectCivilDate(date: CivilDate): void {
    if (this.mode() === 'month' || this.mode() === 'year') return;
    if (this.disabled() || this.readonly() || this.isDateDisabled(date)) return;
    this.activeDate.set(date);
    if (this.mode() === 'multiple') {
      const values = this.readMultiple();
      const next = values.includes(date)
        ? values.filter((item) => item !== date)
        : [...values, date];
      this.commit(next);
      return;
    }
    if (this.mode() === 'range') {
      const range = this.readRange();
      if (!range.start || range.end) this.commit({ start: date, end: null });
      else if (date < range.start) this.commit({ start: date, end: range.start });
      else this.commit({ start: range.start, end: date });
      this.hoverDate.set(null);
      return;
    }
    if (this.mode() === 'datetime') {
      this.commit(localDateTime(`${date}T${this.readCurrentTime() ?? '00:00'}`));
      return;
    }
    this.commit(date);
    if (this.presentation() === 'overlay') this.close(true);
  }

  isMonthDisabled(month: number): boolean {
    const candidate = { year: this.viewYear(), month };
    if (!isCivilMonth(candidate)) return true;
    const min: unknown = this.minDate();
    const max: unknown = this.maxDate();
    return (isCivilMonth(min) && compareCivilMonth(candidate, min) < 0) ||
      (isCivilMonth(max) && compareCivilMonth(candidate, max) > 0);
  }

  isYearDisabled(year: number): boolean {
    const candidate = { year };
    if (!isCivilYear(candidate)) return true;
    const min: unknown = this.minDate();
    const max: unknown = this.maxDate();
    return (isCivilYear(min) && compareCivilYear(candidate, min) < 0) ||
      (isCivilYear(max) && compareCivilYear(candidate, max) > 0);
  }

  isMonthSelected(month: number): boolean {
    const value: unknown = this.value();
    return isCivilMonth(value) && value.year === this.viewYear() && value.month === month;
  }

  isYearSelected(year: number): boolean {
    const value: unknown = this.value();
    return isCivilYear(value) && value.year === year;
  }

  selectMonth(month: number): void {
    if (this.mode() !== 'month' || this.disabled() || this.readonly() || this.isMonthDisabled(month)) return;
    this.focusedMonth.set(month);
    this.commit({ year: this.viewYear(), month });
    if (this.presentation() === 'overlay') this.close(true);
  }

  selectYear(year: number): void {
    if (this.mode() !== 'year' || this.disabled() || this.readonly() || this.isYearDisabled(year)) return;
    this.focusedYear.set(year);
    this.commit({ year });
    if (this.presentation() === 'overlay') this.close(true);
  }

  onMonthKeydown(event: KeyboardEvent, month: number): void {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectMonth(month);
      return;
    }
    let target: CivilMonth | null = null;
    if (event.key in moves) target = shiftCivilMonth({ year: this.viewYear(), month }, moves[event.key]);
    else if (event.key === 'Home') target = { year: this.viewYear(), month: Math.floor((month - 1) / 4) * 4 + 1 };
    else if (event.key === 'End') target = { year: this.viewYear(), month: Math.floor((month - 1) / 4) * 4 + 4 };
    else if (event.key === 'PageUp' || event.key === 'PageDown')
      target = shiftCivilMonth({ year: this.viewYear(), month }, event.key === 'PageUp' ? -12 : 12);
    if (!target) return;
    event.preventDefault();
    this.viewYear.set(target.year);
    this.focusedMonth.set(target.month);
    queueMicrotask(() => this.focusPeriodCell('data-civil-month', target!.month));
  }

  onYearKeydown(event: KeyboardEvent, year: number): void {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectYear(year);
      return;
    }
    const page = this.yearPage();
    let target: number | null = null;
    if (event.key in moves) target = year + moves[event.key];
    else if (event.key === 'Home') target = page[0];
    else if (event.key === 'End') target = page.at(-1)!;
    else if (event.key === 'PageUp' || event.key === 'PageDown') target = year + (event.key === 'PageUp' ? -12 : 12);
    if (target === null || !validCivilYear(target)) return;
    event.preventDefault();
    this.viewYear.set(target);
    this.focusedYear.set(target);
    queueMicrotask(() => this.focusPeriodCell('data-civil-year', target));
  }

  applyPreset(preset: NeuDatePreset): void {
    if (this.disabled() || this.readonly() || this.mode() !== 'range') return;
    const range = typeof preset.range === 'function' ? preset.range() : preset.range;
    if (
      (range.start && this.isDateDisabled(range.start)) ||
      (range.end && this.isDateDisabled(range.end))
    )
      return;
    this.commit({ start: range.start, end: range.end });
    this.hoverDate.set(null);
  }

  changeHour(delta: number): void {
    this.changeTime(delta * 60);
  }

  changeMinute(delta: number): void {
    this.changeTime(delta * this.resolvedStep());
  }

  onCalendarKeydown(event: KeyboardEvent, date: CivilDate): void {
    if (this.disabled()) return;
    let next: CivilDate | null = null;
    if (event.key === 'ArrowLeft') next = this.addDays(date, -1);
    else if (event.key === 'ArrowRight') next = this.addDays(date, 1);
    else if (event.key === 'ArrowUp') next = this.addDays(date, -7);
    else if (event.key === 'ArrowDown') next = this.addDays(date, 7);
    else if (event.key === 'Home')
      next = this.addDays(date, -this.weekOffset(this.toUtcDate(date)));
    else if (event.key === 'End')
      next = this.addDays(date, 6 - this.weekOffset(this.toUtcDate(date)));
    else if (event.key === 'PageUp') next = this.addMonths(date, -1);
    else if (event.key === 'PageDown') next = this.addMonths(date, 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectCivilDate(date);
      return;
    } else return;
    event.preventDefault();
    this.moveActive(next);
  }

  isDateDisabled(date: CivilDate): boolean {
    const min = this.dateBoundary(this.minDate());
    const max = this.dateBoundary(this.maxDate());
    if ((min && date < min) || (max && date > max)) return true;
    const disabled = this.disabledDates();
    return typeof disabled === 'function' ? disabled(date) : disabled.includes(date);
  }

  private parseAndCommit(raw: string): ParseState {
    try {
      if (this.mode() === 'date') this.commit(civilDate(raw));
      else if (this.mode() === 'time') this.commit(localTime(raw));
      else if (this.mode() === 'datetime') this.commit(localDateTime(raw));
      else return 'invalid';
      return 'valid';
    } catch {
      return this.isIncompleteText(raw) ? 'incomplete' : 'invalid';
    }
  }

  private isIncompleteText(raw: string): boolean {
    if (this.mode() === 'date')
      return raw.length < 10 && /^\d{0,4}(?:-\d{0,2}(?:-\d{0,2})?)?$/.test(raw);
    if (this.mode() === 'time')
      return raw.length < 5 && /^\d{0,2}(?::\d{0,2}(?::\d{0,2})?)?$/.test(raw);
    if (this.mode() === 'datetime')
      return (
        raw.length < 16 &&
        /^\d{0,4}(?:-\d{0,2}(?:-\d{0,2})?)?(?:T\d{0,2}(?::\d{0,2}(?::\d{0,2})?)?)?$/.test(raw)
      );
    return false;
  }

  private finishEditing(): void {
    this.draft.set(null);
    this.draftState.set('valid');
  }

  private commit(
    next: CivilDate | LocalTime | LocalDateTime | readonly CivilDate[] | CivilDateRange | CivilMonth | CivilYear,
  ): boolean {
    if (this.sameValue(this.value(), next)) return false;
    this.value.set(next as V);
    return true;
  }

  private commitEmpty(): boolean {
    const next = emptyDateValue(this.mode()) as V;
    if (this.sameValue(this.value(), next)) return false;
    this.value.set(next);
    return true;
  }

  private sameValue(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) return true;
    if (Array.isArray(left) && Array.isArray(right))
      return (
        left.length === right.length && left.every((value, index) => Object.is(value, right[index]))
      );
    if (this.isRangeObject(left) && this.isRangeObject(right))
      return Object.is(left.start, right.start) && Object.is(left.end, right.end);
    if (isCivilMonth(left) && isCivilMonth(right))
      return left.year === right.year && left.month === right.month;
    if (isCivilYear(left) && isCivilYear(right)) return left.year === right.year;
    return false;
  }

  private isEmptyValue(): boolean {
    const value: unknown = this.value();
    if (this.mode() === 'multiple') return !Array.isArray(value) || value.length === 0;
    if (this.mode() === 'range') {
      const range = this.readRange();
      return !range.start && !range.end;
    }
    return value === null;
  }

  private readDate(): CivilDate | null {
    const value: unknown = this.value();
    if (this.mode() === 'date') return isCivilDate(value) ? value : null;
    if (this.mode() === 'datetime' && isLocalDateTime(value)) return civilDate(value.slice(0, 10));
    return null;
  }

  private readCurrentTime(): LocalTime | null {
    const value: unknown = this.value();
    if (this.mode() === 'time') return isLocalTime(value) ? value : null;
    if (this.mode() === 'datetime' && isLocalDateTime(value)) return localTime(value.slice(11));
    return null;
  }

  private readMultiple(): readonly CivilDate[] {
    const value: unknown = this.value();
    return Array.isArray(value) && value.every(isCivilDate) ? value : [];
  }

  private readRange(): CivilDateRange {
    const value: unknown = this.value();
    if (!this.isRangeObject(value)) return { start: null, end: null };
    return {
      start: isCivilDate(value.start) ? value.start : null,
      end: isCivilDate(value.end) ? value.end : null,
    };
  }

  private isRangeObject(value: unknown): value is CivilDateRange {
    return typeof value === 'object' && value !== null && 'start' in value && 'end' in value;
  }

  private editableValue(): string {
    const value: unknown = this.value();
    return typeof value === 'string' ? value : '';
  }

  private formatValue(): string {
    const value: unknown = this.value();
    if (this.mode() === 'month') {
      if (!isCivilMonth(value)) return '';
      const label = this.monthOptions()[value.month - 1]?.label;
      return label ? `${label} ${value.year}` : '';
    }
    if (this.mode() === 'year') return isCivilYear(value) ? String(value.year) : '';
    if (this.mode() === 'date') return isCivilDate(value) ? this.formatCivil(value) : '';
    if (this.mode() === 'time') return isLocalTime(value) ? value : '';
    if (this.mode() === 'datetime') {
      if (!isLocalDateTime(value)) return '';
      return `${this.formatCivil(civilDate(value.slice(0, 10)))}, ${value.slice(11)}`;
    }
    if (this.mode() === 'multiple')
      return this.readMultiple()
        .map((date) => this.formatCivil(date))
        .join(', ');
    const range = this.readRange();
    if (!range.start && !range.end) return '';
    if (!range.start) return this.formatCivil(range.end!);
    if (!range.end) return this.formatCivil(range.start);
    return `${this.formatCivil(range.start)} – ${this.formatCivil(range.end)}`;
  }

  private formatCivil(value: CivilDate): string {
    const options: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      medium: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
      numeric: { day: 'numeric', month: 'numeric', year: '2-digit' },
    };
    return new Intl.DateTimeFormat(this.resolvedLocale(), {
      ...options[this.dateFormat()],
      timeZone: 'UTC',
    }).format(this.toUtcDate(value));
  }

  private buildCalendarDays(): CalendarCell[] {
    const year = this.viewYear();
    const month = this.viewMonth();
    const first = new Date(Date.UTC(year, month, 1));
    const offset = this.weekOffset(first);
    const firstCell = new Date(Date.UTC(year, month, 1 - offset));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell.getTime());
      date.setUTCDate(firstCell.getUTCDate() + index);
      const value = this.fromUtcDate(date);
      const range = this.readRange();
      const previewEnd = range.end ?? this.hoverDate();
      const lower =
        range.start && previewEnd ? (range.start < previewEnd ? range.start : previewEnd) : null;
      const upper =
        range.start && previewEnd ? (range.start < previewEnd ? previewEnd : range.start) : null;
      return {
        civil: value,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === month,
        today: value === this.todayCivil,
        selected: this.isSelected(value),
        rangeStart: range.start === value,
        rangeEnd: range.end === value,
        inRange: !!lower && !!upper && value > lower && value < upper,
        disabled: this.isDateDisabled(value),
        label: this.formatDayLabel(value),
      };
    });
  }

  private isSelected(value: CivilDate): boolean {
    if (this.mode() === 'multiple') return this.readMultiple().includes(value);
    if (this.mode() === 'range') {
      const range = this.readRange();
      return range.start === value || range.end === value;
    }
    return this.readDate() === value;
  }

  private formatDayLabel(value: CivilDate): string {
    return new Intl.DateTimeFormat(this.resolvedLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(this.toUtcDate(value));
  }

  private seedCalendarView(): void {
    const anchor = this.initialViewAnchor();
    this.viewYear.set(anchor.year);
    this.viewMonth.set(anchor.monthIndex);
    this.focusedMonth.set(anchor.monthIndex + 1);
    this.focusedYear.set(anchor.year);
    if (this.mode() === 'month' || this.mode() === 'year') return;
    const range = this.readRange();
    const date = this.readDate() ?? this.readMultiple()[0] ?? range.start ?? this.todayCivil;
    const parsed = this.toUtcDate(date);
    this.viewYear.set(parsed.getUTCFullYear());
    this.viewMonth.set(parsed.getUTCMonth());
    this.activeDate.set(date);
  }

  private visibleInterval(): NeuDateViewChangeEvent {
    const cells = this.buildCalendarDays();
    return { start: cells[0].civil, end: this.addDays(cells.at(-1)!.civil, 1) };
  }

  private emitViewChange(previous: NeuDateViewChangeEvent): void {
    if (!this.isOpen() || this.destroyed) return;
    const next = this.visibleInterval();
    if (next.start !== previous.start || next.end !== previous.end) this.viewChange.emit(next);
  }

  private moveActive(candidate: CivilDate): void {
    let next = candidate;
    const direction = candidate < this.activeDate() ? -1 : 1;
    for (let attempts = 0; attempts < 366 && this.isDateDisabled(next); attempts += 1)
      next = this.addDays(next, direction);
    const previous = this.visibleInterval();
    const parsed = this.toUtcDate(next);
    this.viewYear.set(parsed.getUTCFullYear());
    this.viewMonth.set(parsed.getUTCMonth());
    this.activeDate.set(next);
    this.emitViewChange(previous);
    queueMicrotask(() => this.focusActiveCell());
  }

  private focusActiveCell(): void {
    if (this.destroyed || this.presentation() !== 'overlay' || !this.isOpen()) return;
    if (this.mode() === 'month') {
      this.focusPeriodCell('data-civil-month', this.focusedMonth());
      return;
    }
    if (this.mode() === 'year') {
      this.focusPeriodCell('data-civil-year', this.focusedYear());
      return;
    }
    this.doc
      .querySelector<HTMLElement>(
        `[data-neu-date-owner="${this.controlId()}"] [data-civil-date="${this.activeDate()}"]`,
      )
      ?.focus();
  }

  private focusPeriodCell(attribute: 'data-civil-month' | 'data-civil-year', value: number): void {
    if (this.destroyed) return;
    this.doc.querySelector<HTMLElement>(
      `[data-neu-date-owner="${this.controlId()}"] [${attribute}="${value}"]`,
    )?.focus();
  }

  private initialViewAnchor(): { year: number; monthIndex: number } {
    const value: unknown = this.value();
    if (this.mode() === 'month') {
      const min: unknown = this.minDate();
      const max: unknown = this.maxDate();
      const today = { year: this.initialToday.getFullYear(), month: this.initialToday.getMonth() + 1 };
      const chosen = isCivilMonth(value) ? value : today;
      const bounded = isCivilMonth(min) && compareCivilMonth(chosen, min) < 0 ? min :
        isCivilMonth(max) && compareCivilMonth(chosen, max) > 0 ? max : chosen;
      return { year: bounded.year, monthIndex: bounded.month - 1 };
    }
    if (this.mode() === 'year') {
      const min: unknown = this.minDate();
      const max: unknown = this.maxDate();
      const chosen = isCivilYear(value) ? value : { year: this.initialToday.getFullYear() };
      const bounded = isCivilYear(min) && compareCivilYear(chosen, min) < 0 ? min :
        isCivilYear(max) && compareCivilYear(chosen, max) > 0 ? max : chosen;
      return { year: bounded.year, monthIndex: this.initialToday.getMonth() };
    }
    const range = this.readRange();
    const date = this.readDate() ?? this.readMultiple()[0] ?? range.start ?? this.todayCivil;
    return { year: Number(date.slice(0, 4)), monthIndex: Number(date.slice(5, 7)) - 1 };
  }

  private changeTime(deltaMinutes: number): void {
    if (
      this.disabled() ||
      this.readonly() ||
      (this.mode() !== 'time' && this.mode() !== 'datetime')
    )
      return;
    const current = this.readCurrentTime() ?? localTime('00:00');
    const seconds = current.length === 8 ? current.slice(6) : '';
    const total = Number(current.slice(0, 2)) * 60 + Number(current.slice(3, 5));
    const nextTotal = (((total + deltaMinutes) % 1440) + 1440) % 1440;
    const next = localTime(
      `${String(Math.floor(nextTotal / 60)).padStart(2, '0')}:${String(nextTotal % 60).padStart(2, '0')}${seconds ? `:${seconds}` : ''}`,
    );
    if (this.mode() === 'time') this.commit(next);
    else this.commit(localDateTime(`${this.readDate() ?? this.todayCivil}T${next}`));
  }

  private resolvedStep(): number {
    return Number.isFinite(this.step()) && this.step() > 0
      ? Math.max(1, Math.trunc(this.step()))
      : 1;
  }

  private drumSlots(value: number, max: number): DrumSlot[] {
    return [-1, 0, 1].map((offset) => {
      const next = (((value + offset) % max) + max) % max;
      return { value: next, offset, label: String(next).padStart(2, '0') };
    });
  }

  private dateBoundary(value: unknown): CivilDate | null {
    if (isCivilDate(value)) return value;
    return isLocalDateTime(value) ? civilDate(value.slice(0, 10)) : null;
  }

  private resetEphemeral(): void {
    this.draft.set(null);
    this.draftState.set('valid');
    this.hoverDate.set(null);
  }

  private addDays(value: CivilDate, amount: number): CivilDate {
    const date = this.toUtcDate(value);
    date.setUTCDate(date.getUTCDate() + amount);
    return this.fromUtcDate(date);
  }

  private addMonths(value: CivilDate, amount: number): CivilDate {
    const date = this.toUtcDate(value);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return this.fromUtcDate(date);
  }

  private toUtcDate(value: CivilDate): Date {
    return new Date(
      Date.UTC(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        Number(value.slice(8, 10)),
      ),
    );
  }

  private fromUtcDate(value: Date): CivilDate {
    return civilDate(
      `${String(value.getUTCFullYear()).padStart(4, '0')}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`,
    );
  }

  private normalizedFirstDay(): number {
    return Math.min(6, Math.max(0, Math.trunc(this.firstDayOfWeek())));
  }

  private weekOffset(value: Date): number {
    return (value.getUTCDay() - this.normalizedFirstDay() + 7) % 7;
  }

  private capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }
}

/** Public mode-specialized instance type. */
export type NeuDateInputComponent<M extends NeuDateMode = 'date'> = NeuDateInputControl<
  NeuDateValue<M>
>;

/** Runtime Angular component constructor with direct field-value inference. */
export const NeuDateInputComponent = NeuDateInputControl;
