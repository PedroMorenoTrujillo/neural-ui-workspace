/** Selection behavior for multiple TreeSelect values. */
export type NeuTreeSelectSelectionStrategy = 'independent' | 'propagated';

/** Fixed-height viewport configuration. Disabled unless `enabled` is true. */
export interface NeuTreeSelectVirtualizationOptions {
  readonly enabled?: boolean;
  readonly itemSize?: number;
  readonly viewportHeight?: number;
  readonly buffer?: number;
}

/** Consumer-owned request to load the children of one expanded node. */
export interface NeuTreeSelectChildrenRequest<K> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly parentKey: K;
}
