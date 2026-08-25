import type { NeuTablePageEvent } from './neu-table.types';

export interface NeuTablePaginatorState {
  readonly page: number;
  readonly pageSize: number;
  readonly totalRecords: number;
}

export class NeuTablePaginatorController {
  event(state: NeuTablePaginatorState): NeuTablePageEvent {
    const rows = Math.max(1, Math.floor(state.pageSize));
    const totalRecords = Math.max(0, Math.floor(state.totalRecords));
    const pageCount = Math.max(1, Math.ceil(totalRecords / rows));
    const page = Math.max(1, Math.min(Math.floor(state.page), pageCount));
    const first = Math.min(totalRecords, (page - 1) * rows);
    const last = Math.min(totalRecords, first + rows);
    return Object.freeze({ page, pageCount, first, last, rows, totalRecords });
  }

  pages(state: NeuTablePaginatorState, pageLinkSize: number): readonly number[] {
    const event = this.event(state);
    const size = Math.max(1, Math.floor(pageLinkSize));
    const start = Math.max(
      1,
      Math.min(event.page - Math.floor(size / 2), Math.max(1, event.pageCount - size + 1)),
    );
    return Object.freeze(
      Array.from({ length: Math.min(size, event.pageCount) }, (_, index) => start + index),
    );
  }

  report(state: NeuTablePaginatorState, template: string): string {
    const values = this.event(state);
    const tokens: Readonly<Record<string, number>> = {
      currentPage: values.page,
      totalPages: values.pageCount,
      rows: values.rows,
      first: values.totalRecords === 0 ? 0 : values.first + 1,
      last: values.last,
      totalRecords: values.totalRecords,
    };
    return template.replace(
      /\{(currentPage|totalPages|rows|first|last|totalRecords)\}/g,
      (_, key: string) => String(tokens[key]),
    );
  }
}
