import type { NeuTableEditValidationResult } from './neu-table.types';

export interface InternalNeuTableCellDraft {
  readonly rowKey: unknown;
  readonly columnKey: string;
  readonly value: unknown;
  readonly previousValue: unknown;
  readonly invalid: boolean;
  readonly error: string | null;
}

export interface InternalNeuTableRowDraft<T extends object> {
  readonly rowKey: unknown;
  readonly original: T;
  readonly draft: Readonly<T>;
  readonly invalid: boolean;
  readonly error: string | null;
}

/** Owns drafts and validation feedback only; canonical edit keys stay in NeuTableStateController. */
export class NeuTableEditingController<T extends object> {
  private _cell: InternalNeuTableCellDraft | null = null;
  private readonly _rows = new Map<unknown, InternalNeuTableRowDraft<T>>();

  cell(): InternalNeuTableCellDraft | null {
    return this._cell ? { ...this._cell } : null;
  }

  beginCell(rowKey: unknown, columnKey: string, previousValue: unknown): InternalNeuTableCellDraft {
    this._cell = {
      rowKey,
      columnKey,
      value: previousValue ?? '',
      previousValue,
      invalid: false,
      error: null,
    };
    return this.cell()!;
  }

  setCellValue(value: unknown): InternalNeuTableCellDraft | null {
    if (!this._cell) return null;
    this._cell = { ...this._cell, value, invalid: false, error: null };
    return this.cell();
  }

  validateCell(result: NeuTableEditValidationResult | undefined): boolean {
    if (!this._cell) return false;
    const validation = normalizeValidation(result);
    this._cell = { ...this._cell, invalid: !validation.valid, error: validation.message };
    return validation.valid;
  }

  finishCell(): InternalNeuTableCellDraft | null {
    const current = this.cell();
    this._cell = null;
    return current;
  }

  cancelCell(): InternalNeuTableCellDraft | null {
    return this.finishCell();
  }

  beginRow(rowKey: unknown, row: T): InternalNeuTableRowDraft<T> {
    const draft = Object.freeze({ ...row }) as Readonly<T>;
    const state = { rowKey, original: row, draft, invalid: false, error: null };
    this._rows.set(rowKey, state);
    return { ...state };
  }

  row(rowKey: unknown, fallback: T): InternalNeuTableRowDraft<T> {
    return (
      this._rows.get(rowKey) ?? {
        rowKey,
        original: fallback,
        draft: Object.freeze({ ...fallback }) as Readonly<T>,
        invalid: false,
        error: null,
      }
    );
  }

  setRowValue(
    rowKey: unknown,
    columnKey: string,
    value: unknown,
  ): InternalNeuTableRowDraft<T> | null {
    const current = this._rows.get(rowKey);
    if (!current) return null;
    const draft = Object.freeze({ ...current.draft, [columnKey]: value }) as Readonly<T>;
    const next = { ...current, draft, invalid: false, error: null };
    this._rows.set(rowKey, next);
    return { ...next };
  }

  validateRow(rowKey: unknown, result: NeuTableEditValidationResult | undefined): boolean {
    const current = this._rows.get(rowKey);
    if (!current) return false;
    const validation = normalizeValidation(result);
    this._rows.set(rowKey, {
      ...current,
      invalid: !validation.valid,
      error: validation.message,
    });
    return validation.valid;
  }

  finishRow(rowKey: unknown): InternalNeuTableRowDraft<T> | null {
    const state = this._rows.get(rowKey);
    if (!state) return null;
    this._rows.delete(rowKey);
    return { ...state };
  }

  cancelRow(rowKey: unknown): InternalNeuTableRowDraft<T> | null {
    return this.finishRow(rowKey);
  }

  prune(activeKeys: ReadonlySet<unknown>): void {
    for (const key of this._rows.keys()) if (!activeKeys.has(key)) this._rows.delete(key);
    if (this._cell && !activeKeys.has(this._cell.rowKey)) this._cell = null;
  }
}

function normalizeValidation(result: NeuTableEditValidationResult | undefined): {
  valid: boolean;
  message: string | null;
} {
  if (result === undefined || result === true) return { valid: true, message: null };
  if (result === false) return { valid: false, message: 'Invalid value' };
  if (typeof result === 'string') return { valid: false, message: result || 'Invalid value' };
  return {
    valid: result.valid,
    message: result.valid ? null : (result.message ?? 'Invalid value'),
  };
}
