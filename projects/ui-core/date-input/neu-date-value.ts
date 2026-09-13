declare const civilDateBrand: unique symbol;
declare const localTimeBrand: unique symbol;
declare const localDateTimeBrand: unique symbol;

/** A calendar date without a time or time zone, encoded as YYYY-MM-DD. */
export type CivilDate = string & { readonly [civilDateBrand]: true };

/** A wall-clock time without a date or time zone, encoded as HH:mm or HH:mm:ss. */
export type LocalTime = string & { readonly [localTimeBrand]: true };

/** A local calendar date and wall-clock time without a time zone. */
export type LocalDateTime = string & { readonly [localDateTimeBrand]: true };

export interface CivilDateRange {
  readonly start: CivilDate | null;
  readonly end: CivilDate | null;
}

export type NeuDateMode = 'date' | 'time' | 'datetime' | 'multiple' | 'range';

export interface NeuDateValueMap {
  readonly date: CivilDate | null;
  readonly time: LocalTime | null;
  readonly datetime: LocalDateTime | null;
  readonly multiple: readonly CivilDate[];
  readonly range: CivilDateRange;
}

export type NeuDateValue<M extends NeuDateMode> = NeuDateValueMap[M];

export type NeuDateBoundary<M extends NeuDateMode> = M extends 'time'
  ? LocalTime
  : M extends 'datetime'
    ? LocalDateTime
    : CivilDate;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/;

/** Validates and brands an ISO civil date without constructing a Date. */
export function civilDate(value: string): CivilDate {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid CivilDate: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new RangeError(`Invalid CivilDate: ${value}`);
  }
  return value as CivilDate;
}

/** Validates and brands a local wall-clock time without applying a time zone. */
export function localTime(value: string): LocalTime {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid LocalTime: ${value}`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) throw new RangeError(`Invalid LocalTime: ${value}`);
  return value as LocalTime;
}

/** Validates and brands a local date-time without UTC conversion. */
export function localDateTime(value: string): LocalDateTime {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid LocalDateTime: ${value}`);
  civilDate(match[1]);
  localTime(match[2]);
  return value as LocalDateTime;
}

export function isCivilDate(value: unknown): value is CivilDate {
  if (typeof value !== 'string') return false;
  try {
    civilDate(value);
    return true;
  } catch {
    return false;
  }
}

export function isLocalTime(value: unknown): value is LocalTime {
  if (typeof value !== 'string') return false;
  try {
    localTime(value);
    return true;
  } catch {
    return false;
  }
}

export function isLocalDateTime(value: unknown): value is LocalDateTime {
  if (typeof value !== 'string') return false;
  try {
    localDateTime(value);
    return true;
  } catch {
    return false;
  }
}

export function emptyDateValue(mode: 'date'): CivilDate | null;
export function emptyDateValue(mode: 'time'): LocalTime | null;
export function emptyDateValue(mode: 'datetime'): LocalDateTime | null;
export function emptyDateValue(mode: 'multiple'): readonly CivilDate[];
export function emptyDateValue(mode: 'range'): CivilDateRange;
export function emptyDateValue<M extends NeuDateMode>(mode: M): NeuDateValue<M>;
export function emptyDateValue(
  mode: NeuDateMode,
): CivilDate | LocalTime | LocalDateTime | readonly CivilDate[] | CivilDateRange | null {
  if (mode === 'multiple') return [];
  if (mode === 'range') return { start: null, end: null };
  return null;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
