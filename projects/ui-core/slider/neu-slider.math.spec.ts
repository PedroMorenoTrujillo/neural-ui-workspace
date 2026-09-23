import { sliderCommitRange, sliderSnap, sliderVisualRange } from './neu-slider.math';

describe('B7 slider pure numeric math', () => {
  it('snaps from the minimum with stable decimal precision', () => {
    expect(sliderSnap(0.299999, 0, 0.1)).toBe(0.3);
    expect(sliderSnap(0.65, 0.05, 0.2)).toBe(0.65);
  });

  it('derives ordered visual bounds from invalid external tuples without mutation', () => {
    const applied = Object.freeze([90, 10] as const);
    expect(sliderVisualRange(applied, 0, 100, 20)).toEqual([10, 90]);
    expect(applied).toEqual([90, 10]);
    expect(sliderVisualRange([Number.NaN, 30], 0, 100, 0)).toEqual([0, 30]);
    expect(sliderVisualRange([95, 95], 0, 100, 20)).toEqual([80, 100]);
  });

  it('never swaps thumbs and snaps to a lattice inside the opposite thumb constraint', () => {
    expect(sliderCommitRange([20, 80], 0, 99, 0, 100, 10, 20)).toEqual([60, 80]);
    expect(sliderCommitRange([20, 80], 1, -99, 0, 100, 10, 20)).toEqual([20, 40]);
    expect(sliderCommitRange([7, 50], 0, 99, 0, 100, 7, 14)).toEqual([35, 49]);
  });
});
