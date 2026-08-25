import { describe, expect, it } from 'vitest';
import { NeuTableEditingController } from './neu-table-editing.controller';

describe('NeuTableEditingController', () => {
  it('owns isolated cell drafts and keeps failed validation active', () => {
    const controller = new NeuTableEditingController<{ id: number; name: string }>();
    controller.beginCell(1, 'name', 'Ada');
    controller.setCellValue('');
    expect(controller.validateCell('Name is required')).toBe(false);
    expect(controller.cell()).toMatchObject({
      invalid: true,
      error: 'Name is required',
      value: '',
    });
    controller.setCellValue('Grace');
    expect(controller.validateCell(true)).toBe(true);
    expect(controller.finishCell()).toMatchObject({ value: 'Grace', previousValue: 'Ada' });
    expect(controller.cell()).toBeNull();
  });

  it('creates immutable row drafts without mutating consumer rows', () => {
    const row = { id: 1, name: 'Ada' };
    const controller = new NeuTableEditingController<typeof row>();
    controller.beginRow(1, row);
    controller.setRowValue(1, 'name', 'Grace');
    expect(row.name).toBe('Ada');
    expect(controller.row(1, row).draft.name).toBe('Grace');
    expect(controller.validateRow(1, { valid: false, message: 'No save' })).toBe(false);
    expect(controller.cancelRow(1)).toMatchObject({ invalid: true, error: 'No save' });
  });

  it('prunes drafts outside the active canonical key set', () => {
    const controller = new NeuTableEditingController<{ id: number }>();
    controller.beginCell(1, 'id', 1);
    controller.beginRow(1, { id: 1 });
    controller.prune(new Set([2]));
    expect(controller.cell()).toBeNull();
    expect(controller.finishRow(1)).toBeNull();
  });

  it('normalizes every validation shape and safely ignores missing drafts', () => {
    const controller = new NeuTableEditingController<{ id: number; name?: string }>();
    expect(controller.setCellValue('missing')).toBeNull();
    expect(controller.validateCell(false)).toBe(false);
    expect(controller.finishCell()).toBeNull();

    controller.beginCell(1, 'name', null);
    expect(controller.cell()?.value).toBe('');
    expect(controller.validateCell(undefined)).toBe(true);
    expect(controller.validateCell(false)).toBe(false);
    expect(controller.cell()?.error).toBe('Invalid value');
    expect(controller.validateCell('')).toBe(false);
    expect(controller.validateCell({ valid: false })).toBe(false);
    expect(controller.validateCell({ valid: true, message: 'ignored' })).toBe(true);
    expect(controller.cancelCell()).not.toBeNull();

    const fallback = { id: 2 };
    expect(controller.row(2, fallback).draft).toEqual(fallback);
    expect(controller.setRowValue(2, 'name', 'missing')).toBeNull();
    expect(controller.validateRow(2, true)).toBe(false);
    expect(controller.finishRow(2)).toBeNull();
    controller.beginRow(3, { id: 3 });
    controller.prune(new Set([3]));
    expect(controller.finishRow(3)).not.toBeNull();
  });
});
