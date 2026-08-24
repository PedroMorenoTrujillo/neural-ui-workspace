import { signal } from '@angular/core';

export type NeuTableRowNavigationIntent = 'previous' | 'next' | 'first' | 'last';

export interface NeuTableRangeTransition<K> {
  previous: readonly K[];
  current: readonly K[];
}

/**
 * Transient row-focus and range-anchor policy.
 *
 * Canonical selection remains in NeuTableStateController; this controller only
 * retains logical keys that are meaningful for the currently rendered row scope.
 */
export class NeuTableKeyboardController<K = unknown> {
  private readonly _focusedKey = signal<K | null>(null);
  private readonly _rangeAnchorKey = signal<K | null>(null);
  private readonly _rangeExtentKey = signal<K | null>(null);

  readonly focusedKey = this._focusedKey.asReadonly();
  readonly rangeAnchorKey = this._rangeAnchorKey.asReadonly();
  readonly rangeExtentKey = this._rangeExtentKey.asReadonly();

  reconcile(navigableKeys: readonly K[], selectedKeys: ReadonlySet<K>): void {
    if (navigableKeys.length === 0) {
      this._focusedKey.set(null);
      this._rangeAnchorKey.set(null);
      this._rangeExtentKey.set(null);
      return;
    }

    const focused = this._focusedKey();
    if (focused === null || !this._includes(navigableKeys, focused)) {
      this._focusedKey.set(navigableKeys.find((key) => selectedKeys.has(key)) ?? navigableKeys[0]);
    }

    const anchor = this._rangeAnchorKey();
    if (anchor !== null && !this._includes(navigableKeys, anchor)) {
      this._rangeAnchorKey.set(null);
      this._rangeExtentKey.set(null);
      return;
    }

    const extent = this._rangeExtentKey();
    if (extent !== null && !this._includes(navigableKeys, extent)) {
      this._rangeExtentKey.set(anchor);
    }
  }

  focus(key: K, navigableKeys: readonly K[]): boolean {
    if (!this._includes(navigableKeys, key)) return false;
    this._focusedKey.set(key);
    return true;
  }

  establishAnchor(key: K): void {
    this._rangeAnchorKey.set(key);
    this._rangeExtentKey.set(key);
  }

  ensureAnchor(fallback: K): K {
    const anchor = this._rangeAnchorKey();
    if (anchor !== null) return anchor;
    this._rangeAnchorKey.set(fallback);
    this._rangeExtentKey.set(fallback);
    return fallback;
  }

  resetAnchor(): void {
    this._rangeAnchorKey.set(null);
    this._rangeExtentKey.set(null);
  }

  move(navigableKeys: readonly K[], currentKey: K, intent: NeuTableRowNavigationIntent): K | null {
    if (navigableKeys.length === 0) return null;
    const currentIndex = navigableKeys.findIndex((key) => Object.is(key, currentKey));
    if (currentIndex < 0) return navigableKeys[0];

    let nextIndex = currentIndex;
    if (intent === 'previous') nextIndex = Math.max(0, currentIndex - 1);
    if (intent === 'next') nextIndex = Math.min(navigableKeys.length - 1, currentIndex + 1);
    if (intent === 'first') nextIndex = 0;
    if (intent === 'last') nextIndex = navigableKeys.length - 1;

    const nextKey = navigableKeys[nextIndex];
    this._focusedKey.set(nextKey);
    return nextKey;
  }

  range(navigableKeys: readonly K[], targetKey: K, fallbackAnchor: K): K[] {
    const anchor = this.ensureAnchor(fallbackAnchor);
    return this._sliceRange(navigableKeys, anchor, targetKey);
  }

  transitionRange(
    navigableKeys: readonly K[],
    targetKey: K,
    fallbackAnchor: K,
  ): NeuTableRangeTransition<K> {
    const anchor = this.ensureAnchor(fallbackAnchor);
    const previous = this._sliceRange(navigableKeys, anchor, this._rangeExtentKey() ?? anchor);
    const current = this._sliceRange(navigableKeys, anchor, targetKey);
    if (current.length > 0) this._rangeExtentKey.set(targetKey);
    return { previous, current };
  }

  private _sliceRange(navigableKeys: readonly K[], anchor: K, targetKey: K): K[] {
    const anchorIndex = navigableKeys.findIndex((key) => Object.is(key, anchor));
    const targetIndex = navigableKeys.findIndex((key) => Object.is(key, targetKey));
    if (anchorIndex < 0 || targetIndex < 0) return [];
    const from = Math.min(anchorIndex, targetIndex);
    const to = Math.max(anchorIndex, targetIndex);
    return navigableKeys.slice(from, to + 1);
  }

  private _includes(keys: readonly K[], candidate: K): boolean {
    return keys.some((key) => Object.is(key, candidate));
  }
}
