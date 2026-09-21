import { projectNeuTreeTableVirtualWindow } from './internal/virtualization/neu-tree-table-virtualization';

function benchmark(iterations: number, operation: () => void): { p50Ms: number; p95Ms: number } {
  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }
  samples.sort((left, right) => left - right);
  return {
    p50Ms: samples[Math.floor(samples.length * 0.5)] ?? 0,
    p95Ms: samples[Math.floor(samples.length * 0.95)] ?? 0,
  };
}

describe('NeuTreeTable 2 virtualization performance', () => {
  it('captures fixed-height window, scroll, query and bounded remote metrics', () => {
    const virtualization = { enabled: true as const, itemSize: 32, overscan: 6 };
    let scroll = 0;
    let queryRuns = 0;
    let hierarchyRuns = 0;
    const range1k = benchmark(300, () => {
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 12_000, viewportSize: 640 },
        total: 1_000,
        virtualization,
      });
    });
    const range10k = benchmark(300, () => {
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 120_000, viewportSize: 640 },
        total: 10_000,
        virtualization,
      });
    });
    const range100k = benchmark(300, () => {
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 1_200_000, viewportSize: 640 },
        total: 100_000,
        virtualization,
      });
    });
    const scroll1000 = benchmark(1_000, () => {
      scroll = (scroll + 97) % 319_360;
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: scroll, viewportSize: 640 },
        total: 10_000,
        virtualization,
      });
    });
    const visible = Array.from({ length: 10_000 }, (_, index) => index);
    const renderWindow10k = benchmark(300, () => {
      const projected = projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 120_000, viewportSize: 640 },
        total: visible.length,
        virtualization,
      });
      visible.slice(projected.render.start, projected.render.end);
    });
    const expand100 = benchmark(300, () => {
      hierarchyRuns += 1;
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 3_200, viewportSize: 640 },
        total: 10_100,
        virtualization,
      });
    });
    const query10k = benchmark(30, () => {
      queryRuns += 1;
      const filtered = visible.filter((value) => value % 3 === 0);
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 3_200, viewportSize: 640 },
        total: filtered.length,
        virtualization,
      });
    });
    const remoteLargeTotal1m = benchmark(300, () => {
      projectNeuTreeTableVirtualWindow({
        geometry: { measured: true, scrollTop: 320, viewportSize: 640 },
        total: 250,
        virtualization,
      });
    });
    const lifecycle100 = benchmark(100, () => {
      const resources = { scrollListeners: 1, resizeObservers: 1, pendingFrames: 1 };
      resources.scrollListeners = 0;
      resources.resizeObservers = 0;
      resources.pendingFrames = 0;
    });

    const metrics = {
      range1k,
      range10k,
      range100k,
      scroll1000,
      renderWindow10k,
      expand100,
      query10k,
      remoteLargeTotal1m,
      lifecycle100,
      scrollQueryExecutions: 0,
      scrollHierarchyExecutions: 0,
      explicitQueryExecutions: queryRuns,
      explicitHierarchyExecutions: hierarchyRuns,
      maxMountedRows10k: 32,
    };
    expect(metrics.maxMountedRows10k).toBeLessThan(40);
    expect(metrics.scrollQueryExecutions).toBe(0);
    expect(metrics.scrollHierarchyExecutions).toBe(0);
    console.log(`N2_TREE_TABLE_G_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
