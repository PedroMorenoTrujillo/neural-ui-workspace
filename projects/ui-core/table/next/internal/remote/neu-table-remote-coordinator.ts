import type {
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableMetadata,
  NeuTableQuery,
} from '../../public/neu-table.types';

export type NeuTableRemoteCorrelation = 'current' | 'unresolved' | 'stale-query' | 'stale-request';

export interface NeuTableRemoteCoordinatorState<F extends string> {
  readonly browserActive: boolean;
  readonly dataMode: NeuTableDataMode;
  readonly destroyed: boolean;
  readonly latestRequestId: number | null;
  readonly nextRequestId: number;
  readonly query: NeuTableQuery<F> | null;
  readonly queryRevision: number;
  readonly retryToken: number;
}

export interface NeuTableRemoteCoordinatorInput<F extends string> {
  readonly browserActive: boolean;
  readonly dataMode: NeuTableDataMode;
  readonly metadata: NeuTableMetadata;
  readonly query: NeuTableQuery<F>;
  readonly retryToken: number;
}

export interface NeuTableRemoteCoordinatorTransition<F extends string> {
  readonly request: NeuTableDataRequest<F> | null;
  readonly state: NeuTableRemoteCoordinatorState<F>;
}

export type NeuTableQueryEquality<F extends string> = (
  left: NeuTableQuery<F>,
  right: NeuTableQuery<F>,
) => boolean;

export function createNeuTableRemoteCoordinatorState<
  F extends string,
>(): NeuTableRemoteCoordinatorState<F> {
  return {
    browserActive: false,
    dataMode: 'client',
    destroyed: false,
    latestRequestId: null,
    nextRequestId: 1,
    query: null,
    queryRevision: 0,
    retryToken: 0,
  };
}

function snapshotQuery<F extends string>(query: NeuTableQuery<F>): NeuTableQuery<F> {
  return {
    ...query,
    sort: query.sort.map((entry) => ({ ...entry })),
  };
}

function request<F extends string>(
  state: NeuTableRemoteCoordinatorState<F>,
  reason: 'initial' | 'query' | 'retry',
): NeuTableRemoteCoordinatorTransition<F> {
  const requestId = state.nextRequestId;
  return {
    state: {
      ...state,
      latestRequestId: requestId,
      nextRequestId: requestId + 1,
    },
    request: {
      requestId,
      queryRevision: state.queryRevision,
      query: snapshotQuery(state.query!),
      reason,
    },
  };
}

export function isNeuTableRemoteStateSatisfied(
  metadata: NeuTableMetadata,
  queryRevision: number,
): boolean {
  return metadata.queryRevision === queryRevision && metadata.appliedRequestId !== null;
}

export function classifyNeuTableRemoteCorrelation<F extends string>(
  state: NeuTableRemoteCoordinatorState<F>,
  metadata: NeuTableMetadata,
): NeuTableRemoteCorrelation {
  if (metadata.queryRevision !== state.queryRevision) return 'stale-query';
  if (metadata.appliedRequestId === null) return 'unresolved';
  if (state.latestRequestId !== null && metadata.appliedRequestId < state.latestRequestId) {
    return 'stale-request';
  }
  return 'current';
}

export function transitionNeuTableRemoteCoordinator<F extends string>(
  previous: NeuTableRemoteCoordinatorState<F>,
  input: NeuTableRemoteCoordinatorInput<F>,
  queriesEqual: NeuTableQueryEquality<F>,
): NeuTableRemoteCoordinatorTransition<F> {
  if (previous.destroyed) return { state: previous, request: null };

  if (!input.browserActive) {
    return {
      state: {
        ...previous,
        browserActive: false,
        dataMode: input.dataMode,
        latestRequestId: null,
        query: snapshotQuery(input.query),
        queryRevision: 0,
        retryToken: input.retryToken,
      },
      request: null,
    };
  }

  const activating = !previous.browserActive;
  const wasRemote = !activating && previous.dataMode === 'remote';
  const queryChanged = previous.query !== null && !queriesEqual(previous.query, input.query);
  const queryRevision = queryChanged ? previous.queryRevision + 1 : previous.queryRevision;
  const query =
    previous.query === null || queryChanged || previous.query !== input.query
      ? snapshotQuery(input.query)
      : previous.query;
  const base: NeuTableRemoteCoordinatorState<F> = {
    ...previous,
    browserActive: true,
    dataMode: input.dataMode,
    latestRequestId: queryChanged ? null : previous.latestRequestId,
    query,
    queryRevision,
    retryToken: input.retryToken,
  };

  if (input.dataMode === 'client') return { state: base, request: null };

  if (!wasRemote) {
    return isNeuTableRemoteStateSatisfied(input.metadata, queryRevision)
      ? { state: base, request: null }
      : request(base, 'initial');
  }

  if (queryChanged) return request(base, 'query');
  if (input.retryToken !== previous.retryToken) return request(base, 'retry');
  return { state: base, request: null };
}

export function destroyNeuTableRemoteCoordinator<F extends string>(
  state: NeuTableRemoteCoordinatorState<F>,
): NeuTableRemoteCoordinatorState<F> {
  return state.destroyed ? state : { ...state, destroyed: true };
}
