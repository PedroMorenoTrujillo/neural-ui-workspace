import type { TemplateRef } from '@angular/core';
import type {
  NeuTableCellDirective,
  NeuTableErrorDirective,
  NeuTableFooterDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
} from '../../projects/ui-core/table/next/public/public-api';
import type { AccountField, AccountRow } from './model';

type TemplateContext<T> = T extends { readonly template: TemplateRef<infer C> } ? C : never;
type HeaderContext = TemplateContext<NeuTableHeaderDirective<AccountRow, AccountField>>;
type FooterContext = TemplateContext<NeuTableFooterDirective<AccountRow, AccountField>>;
type CellContext = TemplateContext<NeuTableCellDirective<AccountRow, number, AccountField>>;
type LoadingContext = TemplateContext<NeuTableLoadingDirective>;
type ErrorContext = TemplateContext<NeuTableErrorDirective>;

const row: AccountRow = { id: 1, name: 'Ada', status: 'active', balance: 12 };
const column = { id: 'name', header: 'Name', field: 'name' as const };
const header: HeaderContext = { column, sort: [] };
const footer: FooterContext = header;
const cell: CellContext = {
  $implicit: row,
  row,
  key: 1,
  index: 0,
  selected: false,
  expanded: false,
  disabled: false,
  columnId: 'name',
  value: row.name,
};
const loading: LoadingContext = { loading: true, error: null, retry: () => undefined };
const error: ErrorContext = { loading: false, error: new Error('offline'), retry: () => undefined };

const invalidKey: CellContext = {
  ...cell,
  // @ts-expect-error K remains the numeric row-key type in cell templates.
  key: '1',
};
const invalidField: HeaderContext = {
  ...header,
  // @ts-expect-error F remains the frozen AccountField union in header templates.
  column: { id: 'age', header: 'Age', field: 'age' },
};

export const directiveContextCoverage = {
  header,
  footer,
  cell,
  loading,
  error,
  invalidKey,
  invalidField,
};
