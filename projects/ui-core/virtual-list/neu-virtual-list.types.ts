export type NeuVirtualListKey = string | number;

export interface NeuVirtualListRange {
  readonly start: number;
  readonly end: number;
}

export interface NeuVirtualItemContext<T, K extends NeuVirtualListKey> {
  readonly $implicit: T;
  readonly item: T;
  readonly index: number;
  readonly key: K;
}

export type NeuVirtualListScrollTarget<K extends NeuVirtualListKey> =
  | { readonly index: number; readonly align?: 'nearest' | 'start' | 'center' | 'end' }
  | { readonly key: K; readonly align?: 'nearest' | 'start' | 'center' | 'end' };
