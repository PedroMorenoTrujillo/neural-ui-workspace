import {
  compileMask,
  deleteFromMask,
  insertIntoMask,
  reconcileInput,
} from './neu-input-mask.engine';

describe('InputMask private slot engine', () => {
  const date = compileMask('99/99/9999');

  it('compiles only 9/A/* as editable and retains literal positions', () => {
    const mask = compileMask('9-A-*');
    expect(mask.units.map((unit) => unit.kind)).toEqual([
      'editable', 'literal', 'editable', 'literal', 'editable',
    ]);
    expect(mask.editable.map((slot) => [slot.token, slot.maskIndex, slot.editableIndex])).toEqual([
      ['9', 0, 0], ['A', 2, 1], ['*', 4, 2],
    ]);
  });

  it('keeps unmasked text unchanged', () => {
    const plain = compileMask('');
    expect(insertIntoMask(plain, 'ab', 'Z', 1)).toEqual({ value: 'aZb', caret: 2 });
    expect(deleteFromMask(plain, 'abc', 1, 1, 'backward')).toEqual({ value: 'bc', caret: 0 });
    expect(deleteFromMask(plain, 'abc', 1, 1, 'forward')).toEqual({ value: 'ac', caret: 1 });
    expect(reconcileInput(plain, 'raw!', 2)).toEqual({ value: 'raw!', caret: 2 });
  });

  it('formats incomplete input without placing placeholders in the model', () => {
    expect(reconcileInput(date, '', 0).value).toBe('');
    expect(reconcileInput(date, '12', 2).value).toBe('12');
    expect(reconcileInput(date, '12/3', 4).value).toBe('12/3');
    expect(reconcileInput(date, '12/34/2026', 10).value).toBe('12/34/2026');
  });

  it('ignores invalid characters without reordering accepted characters', () => {
    const mask = compileMask('99-AA-**');
    expect(reconcileInput(mask, '1a2bc3Z', 7).value).toBe('12-bc-3Z');
    expect(reconcileInput(mask, '12-bc-3Z', 8).value).toBe('12-bc-3Z');
  });

  it('inserts at the start, middle and end, advancing across literals', () => {
    expect(insertIntoMask(date, '', '1', 0)).toEqual({ value: '1', caret: 1 });
    expect(insertIntoMask(date, '12', '3', 2)).toEqual({ value: '12/3', caret: 4 });
    expect(insertIntoMask(date, '12/34/2026', '9', 3)).toEqual({ value: '12/94/2026', caret: 4 });
    expect(insertIntoMask(date, '12/34/202', '6', 9)).toEqual({ value: '12/34/2026', caret: 10 });
  });

  it('replaces selected editable slots even when the range spans literals', () => {
    expect(insertIntoMask(date, '12/34/2026', '56', 3, 8)).toEqual({
      value: '12/56/26', caret: 6,
    });
  });

  it('pastes full, mixed and literal-bearing text in order', () => {
    expect(insertIntoMask(date, '', '12/34/2026', 0).value).toBe('12/34/2026');
    expect(insertIntoMask(date, '', '1x2/3y4/2026', 0).value).toBe('12/34/2026');
    expect(insertIntoMask(date, '12/34/2026', '78', 3, 5).value).toBe('12/78/2026');
    expect(insertIntoMask(date, '12/34/2026', '5', 4).value).toBe('12/35/2026');
  });

  it('deletes backward/forward at boundaries and skips immutable literals', () => {
    const short = compileMask('99/99');
    expect(deleteFromMask(short, '12/34', 0, 0, 'backward').value).toBe('12/34');
    expect(deleteFromMask(short, '12/34', 2, 2, 'backward')).toEqual({ value: '1/34', caret: 1 });
    expect(deleteFromMask(short, '12/34', 3, 3, 'backward').value).toBe('1/34');
    expect(deleteFromMask(short, '12/34', 2, 2, 'forward').value).toBe('12/4');
    expect(deleteFromMask(short, '12/34', 3, 5, 'forward').value).toBe('12');
    expect(deleteFromMask(short, '12/34', 5, 5, 'forward').value).toBe('12/34');
  });

  it('does not mutate the compiled mask or source value', () => {
    const mask = compileMask('99/99');
    const units = JSON.stringify(mask);
    const current = '12/34';
    insertIntoMask(mask, current, '9', 0);
    deleteFromMask(mask, current, 3, 3, 'backward');
    expect(JSON.stringify(mask)).toBe(units);
    expect(current).toBe('12/34');
  });

  it('normalizes reversed selections and ignores insertion beyond the final slot', () => {
    expect(insertIntoMask(date, '12/34', '56', 5, 3).value).toBe('12/56');
    expect(insertIntoMask(date, '12/34/2026', '7', 99)).toEqual({
      value: '12/34/2026', caret: 10,
    });
  });
});
