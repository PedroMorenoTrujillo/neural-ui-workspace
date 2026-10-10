import { describe, expect, it } from 'vitest';
import {
  createNeuTableRemoteCoordinatorState,
  transitionNeuTableRemoteCoordinator,
} from './internal/remote/neu-table-remote-coordinator';
import { areNeuTableQuerySlicesEqual } from './internal/query-ui/neu-table-query-transitions';
import {
  doesNeuTableRangeCover,
  projectNeuTableSpacerSizes,
  projectNeuTableVirtualWindow,
} from './internal/virtualization/neu-table-virtualization';
import type { NeuTableMetadata, NeuTableQuery } from './public/neu-table.types';

type Field = 'id';
const query: NeuTableQuery<Field> = {
  page: 0,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
};
const metadata: NeuTableMetadata = {
  totalItems: 1_000_000,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: 1,
  dataRange: { start: 0, end: 50 },
};
const virtualization = {
  enabled: true as const,
  itemSize: 32,
  overscan: 4,
  requestStep: 50,
};
const equal = (left: NeuTableQuery<Field>, right: NeuTableQuery<Field>) =>
  areNeuTableQuerySlicesEqual(
    left,
    right,
    { mode: 'single', removable: true, defaultDirection: 'asc', resetPageOnChange: true },
    Object.is,
  );

function metric(run: () => void, iterations = 1_000) {
  const samples: number[] = [];
  for (let sample = 0; sample < 25; sample += 1) {
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) run();
    samples.push((performance.now() - started) / iterations);
  }
  samples.sort((left, right) => left - right);
  return { samples: samples.length, p50Ms: samples[12]!, p95Ms: samples[23]! };
}

describe('NeuTable virtualization performance evidence', () => {
  it('captures O(1) math, 10k windows, 1M remote ranges, requests, jumps and lifecycle', () => {
    const rows = Array.from({ length: 10_000 }, (_, id) => id);
    const project = (scrollTop: number, total: number | null = rows.length) =>
      projectNeuTableVirtualWindow({
        geometry: { measured: true, scrollTop, viewportSize: 640 },
        total,
        virtualization,
      });
    const initial = transitionNeuTableRemoteCoordinator(
      createNeuTableRemoteCoordinatorState<Field>(),
      {
        browserActive: true,
        dataMode: 'remote',
        metadata: { ...metadata, appliedRequestId: null, dataRange: undefined },
        query,
        requiredRange: { start: 0, end: 50 },
        retryToken: 0,
        virtualizationEnabled: true,
      },
      equal,
    );
    const current = transitionNeuTableRemoteCoordinator(
      initial.state,
      {
        browserActive: true,
        dataMode: 'remote',
        metadata,
        query,
        requiredRange: { start: 0, end: 50 },
        retryToken: 0,
        virtualizationEnabled: true,
      },
      equal,
    );
    let scrollRequestCount = 0;
    let scrollState = current.state;
    const scrollRanges = Array.from({ length: 1_000 }, (_, index) =>
      project(index * 16, 1_000_000),
    );

    const metrics = {
      pureRangeMath: metric(() => project(15_999_984, 1_000_000), 10_000),
      client10kTop: metric(() => {
        const range = project(0).render;
        rows.slice(range.start, range.end);
      }),
      client10kMiddle: metric(() => {
        const range = project(160_000).render;
        rows.slice(range.start, range.end);
      }),
      client10kEnd: metric(() => {
        const range = project(319_360).render;
        rows.slice(range.start, range.end);
      }),
      repeatedScroll1000: metric(() => {
        for (const projection of scrollRanges) {
          projectNeuTableSpacerSizes({
            itemSize: projection.itemSize,
            mounted: projection.render,
            total: 1_000_000,
          });
        }
      }, 50),
      remote1MProjection: metric(() => project(24_000_000, 1_000_000), 10_000),
      rangeCoverage: metric(
        () =>
          doesNeuTableRangeCover(
            { start: 499_950, end: 500_050 },
            { start: 499_998, end: 500_020 },
          ),
        10_000,
      ),
      requestDecision: metric(() => {
        transitionNeuTableRemoteCoordinator(
          current.state,
          {
            browserActive: true,
            dataMode: 'remote',
            metadata,
            query,
            requiredRange: { start: 500_000, end: 500_050 },
            retryToken: 0,
            virtualizationEnabled: true,
          },
          equal,
        );
      }),
      largeJump: metric(() => project(31_999_360, 1_000_000), 10_000),
      createDestroy50: metric(() => {
        for (let index = 0; index < 50; index += 1) {
          const state = createNeuTableRemoteCoordinatorState<Field>();
          void { ...state, destroyed: true };
        }
      }, 1_000),
      maxClientRenderRows: Math.max(
        project(0).render.end - project(0).render.start,
        project(160_000).render.end - project(160_000).render.start,
        project(319_360).render.end - project(319_360).render.start,
      ),
      remoteLogicalTotal: 1_000_000,
    };

    for (const projection of scrollRanges) {
      const result = transitionNeuTableRemoteCoordinator(
        scrollState,
        {
          browserActive: true,
          dataMode: 'remote',
          metadata,
          query,
          requiredRange: projection.request,
          retryToken: 0,
          virtualizationEnabled: true,
        },
        equal,
      );
      if (result.request !== null) scrollRequestCount += 1;
      scrollState = result.state;
    }

    expect(metrics.maxClientRenderRows).toBeLessThanOrEqual(28);
    expect(metrics.remoteLogicalTotal).toBe(1_000_000);
    expect(scrollRequestCount).toBeLessThan(20);
    const payload = {
      ...metrics,
      repeatedScrollRequests: scrollRequestCount,
      repeatedScrollEvents: scrollRanges.length,
    };
    const runtime = globalThis as typeof globalThis & {
      readonly process?: { readonly stdout?: { write(value: string): void } };
    };
    runtime.process?.stdout?.write(
      `N2_TABLE_VIRTUALIZATION_PERFORMANCE:${JSON.stringify(payload)}\n`,
    );
  }, 30_000);
});
