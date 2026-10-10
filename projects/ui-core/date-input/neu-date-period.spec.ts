import { civilDate } from './neu-date-value';
import {
  compareCivilMonth,
  compareCivilYear,
  isCivilMonth,
  isCivilYear,
  isoWeekNumber,
  shiftCivilMonth,
  validCivilYear,
} from './neu-date-period';

describe('N2-025 private civil-period math', () => {
  it('uses the same 1..9999 year bounds as CivilDate and rejects invalid months', () => {
    expect(validCivilYear(1)).toBe(true);
    expect(validCivilYear(9999)).toBe(true);
    for (const value of [0, 10000, 2.5, NaN, Infinity, '2026']) {
      expect(validCivilYear(value)).toBe(false);
    }
    expect(isCivilMonth({ year: 2026, month: 1 })).toBe(true);
    expect(isCivilMonth({ year: 2026, month: 12 })).toBe(true);
    expect(isCivilMonth({ year: 2026, month: 0 })).toBe(false);
    expect(isCivilMonth({ year: 2026, month: 13 })).toBe(false);
    expect(isCivilMonth({ year: 0, month: 1 })).toBe(false);
    expect(isCivilYear({ year: 2026 })).toBe(true);
    expect(isCivilYear({ year: 10000 })).toBe(false);
  });

  it('compares and shifts months and years without Date or timezone conversion', () => {
    expect(compareCivilMonth({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBeLessThan(0);
    expect(compareCivilMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(0);
    expect(compareCivilYear({ year: 2027 }, { year: 2026 })).toBeGreaterThan(0);
    expect(shiftCivilMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftCivilMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftCivilMonth({ year: 1, month: 1 }, -1)).toBeNull();
    expect(shiftCivilMonth({ year: 9999, month: 12 }, 1)).toBeNull();
  });

  it('calculates ISO weeks across December/January and 52/53-week boundaries', () => {
    expect(isoWeekNumber(civilDate('2020-12-31'))).toBe(53);
    expect(isoWeekNumber(civilDate('2021-01-01'))).toBe(53);
    expect(isoWeekNumber(civilDate('2021-01-04'))).toBe(1);
    expect(isoWeekNumber(civilDate('2022-01-01'))).toBe(52);
    expect(isoWeekNumber(civilDate('2026-12-31'))).toBe(53);
    expect(isoWeekNumber(civilDate('2027-01-01'))).toBe(53);
  });
});
