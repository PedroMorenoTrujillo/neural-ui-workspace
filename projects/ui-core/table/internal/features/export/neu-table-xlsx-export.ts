import type {
  NeuTableExportMatrix,
  NeuTableSerializedExport,
} from '../../export/neu-table-export-serializer.types';

const encoder = new TextEncoder();

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json;
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let name = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  }
  return name;
}

function xlsxCell(value: unknown, columnIndex: number, rowIndex: number): string {
  const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(text(value))}</t></is></c>`;
}

function sheetXml(rows: readonly (readonly unknown[])[]): string {
  const body = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndex) => xlsxCell(value, columnIndex, rowIndex))
          .join('')}</row>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function record(
  signature: number,
  shorts: readonly number[],
  longs: readonly number[],
  name: Uint8Array,
  data: Uint8Array,
  tailShorts: readonly number[] = [],
  tailLongs: readonly number[] = [],
): Uint8Array {
  const fixed =
    4 + shorts.length * 2 + longs.length * 4 + 2 + 2 + tailShorts.length * 2 + tailLongs.length * 4;
  const output = new Uint8Array(fixed + name.length + data.length);
  const view = new DataView(output.buffer);
  let cursor = 0;
  view.setUint32(cursor, signature, true);
  cursor += 4;
  for (const value of shorts) {
    view.setUint16(cursor, value, true);
    cursor += 2;
  }
  for (const value of longs) {
    view.setUint32(cursor, value >>> 0, true);
    cursor += 4;
  }
  view.setUint16(cursor, name.length, true);
  cursor += 2;
  view.setUint16(cursor, 0, true);
  cursor += 2;
  for (const value of tailShorts) {
    view.setUint16(cursor, value, true);
    cursor += 2;
  }
  for (const value of tailLongs) {
    view.setUint32(cursor, value >>> 0, true);
    cursor += 4;
  }
  output.set(name, cursor);
  cursor += name.length;
  output.set(data, cursor);
  return output;
}

function zip(files: readonly [string, string][]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const checksum = crc32(data);
    const local = record(
      0x04034b50,
      [20, 0, 0, 0, 0],
      [checksum, data.length, data.length],
      nameBytes,
      data,
    );
    locals.push(local);
    centrals.push(
      record(
        0x02014b50,
        [20, 20, 0, 0, 0, 0],
        [checksum, data.length, data.length],
        nameBytes,
        new Uint8Array(),
        [0, 0, 0],
        [0, offset],
      ),
    );
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, value) => sum + value.length, 0);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, files.length, true);
  view.setUint16(10, files.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);
  return concat([...locals, ...centrals, end]);
}

export function serializeNeuTableXlsx(matrix: NeuTableExportMatrix): NeuTableSerializedExport {
  const rows = [matrix.columns.map((column) => column.header), ...matrix.rows];
  const files: readonly [string, string][] = [
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      'xl/workbook.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Table" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ],
    ['xl/worksheets/sheet1.xml', sheetXml(rows)],
  ];
  return {
    mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bytes: zip(files),
  };
}
