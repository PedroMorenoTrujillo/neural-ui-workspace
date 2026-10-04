import type { NeuTableLabels } from '../../public/neu-table.types';

/** Only labels needed by the initial renderer; optional controls own their remaining messages. */
export const tableRendererMessages = {
  stateAnnouncement: '{count} rows; page {page}; {selected} selected; sort: {sort}',
  page: 'Page',
  of: 'of',
  advancedFilters: 'Advanced filters',
  hiddenColumns: 'Hidden columns',
  showColumn: 'Show {column}',
  expansion: 'Expansion',
  edit: 'Edit {column}',
  selectAll: 'Select all rows',
  filterColumn: 'Filter {column}',
  collapseRow: 'Collapse row {key}',
  expandRow: 'Expand row {key}',
  selectRow: 'Select row {key}',
  sortAction: 'Sort {column}; current {current}; activate for {next}',
  ascending: 'ascending',
  descending: 'descending',
  none: 'none',
};

export type TableRendererMessage = keyof typeof tableRendererMessages;

export function formatTableMessage(
  message: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return message.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

export function tableRendererMessage(
  overrides: NeuTableLabels['messages'],
  key: TableRendererMessage,
  values: Readonly<Record<string, string | number>> = {},
): string {
  return formatTableMessage(overrides?.[key] ?? tableRendererMessages[key], values);
}
