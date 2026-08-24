import type { Signal } from '@angular/core';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import type { NeuTableSortEntry } from './neu-table.types';
import type { InternalNeuTableSort } from './neu-table-state.controller';

export interface InternalNeuTableUrlStateConfig {
  pageParam: string;
  searchParam: string;
  sortParam: string;
  sortDirParam: string;
  multiSortParam: string;
}

export interface InternalNeuTableUrlStateSnapshot {
  page: number;
  search: string;
  sort: InternalNeuTableSort | null;
  sortEntries: readonly NeuTableSortEntry[];
}

/** URL parser/writer around canonical Table state; it never owns Table values. */
export class NeuTableUrlStateAdapter {
  private readonly _paramSignals = new Map<string, Signal<string | null>>();

  constructor(private readonly _urlState: NeuUrlStateService) {}

  read(config: InternalNeuTableUrlStateConfig): InternalNeuTableUrlStateSnapshot {
    const pageRaw = this._readParam(config.pageParam);
    const pageValue = Number(pageRaw);
    const sortKey = this._readParam(config.sortParam) ?? '';
    return {
      page: !pageRaw || Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue,
      search: this._readParam(config.searchParam) ?? '',
      sort: sortKey
        ? {
            key: sortKey,
            dir: this._readParam(config.sortDirParam) === 'desc' ? 'desc' : 'asc',
          }
        : null,
      sortEntries: this._parseSortEntries(this._readParam(config.multiSortParam)),
    };
  }

  writePage(param: string, page: number): void {
    this._urlState.setParam(param, String(page));
  }

  writeSortEntries(
    config: InternalNeuTableUrlStateConfig,
    entries: readonly NeuTableSortEntry[],
  ): void {
    this._urlState.patchParams({
      [config.multiSortParam]:
        entries.length > 0 ? entries.map((entry) => `${entry.key}:${entry.dir}`).join(',') : null,
      [config.sortParam]: null,
      [config.sortDirParam]: null,
      [config.pageParam]: '1',
    });
  }

  writeSort(config: InternalNeuTableUrlStateConfig, sort: InternalNeuTableSort | null): void {
    this._urlState.patchParams({
      [config.sortParam]: sort?.key ?? null,
      [config.sortDirParam]: sort?.dir ?? null,
      [config.multiSortParam]: null,
      [config.pageParam]: '1',
    });
  }

  writeSearch(config: InternalNeuTableUrlStateConfig, search: string): void {
    this._urlState.patchParams({
      [config.searchParam]: search || null,
      [config.pageParam]: '1',
    });
  }

  clearSearch(config: InternalNeuTableUrlStateConfig): void {
    this._urlState.patchParams({ [config.searchParam]: null, [config.pageParam]: '1' });
  }

  resetPage(param: string): void {
    this._urlState.patchParams({ [param]: '1' });
  }

  private _readParam(key: string): string | null {
    let paramSignal = this._paramSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._paramSignals.set(key, paramSignal);
    }
    return paramSignal();
  }

  private _parseSortEntries(value: string | null): NeuTableSortEntry[] {
    if (!value) return [];
    return value.split(',').flatMap((chunk) => {
      const [key, dir] = chunk.split(':');
      return key ? [{ key, dir: dir === 'desc' ? 'desc' : 'asc' }] : [];
    });
  }
}
