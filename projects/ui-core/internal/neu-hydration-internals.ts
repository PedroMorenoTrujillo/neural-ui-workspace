import { Injectable } from '@angular/core';

/** @internal Application-scoped deterministic ID allocator shared by package entrypoints. */
@Injectable({ providedIn: 'root' })
export class NeuIdGenerator {
  private readonly counters = new Map<string, number>();

  getId(prefix: string): string {
    const next = this.counters.get(prefix) ?? 0;
    this.counters.set(prefix, next + 1);
    return `${prefix}${next}`;
  }
}
