import type {
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableRange,
} from '../../public/neu-table.types';
import {
  areNeuTableRangesEqual,
  doesNeuTableRangeCover,
  normalizeNeuTableRange,
} from '../virtualization/neu-table-virtualization';

export type NeuTableRemoteCorrelation =
  'current' | 'unresolved' | 'stale-query' | 'stale-request' | 'stale-range';

export interface NeuTableRemoteCoordinatorState<F extends string> {
  readonly browserActive: boolean;
  readonly dataMode: NeuTableDataMode;
  readonly destroyed: boolean;
  readonly latestRequestId: number | null;
  readonly latestRequestRange: NeuTableRange | null;
  readonly nextRequestId: number;
  readonly pendingRange: NeuTableRange | null;
  readonly query: NeuTableQuery<F> | null;
  readonly queryRevision: number;
  readonly remoteSessionHandled: boolean;
  readonly requiredRange: NeuTableRange | null;
  readonly retryToken: number;
  readonly suppressedRange: NeuTableRange | null;
}

export interface NeuTableRemoteCoordinatorInput<F extends string> {
  readonly browserActive: boolean;
  readonly dataMode: NeuTableDataMode;
  readonly metadata: NeuTableMetadata;
  readonly query: NeuTableQuery<F>;
  readonly requiredRange?: NeuTableRange | null;
  readonly retryToken: number;
  readonly virtualizationEnabled?: boolean;
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
    latestRequestRange: null,
    nextRequestId: 1,
    pendingRange: null,
    query: null,
    queryRevision: 0,
    remoteSessionHandled: false,
    requiredRange: null,
    retryToken: 0,
    suppressedRange: null,
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
  reason: 'initial' | 'query' | 'viewport' | 'retry',
  range: NeuTableRange | null,
): NeuTableRemoteCoordinatorTransition<F> {
  if (range !== null && range.start === range.end) {
    return { state: { ...state, remoteSessionHandled: true }, request: null };
  }
  const requestId = state.nextRequestId;
  return {
    state: {
      ...state,
      latestRequestId: requestId,
      latestRequestRange: range,
      nextRequestId: requestId + 1,
      pendingRange: range,
      remoteSessionHandled: true,
      suppressedRange: null,
    },
    request: {
      requestId,
      queryRevision: state.queryRevision,
      query: snapshotQuery(state.query!),
      reason,
      ...(range === null ? {} : { range }),
    },
  };
}

export function isNeuTableRemoteStateSatisfied(
  metadata: NeuTableMetadata,
  queryRevision: number,
  requiredRange: NeuTableRange | null = null,
  latestRequestId: number | null = null,
): boolean {
  if (
    requiredRange !== null &&
    requiredRange.start === requiredRange.end &&
    metadata.queryRevision === queryRevision
  ) {
    return true;
  }
  return (
    metadata.queryRevision === queryRevision &&
    metadata.appliedRequestId !== null &&
    (latestRequestId === null || metadata.appliedRequestId >= latestRequestId) &&
    doesNeuTableRangeCover(metadata.dataRange, requiredRange)
  );
}

export function classifyNeuTableRemoteCorrelation<F extends string>(
  state: NeuTableRemoteCoordinatorState<F>,
  metadata: NeuTableMetadata,
  requiredRange: NeuTableRange | null = null,
): NeuTableRemoteCorrelation {
  if (metadata.queryRevision !== state.queryRevision) return 'stale-query';
  if (metadata.appliedRequestId === null) return 'unresolved';
  if (state.latestRequestId !== null && metadata.appliedRequestId < state.latestRequestId) {
    return 'stale-request';
  }
  if (!doesNeuTableRangeCover(metadata.dataRange, requiredRange)) return 'stale-range';
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
        latestRequestRange: null,
        pendingRange: null,
        query: snapshotQuery(input.query),
        queryRevision: 0,
        remoteSessionHandled: false,
        requiredRange:
          input.virtualizationEnabled === true && input.requiredRange != null
            ? normalizeNeuTableRange(input.requiredRange)
            : null,
        retryToken: input.retryToken,
        suppressedRange: null,
      },
      request: null,
    };
  }

  const activating = !previous.browserActive;
  const wasRemote = !activating && previous.dataMode === 'remote';
  const enteringRemote = input.dataMode === 'remote' && !wasRemote;
  const queryChanged = previous.query !== null && !queriesEqual(previous.query, input.query);
  const queryRevision = queryChanged ? previous.queryRevision + 1 : previous.queryRevision;
  const requiredRange =
    input.virtualizationEnabled === true && input.requiredRange != null
      ? normalizeNeuTableRange(input.requiredRange)
      : null;
  const query =
    previous.query === null || queryChanged || previous.query !== input.query
      ? snapshotQuery(input.query)
      : previous.query;
  const base: NeuTableRemoteCoordinatorState<F> = {
    ...previous,
    browserActive: true,
    dataMode: input.dataMode,
    latestRequestId: queryChanged ? null : previous.latestRequestId,
    latestRequestRange: queryChanged ? null : previous.latestRequestRange,
    pendingRange: queryChanged || enteringRemote ? null : previous.pendingRange,
    query,
    queryRevision,
    remoteSessionHandled: queryChanged || enteringRemote ? false : previous.remoteSessionHandled,
    requiredRange,
    retryToken: input.retryToken,
    suppressedRange: queryChanged || enteringRemote ? null : previous.suppressedRange,
  };

  if (input.dataMode === 'client') {
    return {
      state: {
        ...base,
        pendingRange: null,
        remoteSessionHandled: false,
        suppressedRange: null,
      },
      request: null,
    };
  }

  const metadataCurrent =
    input.metadata.queryRevision === queryRevision &&
    input.metadata.appliedRequestId !== null &&
    (base.latestRequestId === null || input.metadata.appliedRequestId >= base.latestRequestId);
  const satisfied = isNeuTableRemoteStateSatisfied(
    input.metadata,
    queryRevision,
    requiredRange,
    base.latestRequestId,
  );
  let coordinated = base;
  if (satisfied) {
    coordinated = { ...coordinated, pendingRange: null, suppressedRange: null };
  } else if (
    metadataCurrent &&
    input.metadata.error !== null &&
    coordinated.latestRequestRange !== null
  ) {
    coordinated = {
      ...coordinated,
      pendingRange: null,
      suppressedRange: coordinated.latestRequestRange,
    };
  }

  if (queryChanged && wasRemote) {
    return request(coordinated, 'query', requiredRange);
  }

  if (!coordinated.remoteSessionHandled) {
    if (input.virtualizationEnabled === true && requiredRange === null) {
      return { state: coordinated, request: null };
    }
    return satisfied
      ? { state: { ...coordinated, remoteSessionHandled: true }, request: null }
      : request(coordinated, 'initial', requiredRange);
  }

  if (input.retryToken !== previous.retryToken) {
    return request(coordinated, 'retry', requiredRange);
  }

  if (
    input.virtualizationEnabled === true &&
    requiredRange !== null &&
    !satisfied &&
    !doesNeuTableRangeCover(coordinated.pendingRange ?? undefined, requiredRange) &&
    !doesNeuTableRangeCover(coordinated.suppressedRange ?? undefined, requiredRange)
  ) {
    return request(coordinated, 'viewport', requiredRange);
  }

  if (
    coordinated.suppressedRange !== null &&
    !areNeuTableRangesEqual(coordinated.suppressedRange, requiredRange)
  ) {
    coordinated = { ...coordinated, suppressedRange: null };
  }
  return { state: coordinated, request: null };
}

export function destroyNeuTableRemoteCoordinator<F extends string>(
  state: NeuTableRemoteCoordinatorState<F>,
): NeuTableRemoteCoordinatorState<F> {
  return state.destroyed ? state : { ...state, destroyed: true };
}
