import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createNeuTreeTableRemoteState,
  destroyNeuTreeTableRemote,
  fingerprintNeuTreeTableQuery,
  reduceNeuTreeTableRemote,
  retryNeuTreeTableRemote,
  type TreeRemoteCoordinatorState,
  type TreeRemoteSnapshot,
} from './internal/remote/neu-tree-table-remote';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeLoadedRelation,
  NeuTreeRelation,
  NeuTreeTableDataRequest,
  NeuTreeTableHierarchy,
  NeuTreeTableQuery,
} from './public/neu-tree-table.types';

type Field = 'name';
interface Row {
  readonly id: string | number;
  readonly name: string;
}

const query = (overrides: Partial<NeuTreeTableQuery<Field>> = {}): NeuTreeTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
  ...overrides,
});

const unloaded = <K extends string | number>(
  relationRevision = 1,
): NeuTreeRelation<K> => ({
  status: 'unloaded',
  keys: [],
  relationRevision,
  appliedRequestId: null,
  total: null,
});

const loaded = <K extends string | number>(
  keys: readonly K[],
  options: {
    readonly relationRevision?: number;
    readonly appliedRequestId?: number | null;
    readonly completeness?: 'partial' | 'complete';
    readonly total?: number | null;
  } = {},
): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: options.relationRevision ?? 1,
  appliedRequestId: options.appliedRequestId ?? null,
  total: options.total ?? keys.length,
  completeness: options.completeness ?? 'complete',
});

const hierarchy = <K extends string | number>(options: {
  readonly queryRevision?: number;
  readonly hierarchyRevision?: number;
  readonly roots?: NeuTreeRelation<K>;
  readonly children?: NeuTreeTableHierarchy<K>['children'];
} = {}): NeuTreeTableHierarchy<K> => ({
  hierarchyRevision: options.hierarchyRevision ?? 1,
  queryRevision: options.queryRevision ?? 0,
  roots: options.roots ?? unloaded<K>(),
  children: options.children ?? [],
});

const snapshot = <K extends string | number>(
  overrides: Partial<TreeRemoteSnapshot<K, Field>> = {},
): TreeRemoteSnapshot<K, Field> => ({
  browser: true,
  mode: 'remote',
  hierarchy: hierarchy<K>(),
  query: query(),
  expandedKeys: [],
  knownKeys: [],
  ...overrides,
});

describe('remote query structural fingerprints', () => {
  const fingerprint = (value: unknown) => fingerprintNeuTreeTableQuery(query({
    filters: { kind: 'condition', field: 'name', rule: 'equals', value },
  }));

  it('distinguishes primitive and nonfinite values without JSON coercion', () => {
    expect(fingerprint(0)).not.toBe(fingerprint(-0));
    expect(fingerprint(Number.NaN)).not.toBe(fingerprint(null));
    expect(fingerprint(Infinity)).not.toBe(fingerprint(-Infinity));
    expect(fingerprint(2n)).not.toBe(fingerprint(2));
    expect(fingerprint(true)).not.toBe(fingerprint('true'));
    expect(fingerprint(undefined)).not.toBe(fingerprint(null));
    expect(fingerprint(Symbol())).toBe(fingerprint(Symbol()));
    expect(fingerprint(Symbol('a'))).not.toBe(fingerprint(Symbol('b')));
  });

  it('preserves object structure, dates and shared references deterministically', () => {
    expect(fingerprint(new Date('2026-01-01T00:00:00Z')))
      .not.toBe(fingerprint(new Date('invalid')));
    expect(fingerprint({ a: 1, b: [2, 3] })).toBe(fingerprint({ b: [2, 3], a: 1 }));
    const shared = { id: 1 };
    expect(fingerprint([shared, shared])).not.toBe(fingerprint([{ id: 1 }, { id: 1 }]));
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(fingerprint(circular)).toBe(fingerprint(circular));
    expect(fingerprint(function namedAction() {})).not.toBe(fingerprint(function otherAction() {}));
  });
});

function advance<K extends string | number>(
  state: TreeRemoteCoordinatorState,
  value: TreeRemoteSnapshot<K, Field>,
) {
  return reduceNeuTreeTableRemote(state, value);
}

describe('NeuTreeTable 2 remote coordinator', () => {
  it('emits one browser-only initial roots request and deduplicates the same footprint', () => {
    const first = advance(createNeuTreeTableRemoteState(), snapshot<string>());
    expect(first.requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'initial', requestId: 1 }),
    ]);
    const repeated = advance(first.state, snapshot<string>());
    expect(repeated.requests).toEqual([]);

    const server = advance(
      createNeuTreeTableRemoteState(),
      snapshot<string>({ browser: false }),
    );
    expect(server.requests).toEqual([]);
  });

  it('bypasses client mode and resets remote branch dedupe on a mode transition', () => {
    const first = advance(createNeuTreeTableRemoteState(), snapshot<string>());
    const client = advance(first.state, snapshot<string>({ mode: 'client' }));
    expect(client.requests).toEqual([]);
    const remote = advance(client.state, snapshot<string>());
    expect(remote.requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'initial', requestId: 2 }),
    ]);
  });

  it('treats current loaded, partial, loading and error roots as applied states', () => {
    for (const roots of [
      loaded<string>(['a']),
      loaded<string>(['a'], { completeness: 'partial', total: 1_000_000 }),
      { ...unloaded<string>(), status: 'loading' as const, appliedRequestId: 19 },
      { ...unloaded<string>(), status: 'error' as const, error: new Error('offline') },
    ]) {
      const result = advance(
        createNeuTreeTableRemoteState(),
        snapshot<string>({ hierarchy: hierarchy({ roots }) }),
      );
      expect(result.requests).toEqual([]);
    }
  });

  it('requests children only after applied expansion and deduplicates collapse/re-expand', () => {
    const applied = snapshot<string>({
      knownKeys: ['a'],
      hierarchy: hierarchy({ roots: loaded(['a']), children: [] }),
    });
    const collapsed = advance(createNeuTreeTableRemoteState(), applied);
    expect(collapsed.requests).toEqual([]);
    const expanded = advance(collapsed.state, { ...applied, expandedKeys: ['a'] });
    expect(expanded.requests).toEqual([
      expect.objectContaining({
        kind: 'children',
        reason: 'expand',
        parentKey: 'a',
        requestId: 1,
      }),
    ]);
    const collapsedPending = advance(expanded.state, applied);
    const reexpanded = advance(collapsedPending.state, { ...applied, expandedKeys: ['a'] });
    expect(reexpanded.requests).toEqual([]);
  });

  it('allows a new child request for a new relation or hierarchy revision', () => {
    const base = snapshot<string>({
      knownKeys: ['a'],
      expandedKeys: ['a'],
      hierarchy: hierarchy({ roots: loaded(['a']) }),
    });
    const first = advance(createNeuTreeTableRemoteState(), base);
    const relationChanged = advance(first.state, {
      ...base,
      hierarchy: hierarchy({
        hierarchyRevision: 2,
        roots: loaded(['a']),
        children: [{ parentKey: 'a', relation: unloaded(2) }],
      }),
    });
    expect(relationChanged.requests).toEqual([
      expect.objectContaining({ kind: 'children', requestId: 2, relationRevision: 2 }),
    ]);
  });

  it('emits root and expanded-child query requests only after applied query changes', () => {
    const base = snapshot<string>({
      knownKeys: ['a'],
      expandedKeys: ['a'],
      hierarchy: hierarchy({
        roots: loaded(['a']),
        children: [{ parentKey: 'a', relation: loaded([]) }],
      }),
    });
    const initial = advance(createNeuTreeTableRemoteState(), base);
    expect(initial.requests).toEqual([]);
    const rejected = advance(initial.state, base);
    expect(rejected.requests).toEqual([]);
    const accepted = advance(rejected.state, { ...base, query: query({ search: 'alpha' }) });
    expect(accepted.requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'query', queryRevision: 1 }),
      expect.objectContaining({
        kind: 'children',
        reason: 'query',
        parentKey: 'a',
        queryRevision: 1,
      }),
    ]);
  });

  it('distinguishes root page acceptance from other query changes', () => {
    const base = snapshot<string>({ hierarchy: hierarchy({ roots: loaded([]) }) });
    const initial = advance(createNeuTreeTableRemoteState(), base);
    const page = advance(initial.state, { ...base, query: query({ page: 1 }) });
    expect(page.requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'page', queryRevision: 1 }),
    ]);
  });

  it('accepts only the latest correlated applied response for a branch', () => {
    const base = snapshot<string>();
    const first = advance(createNeuTreeTableRemoteState(), base);
    const loading = advance(first.state, {
      ...base,
      hierarchy: hierarchy({
        roots: { ...unloaded<string>(), status: 'loading', appliedRequestId: 1 },
      }),
    });
    expect(loading.requests).toEqual([]);
    const current = advance(loading.state, {
      ...base,
      hierarchy: hierarchy({ roots: loaded([], { appliedRequestId: 1 }) }),
    });
    expect(current.requests).toEqual([]);

    const staleRevision = advance(current.state, {
      ...base,
      hierarchy: hierarchy({
        hierarchyRevision: 2,
        roots: loaded([], { relationRevision: 2, appliedRequestId: 0 }),
      }),
    });
    expect(staleRevision.requests).toEqual([
      expect.objectContaining({ kind: 'roots', requestId: 2, relationRevision: 2 }),
    ]);
  });

  it('uses explicit retry through the same channel with a new request id', () => {
    const applied = snapshot<string>({
      knownKeys: ['a'],
      hierarchy: hierarchy({
        roots: { ...unloaded<string>(), status: 'error', error: 'roots' },
        children: [
          {
            parentKey: 'a',
            relation: { ...unloaded<string>(), status: 'error', error: 'children' },
          },
        ],
      }),
    });
    const idle = advance(createNeuTreeTableRemoteState(), applied);
    const rootRetry = retryNeuTreeTableRemote(idle.state, applied, { kind: 'roots' });
    const childRetry = retryNeuTreeTableRemote(rootRetry.state, applied, {
      kind: 'children',
      parentKey: 'a',
    });
    expect(rootRetry.requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'retry', requestId: 1 }),
    ]);
    expect(childRetry.requests).toEqual([
      expect.objectContaining({
        kind: 'children',
        reason: 'retry',
        parentKey: 'a',
        requestId: 2,
      }),
    ]);
  });

  it('supports concurrent exact-K child branches without coercion', () => {
    const applied = snapshot<string | number>({
      knownKeys: ['1', 1],
      expandedKeys: ['1', 1],
      hierarchy: hierarchy({ roots: loaded(['1', 1]) }),
    });
    const result = advance(createNeuTreeTableRemoteState(), applied);
    expect(result.requests).toEqual([
      expect.objectContaining({ kind: 'children', parentKey: '1', requestId: 1 }),
      expect.objectContaining({ kind: 'children', parentKey: 1, requestId: 2 }),
    ]);
  });

  it('prunes removed parent correlation and never allocates from large totals', () => {
    const base = snapshot<string>({
      knownKeys: ['a'],
      expandedKeys: ['a'],
      hierarchy: hierarchy({
        roots: loaded(['a'], { completeness: 'partial', total: 1_000_000 }),
      }),
    });
    const first = advance(createNeuTreeTableRemoteState(), base);
    expect(first.state.requestsByBranch.size).toBe(1);
    const removed = advance(first.state, {
      ...base,
      knownKeys: [],
      expandedKeys: [],
      hierarchy: hierarchy({ roots: loaded([], { total: 1_000_000 }) }),
    });
    expect(removed.state.requestsByBranch.size).toBe(0);
  });

  it('is immutable, instance-local and inert after destroy', () => {
    const frozen = Object.freeze(snapshot<string>());
    const first = advance(createNeuTreeTableRemoteState(), frozen);
    const second = advance(createNeuTreeTableRemoteState(), frozen);
    expect(first.requests[0]?.requestId).toBe(1);
    expect(second.requests[0]?.requestId).toBe(1);
    expect(Object.isFrozen(frozen)).toBe(true);
    const destroyed = destroyNeuTreeTableRemote(first.state);
    expect(advance(destroyed, frozen).requests).toEqual([]);
    expect(retryNeuTreeTableRemote(destroyed, frozen, { kind: 'roots' }).requests).toEqual([]);
  });
});

describe('NeuTreeTable 2 remote facade', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuTreeTableComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('emits exactly once from the request effect and waits for accepted expansion', async () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent<Row, string, Field>);
    fixture.componentRef.setInput('dataMode', 'remote');
    fixture.componentRef.setInput('rowKey', (row: Row) => row.id as string);
    fixture.componentRef.setInput('data', [{ id: 'a', name: 'Alpha' }]);
    fixture.componentRef.setInput('columns', [{ id: 'name', header: 'Name', field: 'name' }]);
    fixture.componentRef.setInput('hierarchyOptions', { treeColumnId: 'name', indentSize: 16 });
    fixture.componentRef.setInput('hierarchy', hierarchy({ roots: loaded(['a']) }));
    const requests: NeuTreeTableDataRequest<string, Field>[] = [];
    const expansionProposals: string[][] = [];
    fixture.componentInstance.dataRequest.subscribe((request) => requests.push(request));
    fixture.componentInstance.expandedKeysChange.subscribe((change) =>
      expansionProposals.push([...change.next]),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toEqual([]);

    const expander = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button.neu-tree-table2__expander',
    );
    expander?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(expansionProposals).toEqual([['a']]);
    expect(requests).toEqual([]);

    fixture.componentRef.setInput('expandedKeys', ['a']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toEqual([
      expect.objectContaining({ kind: 'children', reason: 'expand', parentKey: 'a' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toHaveLength(1);

    fixture.destroy();
    fixture.componentInstance.retryData({ kind: 'children', parentKey: 'a' });
    expect(requests).toHaveLength(1);
  });

  it('waits for an applied query and exposes explicit root retry on the same output', async () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent<Row, string, Field>);
    fixture.componentRef.setInput('dataMode', 'remote');
    fixture.componentRef.setInput('rowKey', (row: Row) => row.id as string);
    fixture.componentRef.setInput('data', [{ id: 'a', name: 'Alpha' }]);
    fixture.componentRef.setInput('columns', [
      { id: 'name', header: 'Name', field: 'name', sort: { field: 'name' } },
    ]);
    fixture.componentRef.setInput('hierarchyOptions', { treeColumnId: 'name', indentSize: 16 });
    fixture.componentRef.setInput('hierarchy', hierarchy({ roots: loaded(['a']) }));
    const requests: NeuTreeTableDataRequest<string, Field>[] = [];
    const proposals: NeuTreeTableQuery<Field>[] = [];
    fixture.componentInstance.dataRequest.subscribe((request) => requests.push(request));
    fixture.componentInstance.queryChange.subscribe((next) => proposals.push(next));
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[data-sort-column="name"]')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(proposals).toHaveLength(1);
    expect(requests).toEqual([]);

    fixture.componentRef.setInput('query', proposals[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'query', requestId: 1 }),
    ]);

    requests.length = 0;
    fixture.componentRef.setInput(
      'hierarchy',
      hierarchy({
        queryRevision: 1,
        roots: { ...unloaded<string>(2), status: 'error', error: 'offline' },
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(requests).toEqual([]);
    fixture.componentInstance.retryData({ kind: 'roots' });
    expect(requests).toEqual([
      expect.objectContaining({ kind: 'roots', reason: 'retry', requestId: 2 }),
    ]);
    fixture.destroy();
  });
});
