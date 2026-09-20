import {
  classifyNeuTableRemoteCorrelation,
  createNeuTableRemoteCoordinatorState,
  destroyNeuTableRemoteCoordinator,
  transitionNeuTableRemoteCoordinator,
  type NeuTableRemoteCoordinatorInput,
  type NeuTableRemoteCoordinatorState,
} from './internal/remote/neu-table-remote-coordinator';
import { areNeuTableQuerySlicesEqual } from './internal/query-ui/neu-table-query-transitions';
import type { NeuTableMetadata, NeuTableQuery } from './public/neu-table.types';

type Field = 'name' | 'score';

const query = (search = ''): NeuTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search,
  sort: [],
  filters: null,
});
const metadata = (queryRevision = 0, appliedRequestId: number | null = null): NeuTableMetadata => ({
  totalItems: null,
  loading: false,
  error: null,
  queryRevision,
  appliedRequestId,
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
const step = (
  state: NeuTableRemoteCoordinatorState<Field>,
  next: Partial<NeuTableRemoteCoordinatorInput<Field>> = {},
) => transitionNeuTableRemoteCoordinator(state, input(next), equal);

describe('NeuTable remote coordinator', () => {
  it('emits one initial request for an unsatisfied browser state', () => {
    const first = step(createNeuTableRemoteCoordinatorState());
    expect(first.request).toEqual({
      requestId: 1,
      queryRevision: 0,
      query: query(),
      reason: 'initial',
    });
    const stable = step(first.state, { metadata: metadata(0, 1) });
    expect(stable.request).toBeNull();
    expect(stable.state.nextRequestId).toBe(2);
  });

  it('suppresses initial when metadata already satisfies revision zero', () => {
    const result = step(createNeuTableRemoteCoordinatorState(), {
      metadata: metadata(0, 91),
    });
    expect(result.request).toBeNull();
    expect(result.state.nextRequestId).toBe(1);
  });

  it('does not emit or allocate IDs before browser activation', () => {
    const server = step(createNeuTableRemoteCoordinatorState(), {
      browserActive: false,
      query: query('server'),
    });
    expect(server.request).toBeNull();
    expect(server.state).toMatchObject({ queryRevision: 0, nextRequestId: 1 });

    const browser = step(server.state, { query: query('server') });
    expect(browser.request).toMatchObject({ requestId: 1, queryRevision: 0, reason: 'initial' });
  });

  it('increments revisions only for observed semantic query changes', () => {
    const initial = step(createNeuTableRemoteCoordinatorState());
    const sameReference = step(initial.state, { query: initial.state.query! });
    const sameValue = step(sameReference.state, { query: { ...query(), sort: [] } });
    const firstQuery = step(sameValue.state, { query: query('a') });
    const retry = step(firstQuery.state, { query: query('a'), retryToken: 1 });
    const secondQuery = step(retry.state, { query: query('b'), retryToken: 1 });

    expect(sameReference.request).toBeNull();
    expect(sameValue.request).toBeNull();
    expect(firstQuery.request).toMatchObject({ requestId: 2, queryRevision: 1, reason: 'query' });
    expect(retry.request).toMatchObject({ requestId: 3, queryRevision: 1, reason: 'retry' });
    expect(secondQuery.request).toMatchObject({ requestId: 4, queryRevision: 2, reason: 'query' });
  });

  it('keeps client mode silent and applies remote entry/re-entry satisfaction', () => {
    const client = step(createNeuTableRemoteCoordinatorState(), {
      dataMode: 'client',
      query: query(),
    });
    const changedClient = step(client.state, {
      dataMode: 'client',
      query: query('client'),
    });
    const satisfiedEntry = step(changedClient.state, {
      query: query('client'),
      metadata: metadata(1, 8),
    });
    const leave = step(satisfiedEntry.state, {
      dataMode: 'client',
      query: query('client'),
      metadata: metadata(1, 8),
    });
    const unsatisfiedReentry = step(leave.state, {
      query: query('client'),
      metadata: metadata(1, null),
    });

    expect(client.request).toBeNull();
    expect(changedClient.request).toBeNull();
    expect(changedClient.state.queryRevision).toBe(1);
    expect(satisfiedEntry.request).toBeNull();
    expect(leave.request).toBeNull();
    expect(unsatisfiedReentry.request).toMatchObject({
      requestId: 1,
      queryRevision: 1,
      reason: 'initial',
    });
  });

  it('classifies reconstructed metadata by revision and request only', () => {
    const initial = step(createNeuTableRemoteCoordinatorState());
    const changed = step(initial.state, { query: query('next') });
    const retried = step(changed.state, { query: query('next'), retryToken: 1 });

    expect(classifyNeuTableRemoteCorrelation(retried.state, metadata(0, 1))).toBe('stale-query');
    expect(classifyNeuTableRemoteCorrelation(retried.state, metadata(1, 2))).toBe('stale-request');
    expect(classifyNeuTableRemoteCorrelation(retried.state, metadata(1, 3))).toBe('current');
    expect(classifyNeuTableRemoteCorrelation(retried.state, metadata(1, null))).toBe('unresolved');
  });

  it('never requests for metadata-only updates and supports rapid observed transitions', () => {
    const initial = step(createNeuTableRemoteCoordinatorState());
    let state = initial.state;
    for (let index = 0; index < 1_000; index += 1) {
      const result = step(state, {
        metadata: {
          ...metadata(0, 1),
          totalItems: index,
          loading: index % 2 === 0,
          error: index % 3 === 0 ? new Error('remote') : null,
        },
      });
      expect(result.request).toBeNull();
      state = result.state;
    }
    const a = step(state, { query: query('a') });
    const b = step(a.state, { query: query('b') });
    const c = step(b.state, { query: query('c') });
    expect([a.request?.queryRevision, b.request?.queryRevision, c.request?.queryRevision]).toEqual([
      1, 2, 3,
    ]);
  });

  it('does not emit after destroy', () => {
    const initial = step(createNeuTableRemoteCoordinatorState());
    const destroyed = destroyNeuTableRemoteCoordinator(initial.state);
    const late = step(destroyed, { query: query('late'), retryToken: 1 });
    expect(late.request).toBeNull();
    expect(late.state).toBe(destroyed);
  });
});
