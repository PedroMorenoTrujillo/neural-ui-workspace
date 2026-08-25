import { matchesNeuTableFilter } from './neu-table-filter.engine';
import { NeuTableFilterRegistry } from './neu-table-filter.registry';
import type { NeuTableColumn } from './neu-table.types';

interface Row {
  id: number;
  code: string;
}

describe('NeuTableFilterRegistry', () => {
  const column: NeuTableColumn<Row> = {
    key: 'code',
    header: 'Code',
    filterConfig: { kind: 'custom', mode: 'same-prefix' },
  };

  it('registers, overrides, cleans up deterministically, and safely misses unknown rules', () => {
    const registry = new NeuTableFilterRegistry();
    const firstCleanup = registry.register<Row>('same-prefix', (value, filter) =>
      String(value).startsWith(String(filter)),
    );
    expect(matchesNeuTableFilter({ id: 1, code: 'AB-1' }, column, 'AB', undefined, registry)).toBe(true);
    expect(matchesNeuTableFilter({ id: 1, code: 'AB-1' }, column, 'AB', 'custom', registry)).toBe(true);

    const secondCleanup = registry.register<Row>('same-prefix', () => false);
    firstCleanup();
    expect(registry.has('same-prefix')).toBe(true);
    expect(matchesNeuTableFilter({ id: 1, code: 'AB-1' }, column, 'AB', undefined, registry)).toBe(false);

    secondCleanup();
    expect(registry.names()).toEqual([]);
    expect(matchesNeuTableFilter({ id: 1, code: 'AB-1' }, column, 'AB', undefined, registry)).toBe(false);
  });

  it('rejects blank names and unregisters explicitly', () => {
    const registry = new NeuTableFilterRegistry();
    expect(() => registry.register(' ', () => true)).toThrowError(RangeError);
    registry.register('rule', () => true);
    expect(registry.unregister('rule')).toBe(true);
    expect(registry.unregister('rule')).toBe(false);
  });
});
