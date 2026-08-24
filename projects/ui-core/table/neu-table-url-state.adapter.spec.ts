import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { NeuTableUrlStateAdapter } from './neu-table-url-state.adapter';

const CONFIG = {
  pageParam: 'page',
  searchParam: 'q',
  sortParam: 'sort',
  sortDirParam: 'sortDir',
  multiSortParam: 'msort',
};

function createAdapter(params: Record<string, string | null> = {}) {
  const values = new Map<string, ReturnType<typeof signal<string | null>>>();
  const service = {
    getParam: vi.fn((key: string) => {
      let value = values.get(key);
      if (!value) {
        value = signal(params[key] ?? null);
        values.set(key, value);
      }
      return value;
    }),
    setParam: vi.fn(),
    patchParams: vi.fn(),
  };
  return { adapter: new NeuTableUrlStateAdapter(service as any), service, values };
}

describe('NeuTableUrlStateAdapter', () => {
  it('normalizes invalid URL values and caches parameter signals', () => {
    const { adapter, service } = createAdapter({
      page: '-1',
      msort: ',name:unexpected',
    });

    expect(adapter.read(CONFIG)).toEqual({
      page: 1,
      search: '',
      sort: null,
      sortEntries: [{ key: 'name', dir: 'asc' }],
    });
    adapter.read(CONFIG);

    expect(service.getParam).toHaveBeenCalledTimes(4);
  });

  it('writes empty multisort and search projections without retaining empty strings', () => {
    const { adapter, service } = createAdapter();

    adapter.writeSortEntries(CONFIG, []);
    adapter.writeSearch(CONFIG, '');

    expect(service.patchParams).toHaveBeenCalledWith({
      msort: null,
      sort: null,
      sortDir: null,
      page: '1',
    });
    expect(service.patchParams).toHaveBeenCalledWith({ q: null, page: '1' });
  });

  it('writes page, sort, clear-search and reset-page projections', () => {
    const { adapter, service } = createAdapter();

    adapter.writePage('page', 3);
    adapter.writeSortEntries(CONFIG, [{ key: 'name', dir: 'desc' }]);
    adapter.writeSort(CONFIG, { key: 'name', dir: 'desc' });
    adapter.writeSort(CONFIG, null);
    adapter.clearSearch(CONFIG);
    adapter.resetPage('page');

    expect(service.setParam).toHaveBeenNthCalledWith(1, 'page', '3');
    expect(service.patchParams).toHaveBeenNthCalledWith(1, {
      msort: 'name:desc',
      sort: null,
      sortDir: null,
      page: '1',
    });
    expect(service.patchParams).toHaveBeenNthCalledWith(2, {
      sort: 'name',
      sortDir: 'desc',
      msort: null,
      page: '1',
    });
    expect(service.patchParams).toHaveBeenNthCalledWith(3, {
      sort: null,
      sortDir: null,
      msort: null,
      page: '1',
    });
    expect(service.patchParams).toHaveBeenNthCalledWith(4, { q: null, page: '1' });
    expect(service.patchParams).toHaveBeenNthCalledWith(5, { page: '1' });
  });
});
