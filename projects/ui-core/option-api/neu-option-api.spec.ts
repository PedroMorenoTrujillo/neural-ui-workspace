import {
  deserializeNeuOptionValue,
  neuOptionsEqual,
  neuOptionValuesEqual,
  readNeuOptionAccessor,
  resolveNeuOptionDisabled,
  resolveNeuOptionGroup,
  resolveNeuOptionGroupChildren,
  resolveNeuOptionGroupDisabled,
  resolveNeuOptionGroupLabel,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
  serializeNeuOptionValue,
} from './neu-option-api';

interface DomainOption {
  id: number;
  name: string;
  archived: boolean;
  profile?: {
    displayName?: string;
  };
}

const domainOption: DomainOption = {
  id: 7,
  name: 'Seven',
  archived: true,
  profile: { displayName: 'Nested Seven' },
};

describe('generic option API', () => {
  it('reads keyof and function accessors', () => {
    expect(readNeuOptionAccessor(domainOption, 'name')).toBe('Seven');
    expect(readNeuOptionAccessor(domainOption, (option) => option.id * 2)).toBe(14);
    expect(resolveNeuOptionLabel(domainOption, 'name')).toBe('Seven');
    expect(resolveNeuOptionDisabled(domainOption, 'archived')).toBe(true);
  });

  it('reads nested paths safely while preserving literal dotted keys', () => {
    expect(readNeuOptionAccessor(domainOption, 'profile.displayName')).toBe('Nested Seven');
    expect(readNeuOptionAccessor(domainOption, 'profile.missing')).toBeUndefined();
    expect(
      readNeuOptionAccessor(
        { profile: null } as { profile: { name: string } | null },
        'profile.name',
      ),
    ).toBeUndefined();
    expect(
      readNeuOptionAccessor(
        { profile: { name: 'nested' }, 'profile.name': 'literal' },
        'profile.name',
      ),
    ).toBe('literal');
    expect(readNeuOptionAccessor('primitive', 'length')).toBeUndefined();

    const missingSymbol = Symbol('missing');
    const symbolRecord: { [missingSymbol]?: string; name: string } = { name: 'Ada' };
    expect(readNeuOptionAccessor(symbolRecord, missingSymbol)).toBeUndefined();
  });

  it('returns complete domain objects by default and preserves legacy values', () => {
    expect(resolveNeuOptionValue(domainOption)).toBe(domainOption);
    expect(resolveNeuOptionValue(domainOption, 'id')).toBe(7);
    expect(resolveNeuOptionValue({ label: 'Seven', value: '7', data: domainOption })).toBe('7');
    expect(resolveNeuOptionLabel(null)).toBe('');
    expect(resolveNeuOptionDisabled({ name: 'Available' })).toBe(false);
    expect(resolveNeuOptionValue({ 0: false } as const, 0)).toBe(false);
    expect(resolveNeuOptionGroup('ungrouped')).toBeUndefined();
    expect(resolveNeuOptionGroup({ group: null })).toBeUndefined();
    expect(resolveNeuOptionGroup({ group: 0 })).toBe('0');
  });

  it('uses identity equality for complete-object values', () => {
    expect(neuOptionValuesEqual(domainOption, domainOption)).toBe(true);
    expect(neuOptionValuesEqual(domainOption, { ...domainOption })).toBe(false);
    expect(neuOptionValuesEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('supports immutable replacement through explicit identity configuration', () => {
    const replacement = { ...domainOption, name: 'Seven replacement' };

    expect(neuOptionsEqual(domainOption, replacement)).toBe(false);
    expect(neuOptionsEqual(domainOption, replacement, { identityAccessor: 'id' })).toBe(true);
    expect(
      neuOptionsEqual(domainOption, replacement, {
        compareWith: (left, right) => left.id === right.id,
      }),
    ).toBe(true);
  });

  it('uses identity, compare, value, and Object.is precedence without truthiness coercion', () => {
    const left = { id: 0, value: false };
    const right = { id: 0, value: false };
    const compareWith = vi.fn(() => false);

    expect(neuOptionsEqual(left, right, { identityAccessor: 'id', compareWith })).toBe(true);
    expect(compareWith).not.toHaveBeenCalled();
    expect(neuOptionsEqual(left, right, { valueAccessor: 'value' })).toBe(true);
    expect(
      neuOptionsEqual(
        { label: 'Not a number', value: Number.NaN },
        { label: 'Replacement', value: Number.NaN },
      ),
    ).toBe(true);
    expect(
      neuOptionsEqual<{ label: string; value: number | boolean }>(
        { label: 'Zero', value: 0 },
        { label: 'False', value: false },
      ),
    ).toBe(false);
  });

  it('resolves typed groups through nested and computed accessors', () => {
    const group = {
      meta: { title: 'People', locked: true },
      data: { children: [domainOption] as readonly DomainOption[] },
    };
    const config = {
      labelAccessor: 'meta.title' as const,
      childrenAccessor: (item: typeof group) => item.data.children,
      disabledAccessor: 'meta.locked' as const,
    };

    expect(resolveNeuOptionGroupLabel(group, config)).toBe('People');
    expect(resolveNeuOptionGroupChildren(group, config)).toEqual([domainOption]);
    expect(resolveNeuOptionGroupDisabled(group, config)).toBe(true);

    const incomplete = { meta: { title: null as string | null } };
    const incompleteConfig = {
      labelAccessor: 'meta.title' as const,
      childrenAccessor: 'meta.children' as const,
    };
    expect(
      resolveNeuOptionGroupLabel<DomainOption, typeof incomplete>(incomplete, incompleteConfig),
    ).toBe('');
    expect(
      resolveNeuOptionGroupChildren<DomainOption, typeof incomplete>(incomplete, incompleteConfig),
    ).toEqual([]);
    expect(
      resolveNeuOptionGroupDisabled<DomainOption, typeof incomplete>(incomplete, incompleteConfig),
    ).toBe(false);
  });

  it('serializes URL-compatible primitives without coercing objects', () => {
    expect(serializeNeuOptionValue('seven')).toBe('seven');
    expect(serializeNeuOptionValue(7)).toBe('7');
    expect(serializeNeuOptionValue(false)).toBe('false');
    expect(serializeNeuOptionValue(7n)).toBe('7');
    expect(serializeNeuOptionValue(null)).toBeNull();
    expect(serializeNeuOptionValue(domainOption)).toBeNull();
  });

  it('deserializes primitive URL values into primitive option values', () => {
    expect(deserializeNeuOptionValue('41')).toBe(41);
    expect(deserializeNeuOptionValue('-2.5')).toBe(-2.5);
    expect(deserializeNeuOptionValue('false')).toBe(false);
    expect(deserializeNeuOptionValue('true')).toBe(true);
    expect(deserializeNeuOptionValue('user:23/test value')).toBe('user:23/test value');
  });
});
