declare function model<T>(initial: T): unknown;
interface FormValueControl<T> { readonly value: unknown }

export class NumberModel implements FormValueControl<number> {
  readonly value = model<number>(0);
}

export class StringModel implements FormValueControl<string> {
  readonly value = model<string>('');
}

export class NullableModel implements FormValueControl<number | null> {
  readonly value = model<number | null>(null);
}

export class BoundedRangeModel<V extends number | readonly [number, number] = number>
  implements FormValueControl<V> {
  readonly value = model<V>(0 as V);
}

export class AnyModel implements FormValueControl<any> {
  readonly value = model<any>(0);
}

export class UnconstrainedModel<T> implements FormValueControl<T> {
  readonly value = model<T>(null as T);
}

export class AnyConstraintModel<T extends any> implements FormValueControl<T> {
  readonly value = model<T>(null as T);
}

export class UnknownConstraintModel<T extends unknown> implements FormValueControl<T> {
  readonly value = model<T>(null as T);
}

export class NestedAnyConstraintModel<T extends readonly [number, any]>
  implements FormValueControl<T> {
  readonly value = model<T>(null as T);
}

export class BroadObjectConstraintModel<T extends object> implements FormValueControl<T> {
  readonly value = model<T>(null as T);
}
