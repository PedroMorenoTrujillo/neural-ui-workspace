import type { TemplateRef } from '@angular/core';

export type NeuTableCoreRow = Record<string, unknown>;

export type NeuTableCoreColumnKey<T> = [keyof T] extends [never]
  ? string
  : Extract<keyof T, string>;

export type NeuTableCoreRowIdentity<T> =
  | NeuTableCoreColumnKey<T>
  | ((row: T) => unknown);

export type NeuTableCoreRowTrackBy<T> = (index: number, row: T) => unknown;

export interface NeuTableCoreColumn<
  T extends object = NeuTableCoreRow,
  K extends string = NeuTableCoreColumnKey<T>,
> {
  readonly key: K;
  readonly header: string;
  readonly value?: (row: T) => unknown;
  readonly width?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly cellClass?: string;
  readonly headerTemplate?: TemplateRef<{
    readonly $implicit: NeuTableCoreColumn<T, K>;
    readonly column: NeuTableCoreColumn<T, K>;
  }>;
  readonly cellTemplate?: TemplateRef<NeuTableCoreCellContext<T, K>>;
}

export interface NeuTableCoreStructuralContext<T extends object = NeuTableCoreRow> {
  readonly $implicit: readonly NeuTableCoreColumn<T>[];
  readonly columns: readonly NeuTableCoreColumn<T>[];
  readonly rows: readonly T[];
}

export interface NeuTableCoreBodyContext<
  T extends object = NeuTableCoreRow,
> {
  readonly $implicit: T;
  readonly row: T;
  readonly rowIndex: number;
  readonly columns: readonly NeuTableCoreColumn<T>[];
  readonly rows: readonly T[];
}

export interface NeuTableCoreCellContext<
  T extends object = NeuTableCoreRow,
  K extends string = NeuTableCoreColumnKey<T>,
> {
  readonly $implicit: unknown;
  readonly value: unknown;
  readonly row: T;
  readonly rowIndex: number;
  readonly column: NeuTableCoreColumn<T, K>;
}

export interface NeuTableCoreEmptyContext<T extends object = NeuTableCoreRow>
  extends NeuTableCoreStructuralContext<T> {
  readonly message: string;
}
