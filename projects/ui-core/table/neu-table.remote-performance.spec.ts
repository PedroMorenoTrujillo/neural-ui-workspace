import { describe, expect, it } from 'vitest';
import {
  createNeuTableRemoteCoordinatorState,
  transitionNeuTableRemoteCoordinator,
  type NeuTableRemoteCoordinatorInput,
  type NeuTableRemoteCoordinatorState,
} from './internal/remote/neu-table-remote-coordinator';
import { areNeuTableQuerySlicesEqual } from './internal/query-ui/neu-table-query-transitions';
import type { NeuTableMetadata, NeuTableQuery } from './public/neu-table.types';

type Field = 'name';
const query = (search = ''): NeuTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search,
  sort: [],
  filters: null,
});
const metadata = (requestId: number | null = null): NeuTableMetadata => ({
  totalItems: 100,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: requestId,
});
const equal = (left: NeuTableQuery<Field>, right: NeuTableQuery<Field>) =>
  areNeuTableQuerySlicesEqual(
    left,
    right,
    { mode: 'single', removable: true, defaultDirection: 'asc', resetPageOnChange: true },
    Object.is,
  );
const input = (
  overrides: Partial<NeuTableRemoteCoordinatorInput<Field>> = {},
): NeuTableRemoteCoordinatorInput<Field> => ({
  browserActive: true,
  dataMode: 'remote',
  metadata: metadata(),
  query: query(),
  retryToken: 0,
  ...overrides,
});
const transition = (
  state: NeuTableRemoteCoordinatorState<Field>,
  overrides: Partial<NeuTableRemoteCoordinatorInput<Field>> = {},
) => transitionNeuTableRemoteCoordinator(state, input(overrides), equal);

function metric(run: () => void, iterations = 1_000) {
  const samples: number[] = [];
  for (let sample = 0; sample < 25; sample += 1) {
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) run();
    samples.push((performance.now() - started) / iterations);
  }
  samples.sort((left, right) => left - right);
  return {
    samples: samples.length,
    p50Ms: samples[12]!,
    p95Ms: samples[23]!,
  };
}

describe('NeuTable remote coordinator performance', () => {
  it('captures deterministic p50/p95 decision costs and no-request storms', () => {
    const initial = transition(createNeuTableRemoteCoordinatorState<Field>());
    const current = transition(initial.state, { metadata: metadata(1) });
    const changed = transition(current.state, { query: query('next'), metadata: metadata(1) });
    const currentChanged = transition(changed.state, {
      query: query('next'),
      metadata: { ...metadata(2), queryRevision: 1 },
    });
    let metadataRequests = 0;
    let metadataState = currentChanged.state;
    const metadataStorm = metric(() => {
      for (let index = 0; index < 1_000; index += 1) {
        const result = transition(metadataState, {
          query: query('next'),
          metadata: {
            ...metadata(2),
            queryRevision: 1,
            totalItems: index,
            loading: index % 2 === 0,
          },
        });
        if (result.request !== null) metadataRequests += 1;
        metadataState = result.state;
      }
    }, 25);

    const metrics = {
      initialDecision: metric(() => {
        transition(createNeuTableRemoteCoordinatorState<Field>());
      }),
      sameQueryDecision: metric(() => {
        transition(current.state, { query: { ...query(), sort: [] }, metadata: metadata(1) });
      }),
      queryChangeRequest: metric(() => {
        transition(current.state, { query: query('changed'), metadata: metadata(1) });
      }),
      retryDecision: metric(() => {
        transition(current.state, { metadata: metadata(1), retryToken: 1 });
      }),
      metadataResponse: metric(() => {
        transition(current.state, { metadata: { ...metadata(1), totalItems: 101 } });
      }),
      metadataStorm1000: metadataStorm,
      semanticEquality: metric(() => {
        equal(query('same'), { ...query('same'), sort: [] });
      }),
      metadataStormRequests: metadataRequests,
      viewportRequests: 0,
    };

    expect(metadataRequests).toBe(0);
    const payload = `N2_TABLE_REMOTE_PERFORMANCE:${JSON.stringify(metrics)}\n`;
    const runtime = globalThis as typeof globalThis & {
      readonly process?: { readonly stdout?: { write(value: string): void } };
    };
    runtime.process?.stdout?.write(payload);
  }, 15_000);
});
