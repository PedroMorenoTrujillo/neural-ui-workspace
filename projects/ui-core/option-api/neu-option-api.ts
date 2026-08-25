/** A string path rooted at a known option property. */
export type NeuOptionPath<T> = Extract<keyof T, string> | `${Extract<keyof T, string>}.${string}`;

/** A property, nested string path, or function used to read option data. */
export type NeuOptionAccessor<T, R = unknown> =
  | Exclude<keyof T, string>
  | NeuOptionPath<T>
  | ((option: T) => R);

export type NeuOptionLabelAccessor<T> = NeuOptionAccessor<T, string>;
export type NeuOptionValueAccessor<T, V> = NeuOptionAccessor<T, V>;
export type NeuOptionDisabledAccessor<T> = NeuOptionAccessor<T, boolean>;

/**
 * The value used by legacy Neural UI options. Domain models default to the
 * complete object when no explicit `optionValue` accessor is provided.
 */
export type NeuOptionValue<T> = T extends { label: string; value: infer V } ? V : T;

export type NeuOptionCompareWith<V> = (left: V, right: V) => boolean;

/**
 * Additive option identity policy. Precedence is `identityAccessor`, then
 * `compareWith`, then the resolved option value with `Object.is`.
 */
export interface NeuOptionIdentityConfig<T, V = NeuOptionValue<T>, I = unknown> {
  readonly identityAccessor?: NeuOptionAccessor<T, I> | null;
  readonly compareWith?: NeuOptionCompareWith<V> | null;
  readonly valueAccessor?: NeuOptionAccessor<T, V> | null;
}

/** Describes a typed option-group model without representing a group as `T`. */
export interface NeuOptionGroupConfig<T, G> {
  readonly labelAccessor: NeuOptionAccessor<G, unknown>;
  readonly childrenAccessor: NeuOptionAccessor<G, readonly T[]>;
  readonly disabledAccessor?: NeuOptionAccessor<G, boolean> | null;
}

/** Text matching modes reachable from Select-family text filter controls. */
export type NeuOptionFilterMatchMode =
  | 'startsWith'
  | 'contains'
  | 'notContains'
  | 'endsWith'
  | 'equals'
  | 'notEquals';

export type NeuOptionFilterStrategy = 'client' | 'server';

/** Shared filter policy. Components continue to own the current filter value. */
export interface NeuOptionFilterConfig<T> {
  readonly fields?: readonly NeuOptionAccessor<T, unknown>[];
  readonly matchMode?: NeuOptionFilterMatchMode;
  readonly locale?: string;
  readonly strategy?: NeuOptionFilterStrategy;
}

export type NeuOptionLazyRequestReason = 'initial' | 'scroll' | 'filter' | 'reset' | 'programmatic';

/**
 * A bounded lazy window. `first` is inclusive and `end` is exclusive, so
 * `count` is always `end - first`.
 */
export interface NeuOptionLazyRequest {
  readonly first: number;
  readonly end: number;
  readonly count: number;
  readonly filterValue: string;
  readonly filterFields?: readonly string[];
  readonly filterFieldsSerializable: boolean;
  readonly filterMatchMode: NeuOptionFilterMatchMode;
  readonly filterLocale?: string;
  readonly reason: NeuOptionLazyRequestReason;
  readonly requestId: number;
}

/** Shared state exposed to option templates by future Select-family adapters. */
export interface NeuOptionTemplateContext<T> {
  readonly $implicit: T;
  readonly option: T;
  readonly index: number;
  readonly logicalIndex: number;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly active: boolean;
}

/** Shared state exposed to group templates. */
export interface NeuOptionGroupTemplateContext<G> {
  readonly $implicit: G;
  readonly group: G;
  readonly index: number;
  readonly label: string;
  readonly disabled: boolean;
}

/** Shared callbacks exposed to custom filter templates. */
export interface NeuOptionFilterTemplateContext<T> {
  readonly $implicit: string;
  readonly value: string;
  readonly config: Readonly<NeuOptionFilterConfig<T>>;
  readonly filter: (value: string) => void;
  readonly reset: () => void;
}

/** Logical window state for loaders; no fabricated option value is exposed. */
export interface NeuOptionLoaderTemplateContext {
  readonly $implicit: number;
  readonly logicalIndex: number;
  readonly first: number;
  readonly end: number;
  readonly count: number;
}

type UnknownRecord = Record<PropertyKey, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function hasOwn(record: UnknownRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function readNestedPath(value: unknown, path: string): unknown {
  let current = value;

  for (const segment of path.split('.')) {
    if (!isRecord(current) || !hasOwn(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

/** Reads an option accessor without imposing a particular domain model shape. */
export function readNeuOptionAccessor<T, R>(
  option: T,
  accessor: NeuOptionAccessor<T, R>,
): R | undefined {
  if (typeof accessor === 'function') {
    return accessor(option);
  }

  if (!isRecord(option)) {
    return undefined;
  }

  if (hasOwn(option, accessor)) {
    return option[accessor] as R | undefined;
  }

  return typeof accessor === 'string'
    ? (readNestedPath(option, accessor) as R | undefined)
    : undefined;
}

/** Resolves the visible label for either a domain model or a legacy option. */
export function resolveNeuOptionLabel<T>(
  option: T,
  accessor?: NeuOptionAccessor<T> | null,
): string {
  const resolved =
    accessor != null
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
  if (accessor != null) {
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
  const resolved =
    accessor != null
      ? readNeuOptionAccessor(option, accessor)
      : isRecord(option) && hasOwn(option, 'disabled')
        ? option['disabled']
        : false;

  return Boolean(resolved);
}

/** Resolves the optional legacy flat group label used by Select. */
export function resolveNeuOptionGroup<T>(option: T): string | undefined {
  if (!isRecord(option) || !hasOwn(option, 'group')) {
    return undefined;
  }

  const group = option['group'];
  return group == null ? undefined : String(group);
}

/** Resolves a typed group label with nested or computed access. */
export function resolveNeuOptionGroupLabel<T, G>(
  group: G,
  config: NeuOptionGroupConfig<T, G>,
): string {
  const label = readNeuOptionAccessor(group, config.labelAccessor);
  return label == null ? '' : String(label);
}

/** Resolves group children without mutating the consumer collection. */
export function resolveNeuOptionGroupChildren<T, G>(
  group: G,
  config: NeuOptionGroupConfig<T, G>,
): readonly T[] {
  return readNeuOptionAccessor(group, config.childrenAccessor) ?? [];
}

/** Resolves whether a typed group is disabled. */
export function resolveNeuOptionGroupDisabled<T, G>(
  group: G,
  config: NeuOptionGroupConfig<T, G>,
): boolean {
  return config.disabledAccessor != null
    ? Boolean(readNeuOptionAccessor(group, config.disabledAccessor))
    : false;
}

/** Uses identity semantics for primitives and full-object option values. */
export function neuOptionValuesEqual<V>(left: V, right: V): boolean {
  return Object.is(left, right);
}

/** Compares logical options using the documented identity-policy precedence. */
export function neuOptionsEqual<T, V = NeuOptionValue<T>, I = unknown>(
  left: T,
  right: T,
  config: NeuOptionIdentityConfig<T, V, I> = {},
): boolean {
  if (config.identityAccessor != null) {
    return Object.is(
      readNeuOptionAccessor(left, config.identityAccessor),
      readNeuOptionAccessor(right, config.identityAccessor),
    );
  }

  const leftValue = resolveNeuOptionValue(left, config.valueAccessor);
  const rightValue = resolveNeuOptionValue(right, config.valueAccessor);

  return config.compareWith
    ? config.compareWith(leftValue, rightValue)
    : neuOptionValuesEqual(leftValue, rightValue);
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
