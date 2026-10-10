import type { TemplateRef } from '@angular/core';
import type {
  NeuTableCellDirective,
  NeuTableErrorDirective,
  NeuTableFooterDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  NeuTableFilterDirective,
  NeuTablePaginatorDirective,
} from '@neural-ui/core/table';
import type { AccountField, AccountRow } from './model';

type TemplateContext<T> = T extends { readonly template: TemplateRef<infer C> } ? C : never;
type HeaderContext = TemplateContext<NeuTableHeaderDirective<AccountRow, AccountField>>;
type FooterContext = TemplateContext<NeuTableFooterDirective<AccountRow, AccountField>>;
type CellContext = TemplateContext<NeuTableCellDirective<AccountRow, number, AccountField>>;
type LoadingContext = TemplateContext<NeuTableLoadingDirective>;
type ErrorContext = TemplateContext<NeuTableErrorDirective>;
type FilterContext = TemplateContext<NeuTableFilterDirective<AccountRow, AccountField>>;
type PaginatorContext = TemplateContext<NeuTablePaginatorDirective>;

const row: AccountRow = { id: 1, name: 'Ada', status: 'active', balance: 12 };
const column = { id: 'name', header: 'Name', field: 'name' as const };
const header: HeaderContext = { column, sort: [] };
const footer: FooterContext = header;
const filter: FilterContext = {
  ...header,
  value: 'Ada',
  rule: 'contains',
  apply: () => undefined,
  clear: () => undefined,
};
const paginator: PaginatorContext = {
  page: 0,
  pageSize: 10,
  humanPage: 1,
  pageCount: null,
  total: null,
  rangeStart: 1,
  rangeEnd: 10,
  canFirst: false,
  canPrevious: false,
  canNext: true,
  canLast: false,
  pageSizeOptions: [10, 20],
  changePage: () => undefined,
  changePageSize: () => undefined,
};
// @ts-expect-error Pagination receives a numeric zero-based page, not a row or a string.
paginator.changePage('2');
// @ts-expect-error Paginator context does not expose row data.
paginator.row;
// @ts-expect-error Filter rules are a closed public contract.
filter.apply('Ada', 'matchesAnything');
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
  filter,
  paginator,
  header,
  footer,
  cell,
  loading,
  error,
  invalidKey,
  invalidField,
};
