import { neuExactKeyToken } from '../shared/neu-exact-key';
import type {
  NeuTreeRelation,
  NeuTreeTableDataMode,
  NeuTreeTableDataRequest,
  NeuTreeTableHierarchy,
  NeuTreeTableKey,
  NeuTreeTableQuery,
  NeuTreeTableRetryTarget,
} from '../../public/neu-tree-table.types';
import { normalizeNeuTreeSearch } from '../query/neu-tree-table-query';

interface TreeRemoteBranchRequest {
  readonly requestId: number;
  readonly footprint: string;
}

export interface TreeRemoteCoordinatorState {
  readonly nextRequestId: number;
  readonly queryFingerprint: string | null;
  readonly queryCoreFingerprint: string | null;
  readonly queryPageFingerprint: string | null;
  readonly queryRevision: number;
  readonly remoteActive: boolean;
  readonly requestsByBranch: ReadonlyMap<string, TreeRemoteBranchRequest>;
  readonly retryGenerationByBranch: ReadonlyMap<string, number>;
  readonly destroyed: boolean;
}

export interface TreeRemoteSnapshot<
  K extends NeuTreeTableKey,
  F extends string,
> {
  readonly browser: boolean;
  readonly mode: NeuTreeTableDataMode;
  readonly hierarchy: NeuTreeTableHierarchy<K>;
  readonly query: NeuTreeTableQuery<F>;
  readonly expandedKeys: readonly K[];
  readonly knownKeys: readonly K[];
}

export interface TreeRemoteTransition<K extends NeuTreeTableKey, F extends string> {
  readonly state: TreeRemoteCoordinatorState;
  readonly requests: readonly NeuTreeTableDataRequest<K, F>[];
}

interface ObservedQuery {
  readonly fingerprint: string;
  readonly coreFingerprint: string;
  readonly pageFingerprint: string;
  readonly revision: number;
  readonly change: 'initial' | 'page' | 'query' | 'none';
}

const ROOT_BRANCH = 'roots';

function structuralFingerprint(value: unknown): string {
  const seen = new Map<object, number>();
  const visit = (candidate: unknown): string => {
    if (candidate === null) return 'null';
    switch (typeof candidate) {
      case 'undefined':
        return 'undefined';
      case 'boolean':
        return `boolean:${candidate}`;
      case 'number':
        if (Number.isNaN(candidate)) return 'number:NaN';
        if (candidate === Infinity) return 'number:Infinity';
        if (candidate === -Infinity) return 'number:-Infinity';
        if (Object.is(candidate, -0)) return 'number:-0';
        return `number:${candidate}`;
      case 'bigint':
        return `bigint:${candidate}`;
      case 'string':
        return `string:${candidate.length}:${candidate}`;
      case 'symbol':
        return `symbol:${String(candidate.description ?? '')}`;
      case 'function':
        return `function:${candidate.name}`;
      case 'object': {
        const object = candidate;
        const reference = seen.get(object);
        if (reference !== undefined) return `reference:${reference}`;
        seen.set(object, seen.size);
        if (object instanceof Date) {
          const time = object.getTime();
          return `date:${Number.isNaN(time) ? 'invalid' : object.toISOString()}`;
        }
        if (Array.isArray(object)) return `array:[${object.map(visit).join(',')}]`;
        const tag = Object.prototype.toString.call(object);
        const entries = Object.keys(object as Record<string, unknown>)
          .sort()
          .map(
            (key) =>
              `${structuralFingerprint(key)}=${visit((object as Record<string, unknown>)[key])}`,
          );
        return `${tag}:{${entries.join(',')}}`;
      }
    }
    return 'unknown';
  };
  return visit(value);
}

export function fingerprintNeuTreeTableQuery<F extends string>(
  query: NeuTreeTableQuery<F>,
): string {
  return structuralFingerprint(query);
}

function observeQuery<K extends NeuTreeTableKey, F extends string>(
  state: TreeRemoteCoordinatorState,
  snapshot: TreeRemoteSnapshot<K, F>,
): ObservedQuery {
  const coreFingerprint = structuralFingerprint({
    search: normalizeNeuTreeSearch(snapshot.query.search),
    sort: snapshot.query.sort,
    filters: snapshot.query.filters,
  });
  const pageFingerprint = structuralFingerprint({
    page: snapshot.query.page,
    pageSize: snapshot.query.pageSize,
  });
  const fingerprint = `${coreFingerprint}|${pageFingerprint}`;
  if (state.queryFingerprint === null) {
    return {
      fingerprint,
      coreFingerprint,
      pageFingerprint,
      revision: snapshot.hierarchy.queryRevision,
      change: 'initial',
    };
  }
  if (state.queryFingerprint === fingerprint) {
    return {
      fingerprint,
      coreFingerprint,
      pageFingerprint,
      revision: state.queryRevision,
      change: 'none',
    };
  }
  return {
    fingerprint,
    coreFingerprint,
    pageFingerprint,
    revision: Math.max(state.queryRevision + 1, snapshot.hierarchy.queryRevision),
    change:
      state.queryCoreFingerprint === coreFingerprint &&
      state.queryPageFingerprint !== pageFingerprint
        ? 'page'
        : 'query',
  };
}

function branchToken<K extends NeuTreeTableKey>(parentKey: K): string {
  return `children:${neuExactKeyToken(parentKey)}`;
}

function relationForParent<K extends NeuTreeTableKey>(
  hierarchy: NeuTreeTableHierarchy<K>,
  parentKey: K,
): NeuTreeRelation<K> {
  const token = neuExactKeyToken(parentKey);
  return (
    hierarchy.children.find((entry) => neuExactKeyToken(entry.parentKey) === token)?.relation ?? {
      status: 'unloaded',
      keys: [],
      relationRevision: 0,
      appliedRequestId: null,
      total: null,
    }
  );
}

function relationNeedsRequest<K extends NeuTreeTableKey>(options: {
  readonly relation: NeuTreeRelation<K>;
  readonly hierarchyQueryRevision: number;
  readonly queryRevision: number;
  readonly previous: TreeRemoteBranchRequest | undefined;
}): boolean {
  const { relation, hierarchyQueryRevision, queryRevision, previous } = options;
  if (hierarchyQueryRevision !== queryRevision) return true;
  if (relation.status === 'unloaded') return true;
  if (relation.status === 'loading' || relation.status === 'error') return false;
  if (!previous) return false;
  return relation.appliedRequestId !== previous.requestId;
}

function requestFootprint(options: {
  readonly branch: string;
  readonly queryRevision: number;
  readonly hierarchyRevision: number;
  readonly relationRevision: number;
  readonly retryGeneration: number;
}): string {
  return [
    options.branch,
    options.queryRevision,
    options.hierarchyRevision,
    options.relationRevision,
    options.retryGeneration,
  ].join('|');
}

function pruneMap<V>(source: ReadonlyMap<string, V>, live: ReadonlySet<string>): Map<string, V> {
  const next = new Map<string, V>();
  for (const [key, value] of source) if (live.has(key)) next.set(key, value);
  return next;
}

export function createNeuTreeTableRemoteState(): TreeRemoteCoordinatorState {
  return {
    nextRequestId: 1,
    queryFingerprint: null,
    queryCoreFingerprint: null,
    queryPageFingerprint: null,
    queryRevision: 0,
    remoteActive: false,
    requestsByBranch: new Map(),
    retryGenerationByBranch: new Map(),
    destroyed: false,
  };
}

export function reduceNeuTreeTableRemote<
  K extends NeuTreeTableKey,
  F extends string,
>(
  state: TreeRemoteCoordinatorState,
  snapshot: TreeRemoteSnapshot<K, F>,
): TreeRemoteTransition<K, F> {
  if (state.destroyed) return { state, requests: [] };
  const observed = observeQuery(state, snapshot);
  const baseState: TreeRemoteCoordinatorState = {
    ...state,
    queryFingerprint: observed.fingerprint,
    queryCoreFingerprint: observed.coreFingerprint,
    queryPageFingerprint: observed.pageFingerprint,
    queryRevision: observed.revision,
  };
  if (!snapshot.browser || snapshot.mode !== 'remote') {
    return {
      state: {
        ...baseState,
        remoteActive: false,
        requestsByBranch: new Map(),
        retryGenerationByBranch: new Map(),
      },
      requests: [],
    };
  }

  const live = new Set<string>([ROOT_BRANCH]);
  for (const key of snapshot.knownKeys) live.add(branchToken(key));
  const requestsByBranch = pruneMap(baseState.requestsByBranch, live);
  const retryGenerationByBranch = pruneMap(baseState.retryGenerationByBranch, live);
  const requests: NeuTreeTableDataRequest<K, F>[] = [];
  let nextRequestId = baseState.nextRequestId;
  const queryReason = observed.change === 'page' ? 'page' : 'query';

  const enqueueRoots = (): void => {
    const relation = snapshot.hierarchy.roots;
    const previous = requestsByBranch.get(ROOT_BRANCH);
    if (
      !relationNeedsRequest({
        relation,
        hierarchyQueryRevision: snapshot.hierarchy.queryRevision,
        queryRevision: observed.revision,
        previous,
      })
    ) {
      return;
    }
    const retryGeneration = retryGenerationByBranch.get(ROOT_BRANCH) ?? 0;
    const footprint = requestFootprint({
      branch: ROOT_BRANCH,
      queryRevision: observed.revision,
      hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
      relationRevision: relation.relationRevision,
      retryGeneration,
    });
    if (previous?.footprint === footprint) return;
    const requestId = nextRequestId++;
    requestsByBranch.set(ROOT_BRANCH, { requestId, footprint });
    requests.push({
      kind: 'roots',
      reason:
        observed.change === 'page' || observed.change === 'query'
          ? queryReason
          : 'initial',
      requestId,
      queryRevision: observed.revision,
      hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
      relationRevision: relation.relationRevision,
      query: snapshot.query,
    });
  };

  enqueueRoots();

  const known = new Set(snapshot.knownKeys.map(neuExactKeyToken));
  const expanded = new Map<string, K>();
  for (const key of snapshot.expandedKeys) {
    const token = neuExactKeyToken(key);
    if (known.has(token) && !expanded.has(token)) expanded.set(token, key);
  }
  for (const parentKey of expanded.values()) {
    const branch = branchToken(parentKey);
    const relation = relationForParent(snapshot.hierarchy, parentKey);
    const previous = requestsByBranch.get(branch);
    if (
      !relationNeedsRequest({
        relation,
        hierarchyQueryRevision: snapshot.hierarchy.queryRevision,
        queryRevision: observed.revision,
        previous,
      })
    ) {
      continue;
    }
    const retryGeneration = retryGenerationByBranch.get(branch) ?? 0;
    const footprint = requestFootprint({
      branch,
      queryRevision: observed.revision,
      hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
      relationRevision: relation.relationRevision,
      retryGeneration,
    });
    if (previous?.footprint === footprint) continue;
    const requestId = nextRequestId++;
    requestsByBranch.set(branch, { requestId, footprint });
    requests.push({
      kind: 'children',
      reason: observed.change === 'query' || observed.change === 'page' ? 'query' : 'expand',
      parentKey,
      requestId,
      queryRevision: observed.revision,
      hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
      relationRevision: relation.relationRevision,
      query: snapshot.query,
    });
  }

  return {
    state: {
      ...baseState,
      nextRequestId,
      remoteActive: true,
      requestsByBranch,
      retryGenerationByBranch,
    },
    requests,
  };
}

export function retryNeuTreeTableRemote<
  K extends NeuTreeTableKey,
  F extends string,
>(
  state: TreeRemoteCoordinatorState,
  snapshot: TreeRemoteSnapshot<K, F>,
  target: NeuTreeTableRetryTarget<K>,
): TreeRemoteTransition<K, F> {
  if (state.destroyed || !snapshot.browser || snapshot.mode !== 'remote') {
    return { state, requests: [] };
  }
  const observed = observeQuery(state, snapshot);
  const branch = target.kind === 'roots' ? ROOT_BRANCH : branchToken(target.parentKey);
  if (
    target.kind === 'children' &&
    !snapshot.knownKeys.some((key) => neuExactKeyToken(key) === neuExactKeyToken(target.parentKey))
  ) {
    return { state, requests: [] };
  }
  const relation =
    target.kind === 'roots'
      ? snapshot.hierarchy.roots
      : relationForParent(snapshot.hierarchy, target.parentKey);
  const retryGenerationByBranch = new Map(state.retryGenerationByBranch);
  const retryGeneration = (retryGenerationByBranch.get(branch) ?? 0) + 1;
  retryGenerationByBranch.set(branch, retryGeneration);
  const requestId = state.nextRequestId;
  const footprint = requestFootprint({
    branch,
    queryRevision: observed.revision,
    hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
    relationRevision: relation.relationRevision,
    retryGeneration,
  });
  const requestsByBranch = new Map(state.requestsByBranch);
  requestsByBranch.set(branch, { requestId, footprint });
  const request =
    target.kind === 'roots'
      ? ({
          kind: 'roots',
          reason: 'retry',
          requestId,
          queryRevision: observed.revision,
          hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
          relationRevision: relation.relationRevision,
          query: snapshot.query,
        } satisfies NeuTreeTableDataRequest<K, F>)
      : ({
          kind: 'children',
          reason: 'retry',
          parentKey: target.parentKey,
          requestId,
          queryRevision: observed.revision,
          hierarchyRevision: snapshot.hierarchy.hierarchyRevision,
          relationRevision: relation.relationRevision,
          query: snapshot.query,
        } satisfies NeuTreeTableDataRequest<K, F>);
  return {
    state: {
      ...state,
      nextRequestId: requestId + 1,
      queryFingerprint: observed.fingerprint,
      queryCoreFingerprint: observed.coreFingerprint,
      queryPageFingerprint: observed.pageFingerprint,
      queryRevision: observed.revision,
      remoteActive: true,
      requestsByBranch,
      retryGenerationByBranch,
    },
    requests: [request],
  };
}

export function destroyNeuTreeTableRemote(
  state: TreeRemoteCoordinatorState,
): TreeRemoteCoordinatorState {
  return {
    ...state,
    remoteActive: false,
    requestsByBranch: new Map(),
    retryGenerationByBranch: new Map(),
    destroyed: true,
  };
}
