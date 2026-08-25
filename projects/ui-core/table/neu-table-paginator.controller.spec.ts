import { NeuTablePaginatorController } from './neu-table-paginator.controller';

describe('NeuTablePaginatorController', () => {
  const controller = new NeuTablePaginatorController();

  it('creates immutable complete events and clamps the requested page', () => {
    const event = controller.event({ page: 99, pageSize: 10, totalRecords: 23 });
    expect(event).toEqual({ page: 3, pageCount: 3, first: 20, last: 23, rows: 10, totalRecords: 23 });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it('centres a configurable page-link window', () => {
    expect(controller.pages({ page: 6, pageSize: 10, totalRecords: 100 }, 3)).toEqual([5, 6, 7]);
  });

  it('formats every supported current-report token', () => {
    expect(
      controller.report(
        { page: 2, pageSize: 10, totalRecords: 23 },
        '{first}-{last}/{totalRecords}; {currentPage}/{totalPages}; {rows}',
      ),
    ).toBe('11-20/23; 2/3; 10');
    expect(
      controller.report(
        { page: -1, pageSize: 0, totalRecords: -3 },
        '{first}-{last}/{totalRecords}; {currentPage}/{totalPages}; {rows}',
      ),
    ).toBe('0-0/0; 1/1; 1');
    expect(controller.pages({ page: 1, pageSize: 10, totalRecords: 0 }, 0)).toEqual([1]);
  });
});
