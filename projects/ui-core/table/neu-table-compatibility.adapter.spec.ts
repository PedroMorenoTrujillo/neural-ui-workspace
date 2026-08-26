import { NeuTableCompatibilityAdapter } from './neu-table-compatibility.adapter';

describe('NeuTableCompatibilityAdapter', () => {
  const adapter = new NeuTableCompatibilityAdapter();

  it('normalizes the selectable alias without overriding an explicit canonical mode', () => {
    expect(adapter.selectionMode('none', false)).toBe('none');
    expect(adapter.selectionMode('none', true)).toBe('multiple');
    expect(adapter.selectionMode('single', true)).toBe('single');
    expect(adapter.selectionMode('multiple', false)).toBe('multiple');
  });

  it('normalizes the legacy toolbar input ahead of the canonical projected slot', () => {
    const legacy = { elementRef: {} } as never;
    const canonical = { elementRef: {} } as never;
    expect(adapter.toolbarTemplate(legacy, canonical)).toBe(legacy);
    expect(adapter.toolbarTemplate(null, canonical)).toBe(canonical);
    expect(adapter.toolbarTemplate(null, null)).toBeNull();
  });
});
