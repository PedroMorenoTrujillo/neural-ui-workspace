export interface NeuTableScheduledFilters<T> {
  readonly searchSet: boolean;
  readonly search: string;
  readonly columns: ReadonlyMap<string, T>;
}

/**
 * One coalesced timer mirrors Table-level filter scheduling while
 * keeping draft values transient and canonical state single-owned.
 */
export class NeuTableFilterScheduler<T> {
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _searchSet = false;
  private _search = '';
  private readonly _columns = new Map<string, T>();

  constructor(private readonly _apply: (pending: NeuTableScheduledFilters<T>) => void) {}

  search(value: string, delay: number): void {
    this._searchSet = true;
    this._search = value;
    this._schedule(delay);
  }

  column(key: string, value: T, delay: number): void {
    this._columns.set(key, value);
    this._schedule(delay);
  }

  discardColumn(key: string): void {
    this._columns.delete(key);
  }

  discardSearch(): void {
    this._searchSet = false;
    this._search = '';
  }

  discardColumns(): void {
    this._columns.clear();
  }

  cancel(): void {
    if (this._timer !== null) clearTimeout(this._timer);
    this._timer = null;
    this._searchSet = false;
    this._search = '';
    this._columns.clear();
  }

  private _schedule(delay: number): void {
    if (this._timer !== null) clearTimeout(this._timer);
    const normalized = Number.isFinite(delay) ? Math.max(0, Math.floor(delay)) : 0;
    if (normalized === 0) {
      this._flush();
      return;
    }
    this._timer = setTimeout(() => this._flush(), normalized);
  }

  private _flush(): void {
    if (this._timer !== null) clearTimeout(this._timer);
    this._timer = null;
    const pending: NeuTableScheduledFilters<T> = {
      searchSet: this._searchSet,
      search: this._search,
      columns: new Map(this._columns),
    };
    this._searchSet = false;
    this._search = '';
    this._columns.clear();
    if (pending.searchSet || pending.columns.size > 0) this._apply(pending);
  }
}
