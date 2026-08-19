import {
  deserializeNeuOptionValue,
  neuOptionValuesEqual,
  readNeuOptionAccessor,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
  serializeNeuOptionValue,
} from './neu-option-api';

interface DomainOption {
  id: number;
  name: string;
  archived: boolean;
}

const domainOption: DomainOption = { id: 7, name: 'Seven', archived: true };

describe('generic option API', () => {
  it('reads keyof and function accessors', () => {
    expect(readNeuOptionAccessor(domainOption, 'name')).toBe('Seven');
    expect(readNeuOptionAccessor(domainOption, (option) => option.id * 2)).toBe(14);
    expect(resolveNeuOptionLabel(domainOption, 'name')).toBe('Seven');
    expect(resolveNeuOptionDisabled(domainOption, 'archived')).toBe(true);
  });

  it('returns complete domain objects by default and preserves legacy values', () => {
    expect(resolveNeuOptionValue(domainOption)).toBe(domainOption);
    expect(resolveNeuOptionValue(domainOption, 'id')).toBe(7);
    expect(resolveNeuOptionValue({ label: 'Seven', value: '7', data: domainOption })).toBe('7');
  });

  it('uses identity equality for complete-object values', () => {
    expect(neuOptionValuesEqual(domainOption, domainOption)).toBe(true);
    expect(neuOptionValuesEqual(domainOption, { ...domainOption })).toBe(false);
    expect(neuOptionValuesEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('serializes URL-compatible primitives without coercing objects', () => {
    expect(serializeNeuOptionValue('seven')).toBe('seven');
    expect(serializeNeuOptionValue(7)).toBe('7');
    expect(serializeNeuOptionValue(false)).toBe('false');
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
