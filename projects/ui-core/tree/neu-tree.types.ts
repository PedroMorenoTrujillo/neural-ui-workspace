export type NeuTreeKey = string | number;
export type NeuTreeInteractionSource = 'pointer' | 'keyboard';

/** Domain data and hierarchy/presentation metadata remain separate. */
export interface NeuTreeNode<T, K extends NeuTreeKey = string> {
  readonly key: K;
  readonly data: T;
  readonly label: string;
  readonly description?: string;
  readonly badge?: string;
  readonly disabled?: boolean;
}

export type NeuTreeChildrenRelation<K extends NeuTreeKey> =
  | { readonly parentKey: K; readonly state: 'unloaded' }
  | { readonly parentKey: K; readonly state: 'loading'; readonly requestId: number }
  | { readonly parentKey: K; readonly state: 'loaded'; readonly keys: readonly K[] }
  | { readonly parentKey: K; readonly state: 'error'; readonly requestId?: number };

export interface NeuTreeHierarchy<K extends NeuTreeKey> {
  readonly revision: number;
  readonly roots: readonly K[];
  readonly children: readonly NeuTreeChildrenRelation<K>[];
}

export type NeuTreeSelection<K extends NeuTreeKey> =
  | { readonly mode: 'none' }
  | { readonly mode: 'single'; readonly key: K | null }
  | { readonly mode: 'multiple'; readonly keys: readonly K[] }
  | { readonly mode: 'checkbox'; readonly keys: readonly K[] };

export interface NeuTreeExpandedKeysChange<K extends NeuTreeKey> {
  readonly keys: readonly K[];
  readonly key: K;
  readonly expanded: boolean;
  readonly source: NeuTreeInteractionSource;
}

export interface NeuTreeSelectionChange<K extends NeuTreeKey> {
  readonly selection: NeuTreeSelection<K>;
  readonly key: K;
  readonly source: NeuTreeInteractionSource;
}

export interface NeuTreeChildrenRequest<K extends NeuTreeKey> {
  readonly requestId: number;
  readonly hierarchyRevision: number;
  readonly parentKey: K;
  readonly reason: 'expand' | 'retry';
}

export interface NeuTreeNodeAction<K extends NeuTreeKey> {
  readonly key: K;
}

export type NeuTreeMovePosition = 'before' | 'inside' | 'after';

export interface NeuTreeNodeMove<K extends NeuTreeKey> {
  readonly sourceKey: K;
  readonly sourceParentKey: K | null;
  readonly sourceIndex: number;
  readonly targetKey: K;
  readonly targetParentKey: K | null;
  /** Final insertion index after removal from the source siblings. */
  readonly targetIndex: number;
  readonly position: NeuTreeMovePosition;
}

export interface NeuTreeVirtualization {
  readonly itemSize: number;
  readonly viewportHeight: number;
  readonly buffer?: number;
}

export interface NeuTreeNodeTemplateContext<T, K extends NeuTreeKey = string> {
  readonly $implicit: T;
  readonly key: K;
  readonly level: number;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly partial: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly hasChildren: boolean;
}
