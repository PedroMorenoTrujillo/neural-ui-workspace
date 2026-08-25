import { describe, expect, it, vi } from 'vitest';
import { NeuTableFilterScheduler } from './neu-table-filter-scheduler';
import { NeuTableLazyDataController } from './neu-table-lazy-data.controller';
import {
  NeuTableReferenceIdentity,
  neuTableDeepSelectionToken,
  resolveNeuTablePath,
} from './neu-table-value-resolver';
import { NeuTableVirtualRetentionController } from './neu-table-virtual-retention.controller';
import { NeuTableViewportController } from './neu-table-viewport.controller';

describe('NeuTable final parity focused controllers', () => {
  it('resolves nested paths without losing falsy values', () => {
    const row = { account: { id: 0, active: false, label: '' } };
    expect(resolveNeuTablePath(row, 'account.id')).toBe(0);
    expect(resolveNeuTablePath(row, 'account.active')).toBe(false);
    expect(resolveNeuTablePath(row, 'account.label')).toBe('');
    expect(resolveNeuTablePath(row, 'account.missing.value')).toBeUndefined();
  });

  it('creates stable reference keys and deterministic deep keys', () => {
    const references = new NeuTableReferenceIdentity<object>();
    const first = { value: Number.NaN, nested: { b: 2, a: 1 } };
    const sameShape = { nested: { a: 1, b: 2 }, value: Number.NaN };
    expect(references.key(first)).toBe(references.key(first));
    expect(references.key(first)).not.toBe(references.key(sameShape));
    expect(neuTableDeepSelectionToken(first)).toBe(neuTableDeepSelectionToken(sameShape));
    expect(neuTableDeepSelectionToken({ value: -0 })).not.toBe(
      neuTableDeepSelectionToken({ value: 0 }),
    );
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(neuTableDeepSelectionToken(cyclic)).toContain('ref:0');
  });

  it('tokens every supported JavaScript value deterministically', () => {
    expect(resolveNeuTablePath({ value: 1 }, '')).toEqual({ value: 1 });
    expect(resolveNeuTablePath({ nested: null }, 'nested.value')).toBeUndefined();
    expect(neuTableDeepSelectionToken(null)).toBe('null');
    expect(neuTableDeepSelectionToken(undefined)).toBe('undefined');
    expect(neuTableDeepSelectionToken(4)).toBe('number:4');
    expect(neuTableDeepSelectionToken('four')).toBe('string:"four"');
    expect(neuTableDeepSelectionToken(true)).toBe('boolean:true');
    expect(neuTableDeepSelectionToken(4n)).toBe('bigint:4');
    expect(neuTableDeepSelectionToken(Symbol('four'))).toBe('symbol:four');
    expect(neuTableDeepSelectionToken(Symbol())).toBe('symbol:');
    expect(neuTableDeepSelectionToken(function named() {})).toBe('function:named');
    expect(neuTableDeepSelectionToken(new Date('2026-08-25T00:00:00.000Z'))).toBe(
      'date:2026-08-25T00:00:00.000Z',
    );
    expect(neuTableDeepSelectionToken([1, 'two'])).toBe(
      'array:[number:1,string:"two"]',
    );
  });

  it('coalesces delayed search and column drafts and cancels cleanly', () => {
    vi.useFakeTimers();
    const applied: unknown[] = [];
    const scheduler = new NeuTableFilterScheduler<unknown>((pending) => applied.push(pending));
    scheduler.search('a', 20);
    scheduler.search('latest', 20);
    scheduler.column('name', 'Ada', 20);
    scheduler.column('age', 42, 20);
    vi.advanceTimersByTime(19);
    expect(applied).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({ searchSet: true, search: 'latest' });
    expect([...(applied[0] as { columns: Map<string, unknown> }).columns]).toEqual([
      ['name', 'Ada'],
      ['age', 42],
    ]);
    scheduler.search('discarded', 20);
    scheduler.discardSearch();
    scheduler.column('name', 'kept', 20);
    vi.advanceTimersByTime(20);
    expect(applied).toHaveLength(2);
    scheduler.column('name', 'cancelled', 20);
    scheduler.cancel();
    vi.runAllTimers();
    expect(applied).toHaveLength(2);
    vi.useRealTimers();
  });

  it('normalizes immediate filter delays and skips fully discarded drafts', () => {
    vi.useFakeTimers();
    const apply = vi.fn();
    const scheduler = new NeuTableFilterScheduler<string>(apply);
    scheduler.search('now', Number.NaN);
    expect(apply).toHaveBeenCalledOnce();
    scheduler.column('name', 'discard', 10);
    scheduler.discardColumns();
    vi.advanceTimersByTime(10);
    expect(apply).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('separates request step from render tolerance and clamps totals', () => {
    const lazy = new NeuTableLazyDataController<object>();
    const render = { first: 44, end: 62, visibleFirst: 50, visibleEnd: 56 };
    expect(lazy.requestRange(render, 1_000, undefined)).toBe(render);
    expect(lazy.requestRange(render, 1_000, 20)).toEqual({
      first: 40,
      end: 60,
      visibleFirst: 50,
      visibleEnd: 56,
    });
    expect(lazy.requestRange(render, 53, 20)).toEqual({
      first: 40,
      end: 53,
      visibleFirst: 50,
      visibleEnd: 56,
    });
  });

  it('retains disjoint visited intervals without allocating skipped rows', () => {
    const retention = new NeuTableVirtualRetentionController<{ id: number }>();
    expect(
      retention.include({ first: 0, end: 3, visibleFirst: 0, visibleEnd: 2 }, 10_000, 0, [
        { id: 0 },
        { id: 1 },
        { id: 2 },
      ]),
    ).toBe(true);
    retention.include(
      { first: 5_000, end: 5_003, visibleFirst: 5_000, visibleEnd: 5_002 },
      10_000,
      5_000,
      [{ id: 5_000 }],
    );
    expect(retention.intervals()).toEqual([
      { first: 0, end: 3 },
      { first: 5_000, end: 5_003 },
    ]);
    expect(retention.row(0)).toEqual({ id: 0 });
    expect(retention.row(5_000)).toEqual({ id: 5_000 });
    retention.include({ first: 2, end: 5, visibleFirst: 2, visibleEnd: 4 }, 4, undefined, []);
    expect(retention.intervals()).toEqual([{ first: 0, end: 4 }]);
    expect(retention.row(5_000)).toBeUndefined();
    expect(retention.reset()).toBe(true);
    expect(retention.reset()).toBe(false);
  });

  it('coalesces fallback viewport resize work and removes its listener', () => {
    vi.useFakeTimers();
    const listeners: { resize?: () => void } = {};
    const view = {
      addEventListener: (_name: string, listener: () => void) => (listeners.resize = listener),
      removeEventListener: () => delete listeners.resize,
    } as unknown as Window;
    const controller = new NeuTableViewportController();
    const measure = vi.fn();
    controller.observe(view, [document.createElement('div')], 15, measure);
    expect(measure).not.toHaveBeenCalled();
    listeners.resize?.();
    listeners.resize?.();
    vi.advanceTimersByTime(15);
    expect(measure).toHaveBeenCalledOnce();
    controller.disconnect();
    expect(listeners.resize).toBeUndefined();
    vi.useRealTimers();
  });

  it('observes element resize immediately and replaces pending observations', () => {
    vi.useFakeTimers();
    const observed: Element[] = [];
    const disconnect = vi.fn();
    class ResizeObserverStub {
      constructor(private readonly callback: () => void) {}
      observe(element: Element): void {
        observed.push(element);
        this.callback();
      }
      disconnect = disconnect;
    }
    const view = {
      ResizeObserver: ResizeObserverStub,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const controller = new NeuTableViewportController();
    const first = vi.fn();
    const elements = [document.createElement('div'), document.createElement('span')];
    controller.observe(view, elements, Number.NaN, first);
    expect(observed).toEqual(elements);
    expect(first).toHaveBeenCalledTimes(3);

    const second = vi.fn();
    controller.observe(view, [], 20, second);
    expect(disconnect).toHaveBeenCalledOnce();
    controller.disconnect();
    vi.runAllTimers();
    expect(second).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('normalizes invalid retention ranges and ignores unchanged cached rows', () => {
    const row = { id: 1 };
    const retention = new NeuTableVirtualRetentionController<typeof row>();
    expect(
      retention.include(
        { first: Number.NaN, end: -4, visibleFirst: 0, visibleEnd: 0 },
        Number.NaN,
        undefined,
        [],
      ),
    ).toBe(false);
    expect(
      retention.include({ first: 0, end: 2, visibleFirst: 0, visibleEnd: 1 }, 2, 0, [row]),
    ).toBe(true);
    expect(
      retention.include({ first: 1, end: 2, visibleFirst: 1, visibleEnd: 2 }, 2, 0, [row]),
    ).toBe(false);
    expect(
      retention.include(
        { first: 0, end: Number.NaN, visibleFirst: 0, visibleEnd: 0 },
        2,
        Number.NaN,
        [row],
      ),
    ).toBe(false);
    expect(retention.intervals()).toEqual([{ first: 0, end: 2 }]);
  });
});
