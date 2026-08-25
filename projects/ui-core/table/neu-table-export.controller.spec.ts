import { NeuTableExportController } from './neu-table-export.controller';

describe('NeuTableExportController', () => {
  const controller = new NeuTableExportController();
  const columns = [
    { key: 'name', header: 'Display name', value: (row: { name: string }) => row.name },
  ];

  it('quotes CSV, emits a BOM, validates separators, and escapes spreadsheet formulas', () => {
    expect(controller.csv([{ name: '=1+1,"x"\r\ny' }], columns, { separator: ';', formulaPolicy: 'escape' }))
      .toBe('\uFEFF"Display name"\r\n"\'=1+1,""x""\r\ny"');
    expect(controller.normalizeSeparator('\r\n')).toBe(',');
  });

  it('projects JSON through canonical accessors', () => {
    expect(controller.json([{ name: 'Ada' }], columns)).toContain('"name": "Ada"');
  });

  it('creates a genuine ZIP-based XLSX package', () => {
    const bytes = controller.xlsx(
      [{ name: 'Ada', count: 2, active: true }],
      [
        ...columns,
        { key: 'count', header: 'Count', value: (row) => row.count },
        { key: 'active', header: 'Active', value: (row) => row.active },
      ],
    );
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder().decode(bytes)).toContain('xl/worksheets/sheet1.xml');
  });

  it('serializes supported scalar, date, object, null and cyclic fallback values', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const values = [null, undefined, new Date('2026-01-02T00:00:00.000Z'), 2, true, false, 3n, { a: 1 }, cyclic];
    const manyColumns = values.map((value, index) => ({
      key: String(index),
      header: String(index),
      value: () => value,
    }));
    const csv = controller.csv([{}], manyColumns, {
      separator: '|',
      formulaPolicy: 'preserve',
      bom: false,
    });
    expect(csv.startsWith('"0"|"1"')).toBe(true);
    expect(csv).toContain('2026-01-02T00:00:00.000Z');
    expect(csv).toContain('{""a"":1}');
    expect(controller.xlsx([{}], manyColumns).length).toBeGreaterThan(100);
  });
});
