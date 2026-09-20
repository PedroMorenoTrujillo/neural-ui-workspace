export interface NeuFieldValueColumn<T, F extends string> {
  readonly field?: F;
  readonly value?: (value: T) => unknown;
}

/** Canonical direct-field resolver. Nested dot paths and object serialization are unsupported. */
export function readNeuFieldValue<T extends object, F extends string>(
  value: T,
  column: NeuFieldValueColumn<T, F>,
): unknown {
  if (column.value) return column.value(value);
  if (!column.field || !(column.field in value)) return undefined;
  return Reflect.get(value, column.field) as unknown;
}
