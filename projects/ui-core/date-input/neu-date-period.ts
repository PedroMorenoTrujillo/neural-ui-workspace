import type { CivilDate, CivilMonth, CivilYear } from './neu-date-value';

/** Private civil-period math. Never constructs a Date or applies a time zone. */
export function validCivilYear(year: unknown): year is number {
  return typeof year === 'number' && Number.isInteger(year) && year >= 1 && year <= 9999;
}

export function isCivilMonth(value: unknown): value is CivilMonth {
  if (typeof value !== 'object' || value === null) return false;
  const month = value as Partial<CivilMonth>;
  return validCivilYear(month.year) && Number.isInteger(month.month) && month.month! >= 1 && month.month! <= 12;
}

export function isCivilYear(value: unknown): value is CivilYear {
  return typeof value === 'object' && value !== null && validCivilYear((value as Partial<CivilYear>).year);
}

export function compareCivilMonth(left: CivilMonth, right: CivilMonth): number {
  return left.year - right.year || left.month - right.month;
}

export function compareCivilYear(left: CivilYear, right: CivilYear): number {
  return left.year - right.year;
}

export function shiftCivilMonth(value: CivilMonth, delta: number): CivilMonth | null {
  const ordinal = (value.year - 1) * 12 + value.month - 1 + delta;
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= 9999 * 12) return null;
  return { year: Math.floor(ordinal / 12) + 1, month: ordinal % 12 + 1 };
}

function leap(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysBeforeYear(year: number): number {
  const previous = year - 1;
  return 365 * previous + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400);
}

function ordinal(year: number, month: number, day: number): number {
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return daysBeforeYear(year) + monthDays[month - 1] + (month > 2 && leap(year) ? 1 : 0) + day;
}

function isoWeekStart(year: number): number {
  const januaryFourth = ordinal(year, 1, 4);
  return januaryFourth - ((januaryFourth - 1) % 7);
}

/** ISO-8601 week for an already-valid CivilDate, independent of locale/grid start. */
export function isoWeekNumber(value: CivilDate): number {
  const year = Number(value.slice(0, 4));
  const day = ordinal(year, Number(value.slice(5, 7)), Number(value.slice(8, 10)));
  const start = isoWeekStart(year);
  if (day < start) return Math.floor((day - isoWeekStart(year - 1)) / 7) + 1;
  const nextStart = isoWeekStart(year + 1);
  return Math.floor((day - (day >= nextStart ? nextStart : start)) / 7) + 1;
}
