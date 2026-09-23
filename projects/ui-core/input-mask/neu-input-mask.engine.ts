/** Private, framework-free editing model for the existing 9/A/* mask grammar. */
export type MaskToken = '9' | 'A' | '*';

export type MaskUnit =
  | { readonly kind: 'literal'; readonly character: string; readonly maskIndex: number }
  | {
      readonly kind: 'editable';
      readonly token: MaskToken;
      readonly maskIndex: number;
      readonly editableIndex: number;
    };

export interface CompiledMask {
  readonly units: readonly MaskUnit[];
  readonly editable: readonly Extract<MaskUnit, { kind: 'editable' }>[];
}

export interface MaskEdit {
  readonly value: string;
  readonly caret: number;
}

function isToken(character: string): character is MaskToken {
  return character === '9' || character === 'A' || character === '*';
}

export function accepts(token: MaskToken, character: string): boolean {
  if (token === '9') return /^[0-9]$/.test(character);
  if (token === 'A') return /^[a-z]$/i.test(character);
  return /^[a-z0-9]$/i.test(character);
}

export function compileMask(mask: string): CompiledMask {
  const units: MaskUnit[] = [];
  const editable: Extract<MaskUnit, { kind: 'editable' }>[] = [];
  let maskIndex = 0;
  for (const character of mask) {
    if (isToken(character)) {
      const slot = { kind: 'editable' as const, token: character, maskIndex, editableIndex: editable.length };
      units.push(slot);
      editable.push(slot);
    } else {
      units.push({ kind: 'literal', character, maskIndex });
    }
    maskIndex++;
  }
  return { units, editable };
}

function cellsFromDisplay(mask: CompiledMask, display: string): (string | undefined)[] {
  const cells: (string | undefined)[] = Array(mask.editable.length).fill(undefined);
  let unitIndex = 0;
  for (const character of display) {
    let consumedLiteral = false;
    while (unitIndex < mask.units.length && mask.units[unitIndex].kind === 'literal') {
      const literal = mask.units[unitIndex] as Extract<MaskUnit, { kind: 'literal' }>;
      unitIndex++;
      if (literal.character === character) {
        consumedLiteral = true;
        break;
      }
    }
    if (consumedLiteral) continue;
    const unit = mask.units[unitIndex];
    if (!unit) break;
    if (unit.kind === 'editable' && accepts(unit.token, character)) {
      cells[unit.editableIndex] = character;
      unitIndex++;
      continue;
    }
    // A separator in an incomplete value denotes the end of that segment.
    if (unit.kind === 'editable') {
      const next = mask.units[unitIndex + 1];
      if (next?.kind === 'literal' && next.character === character) unitIndex += 2;
    }
  }
  return cells;
}

interface Projection {
  readonly value: string;
  readonly starts: readonly number[];
  readonly ends: readonly number[];
}

function project(mask: CompiledMask, cells: readonly (string | undefined)[]): Projection {
  const starts: number[] = [];
  const ends: number[] = [];
  let value = '';
  let nextFilled = -1;
  for (let index = cells.length - 1; index >= 0; index--) {
    if (cells[index] !== undefined) {
      nextFilled = index;
      break;
    }
  }
  let editableIndex = 0;
  for (const unit of mask.units) {
    if (unit.kind === 'literal') {
      if (nextFilled >= editableIndex) value += unit.character;
      continue;
    }
    starts[editableIndex] = value.length;
    value += cells[editableIndex] ?? '';
    ends[editableIndex] = value.length;
    editableIndex++;
  }
  return { value, starts, ends };
}

function clamp(position: number, length: number): number {
  return Math.min(Math.max(0, position), length);
}

function selection(start: number, end: number, length: number): readonly [number, number] {
  const left = clamp(start, length);
  const right = clamp(end, length);
  return left <= right ? [left, right] : [right, left];
}

function insertionIndex(projection: Projection, position: number): number {
  const index = projection.starts.findIndex((start) => start >= position);
  return index < 0 ? projection.starts.length : index;
}

function selectedIndices(projection: Projection, start: number, end: number): number[] {
  const selected: number[] = [];
  if (start === end) return selected;
  for (let index = 0; index < projection.starts.length; index++) {
    if (projection.ends[index] > start && projection.starts[index] < end) selected.push(index);
  }
  return selected;
}

function caretAt(projection: Projection, editableIndex: number): number {
  return projection.starts[editableIndex] ?? projection.value.length;
}

/** Interpret browser/autofill text without inventing a second applied value owner. */
export function reconcileInput(mask: CompiledMask, display: string, caret: number): MaskEdit {
  if (mask.units.length === 0) return { value: display, caret: clamp(caret, display.length) };
  const before = cellsFromDisplay(mask, display.slice(0, caret));
  const cells = cellsFromDisplay(mask, display);
  const rendered = project(mask, cells);
  const filledBefore = before.filter((character) => character !== undefined).length;
  return { value: rendered.value, caret: caretAt(rendered, filledBefore) };
}

export function insertIntoMask(
  mask: CompiledMask,
  current: string,
  text: string,
  start: number,
  end = start,
): MaskEdit {
  const [left, right] = selection(start, end, current.length);
  if (mask.units.length === 0) {
    const value = current.slice(0, left) + text + current.slice(right);
    return { value, caret: left + text.length };
  }
  const cells = cellsFromDisplay(mask, current);
  const original = project(mask, cells);
  const selected = selectedIndices(original, left, right);
  for (const index of selected) cells[index] = undefined;
  let index = selected[0] ?? insertionIndex(original, left);
  for (const character of text) {
    const slot = mask.editable[index];
    if (!slot) break;
    const preceding = mask.units[slot.maskIndex - 1];
    if (preceding?.kind === 'literal' && preceding.character === character) continue;
    if (!accepts(slot.token, character)) continue;
    cells[index] = character;
    index++;
  }
  const rendered = project(mask, cells);
  return { value: rendered.value, caret: caretAt(rendered, index) };
}

export function deleteFromMask(
  mask: CompiledMask,
  current: string,
  start: number,
  end: number,
  direction: 'backward' | 'forward',
): MaskEdit {
  const [left, right] = selection(start, end, current.length);
  if (mask.units.length === 0) {
    const from = left === right && direction === 'backward' ? Math.max(0, left - 1) : left;
    const to = left === right && direction === 'forward' ? Math.min(current.length, right + 1) : right;
    return { value: current.slice(0, from) + current.slice(to), caret: from };
  }
  const cells = cellsFromDisplay(mask, current);
  const original = project(mask, cells);
  let selected = selectedIndices(original, left, right);
  if (!selected.length && left === right) {
    if (direction === 'backward') {
      for (let index = cells.length - 1; index >= 0; index--) {
        if (cells[index] !== undefined && original.ends[index] <= left) {
          selected = [index];
          break;
        }
      }
    } else {
      const index = cells.findIndex((character, position) =>
        character !== undefined && original.starts[position] >= left,
      );
      if (index >= 0) selected = [index];
    }
  }
  if (!selected.length) return { value: current, caret: left };
  for (const index of selected) cells[index] = undefined;
  const rendered = project(mask, cells);
  return { value: rendered.value, caret: caretAt(rendered, selected[0]) };
}
