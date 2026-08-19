/** A property name or function used to read data from an option model. */
export type NeuOptionAccessor<T, R = unknown> = keyof T | ((option: T) => R);

export type NeuOptionLabelAccessor<T> = NeuOptionAccessor<T, string>;
export type NeuOptionValueAccessor<T, V> = NeuOptionAccessor<T, V>;
export type NeuOptionDisabledAccessor<T> = NeuOptionAccessor<T, boolean>;

/**
 * The value used by legacy Neural UI options. Domain models default to the
 * complete object when no explicit `optionValue` accessor is provided.
 */
export type NeuOptionValue<T> = T extends { label: string; value: infer V } ? V : T;

type UnknownRecord = Record<PropertyKey, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function hasOwn(record: UnknownRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/** Reads an option accessor without imposing a particular domain model shape. */
export function readNeuOptionAccessor<T, R>(
  option: T,
  accessor: NeuOptionAccessor<T, R>,
): R | undefined {
  if (typeof accessor === 'function') {
    return accessor(option);
  }

  return isRecord(option) ? (option[accessor] as R | undefined) : undefined;
}

/** Resolves the visible label for either a domain model or a legacy option. */
export function resolveNeuOptionLabel<T>(
  option: T,
  accessor?: NeuOptionAccessor<T> | null,
): string {
  const resolved = accessor
    ? readNeuOptionAccessor(option, accessor)
    : isRecord(option) && hasOwn(option, 'label')
      ? option['label']
      : option;

  return resolved == null ? '' : String(resolved);
}

/**
 * Resolves the form value. Objects with the legacy `{label, value}` contract
 * keep returning `value`; every other model returns the complete object by
 * default.
 */
export function resolveNeuOptionValue<T, V = NeuOptionValue<T>>(
  option: T,
  accessor?: NeuOptionAccessor<T, V> | null,
): V {
  if (accessor) {
    return readNeuOptionAccessor(option, accessor) as V;
  }

  if (isRecord(option) && hasOwn(option, 'label') && hasOwn(option, 'value')) {
    return option['value'] as V;
  }

  return option as unknown as V;
}

/** Resolves whether an option is disabled, preserving the legacy property. */
export function resolveNeuOptionDisabled<T>(
  option: T,
  accessor?: NeuOptionAccessor<T> | null,
): boolean {
  const resolved = accessor
    ? readNeuOptionAccessor(option, accessor)
    : isRecord(option) && hasOwn(option, 'disabled')
      ? option['disabled']
      : false;

  return Boolean(resolved);
}

/** Resolves the optional legacy group label used by Select. */
export function resolveNeuOptionGroup<T>(option: T): string | undefined {
  if (!isRecord(option) || !hasOwn(option, 'group')) {
    return undefined;
  }

  const group = option['group'];
  return group == null ? undefined : String(group);
}

/** Uses identity semantics for primitives and full-object option values. */
export function neuOptionValuesEqual<V>(left: V, right: V): boolean {
  return Object.is(left, right);
}

/** Serializes URL-compatible option values without mutating their form type. */
export function serializeNeuOptionValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return null;
  }
}

/**
 * Parsea un valor serializado de URL y lo convierte de forma explícita a tipos URL-safe
 * cuando es posible.
 */
export function deserializeNeuOptionValue(serialized: string): string | number | boolean {
  if (serialized === 'true') {
    return true;
  }

  if (serialized === 'false') {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?$/.test(serialized)) {
    const asNumber = Number(serialized);
    return Number.isNaN(asNumber) ? serialized : asNumber;
  }

  return serialized;
}
