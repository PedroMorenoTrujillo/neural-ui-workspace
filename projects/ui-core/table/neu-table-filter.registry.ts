import { Injectable, signal } from '@angular/core';
import type { NeuTableFilterMatcher } from './neu-table.types';

type InternalMatcher = NeuTableFilterMatcher<unknown>;

/**
 * Application-scoped reusable Table match rules. The registry owns matcher
 * policy only; applied filter values continue to live in NeuTableStateController.
 */
@Injectable({ providedIn: 'root' })
export class NeuTableFilterRegistry {
  private readonly _matchers = new Map<string, InternalMatcher>();
  private readonly _revision = signal(0);
  readonly revision = this._revision.asReadonly();

  register<T>(name: string, matcher: NeuTableFilterMatcher<T>): () => void {
    const normalized = normalizeName(name);
    const stored = matcher as unknown as InternalMatcher;
    this._matchers.set(normalized, stored);
    this._revision.update((revision) => revision + 1);
    return () => {
      if (this._matchers.get(normalized) === stored) {
        this._matchers.delete(normalized);
        this._revision.update((revision) => revision + 1);
      }
    };
  }

  unregister(name: string): boolean {
    const normalized = name.trim();
    const deleted = normalized.length > 0 && this._matchers.delete(normalized);
    if (deleted) this._revision.update((revision) => revision + 1);
    return deleted;
  }

  has(name: string): boolean {
    return this._matchers.has(name.trim());
  }

  resolve<T>(name: string): NeuTableFilterMatcher<T> | null {
    const matcher = this._matchers.get(name.trim());
    return matcher ? (matcher as unknown as NeuTableFilterMatcher<T>) : null;
  }

  names(): readonly string[] {
    return Object.freeze([...this._matchers.keys()].sort());
  }
}

function normalizeName(name: string): string {
  const normalized = name.trim();
  if (!normalized) throw new RangeError('A Table filter rule name must not be empty.');
  return normalized;
}
