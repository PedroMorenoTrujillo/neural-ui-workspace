export const N2_COVERAGE_FLOOR = Object.freeze({ numerator: 9501, denominator: 10000 });
export const N2_COVERAGE_METRICS = Object.freeze(['statements', 'branches', 'functions', 'lines']);

export function evaluateN2CoverageHardGate(metrics) {
  const results = [];
  for (const name of N2_COVERAGE_METRICS) {
    const { covered, total } = metrics?.[name] ?? {};
    if (!Number.isSafeInteger(covered) || !Number.isSafeInteger(total) ||
        total <= 0 || covered < 0 || covered > total) {
      throw new Error(`Invalid ${name} coverage counts`);
    }
    const required = Math.ceil(total * N2_COVERAGE_FLOOR.numerator /
      N2_COVERAGE_FLOOR.denominator);
    results.push({ name, covered, total, required,
      missing: Math.max(0, required - covered), pass: covered >= required });
  }
  return { ok: results.every((result) => result.pass), results };
}
