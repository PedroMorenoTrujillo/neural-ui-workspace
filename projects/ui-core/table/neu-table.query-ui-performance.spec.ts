import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { runNeuTableClientPipeline } from './internal/client-pipeline/neu-table-client-pipeline';
import {
  proposeNeuTableFilters,
  proposeNeuTablePage,
  proposeNeuTablePageSize,
  proposeNeuTableSearch,
  proposeNeuTableSort,
  setNeuTableFilterCondition,
} from './internal/query-ui/neu-table-query-transitions';
import type {
  NeuFilterExpression,
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTableQuery,
  NeuTableSortOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
}
type Field = 'id' | 'name' | 'score';

function summarize(operation: () => unknown) {
  for (let index = 0; index < 5; index += 1) operation();
  const samples = Array.from({ length: 25 }, () => {
    const started = performance.now();
    operation();
    return performance.now() - started;
  }).sort((left, right) => left - right);
  const percentile = (ratio: number) =>
    Number(samples[Math.max(0, Math.ceil(samples.length * ratio) - 1)]!.toFixed(4));
  return { samples: samples.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
}

describe('NeuTable 2 N2-011E query UI performance', () => {
  it('captures proposal costs, the 100-row render pipeline and acceptance boundary', () => {
    const rows = Array.from({ length: 100 }, (_, id): Row => ({
      id,
      name: `Row ${String(id).padStart(3, '0')}`,
      score: (id * 17) % 101,
    }));
    const columns: readonly NeuTableColumn<Row, Field>[] = [
      { id: 'id', header: 'ID', field: 'id', sort: { field: 'id' } },
      {
        id: 'name',
        header: 'Name',
        field: 'name',
        sort: { field: 'name' },
        filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
      },
      { id: 'score', header: 'Score', field: 'score', sort: { field: 'score' } },
    ];
    const sortOptions: NeuTableSortOptions = {
      mode: 'multiple',
      removable: true,
      defaultDirection: 'asc',
      resetPageOnChange: true,
    };
    const filterOptions: NeuTableFilterOptions<Row, Field> = {
      surfaces: ['row', 'menu', 'builder'],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'explicit',
    };
    const query: NeuTableQuery<Field> = {
      page: 2,
      pageSize: 10,
      search: 'row',
      sort: [
        { field: 'score', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
      filters: { kind: 'condition', field: 'score', rule: 'greaterThan', value: 10 },
    };
    let nested: NeuFilterExpression<Field> = query.filters!;
    for (let index = 0; index < 40; index += 1) {
      nested = {
        kind: 'group',
        operator: index % 2 === 0 ? 'and' : 'or',
        children: [nested, { kind: 'condition', field: 'id', rule: 'notEquals', value: index }],
      };
    }
    const renderPipeline = (nextQuery: NeuTableQuery<Field>) =>
      runNeuTableClientPipeline({
        data: rows,
        dataMode: 'client',
        columns,
        query: nextQuery,
        rowKey: (row) => row.id,
        rowOptions: { reorderable: false },
        sortOptions,
        filterOptions,
        paginationOptions: {
          enabled: true,
          pageSizeOptions: [10, 25, 50],
          position: 'bottom',
          report: 'range',
          showPageJump: true,
        },
      });

    const applied = signal(query);
    const draft = signal('');
    let pipelineEvaluations = 0;
    const rendered = computed(() => {
      pipelineEvaluations += 1;
      return renderPipeline(applied());
    });
    rendered();
    draft.set('rejected');
    proposeNeuTableSearch({ query: applied(), search: draft(), sortOptions });
    rendered();
    const accepted = proposeNeuTablePage({ query: applied(), page: 3, sortOptions })!;
    applied.set(accepted);
    rendered();

    const metrics = {
      sortProposal: summarize(() =>
        proposeNeuTableSort({ query, field: 'id', sortOptions, additive: false }),
      ),
      multiSortProposal: summarize(() =>
        proposeNeuTableSort({ query, field: 'id', sortOptions, additive: true }),
      ),
      searchProposal: summarize(() =>
        proposeNeuTableSearch({ query, search: 'changed', sortOptions }),
      ),
      simpleFilterTransform: summarize(() =>
        setNeuTableFilterCondition(query.filters, {
          kind: 'condition',
          field: 'score',
          rule: 'lessThan',
          value: 90,
        }),
      ),
      nestedFilterTransform: summarize(() =>
        proposeNeuTableFilters<Field, Row>({
          query: { ...query, filters: nested },
          filters: setNeuTableFilterCondition(nested, {
            kind: 'condition',
            field: 'score',
            rule: 'lessThan',
            value: 90,
          }),
          sortOptions,
          filterOptions,
        }),
      ),
      pageProposal: summarize(() => proposeNeuTablePage({ query, page: 7, sortOptions })),
      pageSizeProposal: summarize(() =>
        proposeNeuTablePageSize({
          query,
          pageSize: 25,
          allowedPageSizes: [10, 25, 50],
          sortOptions,
        }),
      ),
      sameQuerySuppression: summarize(() =>
        proposeNeuTablePage({ query, page: query.page, sortOptions }),
      ),
      renderPipeline100: summarize(() => renderPipeline(query)),
      queryReplacement100: summarize(() => renderPipeline({ ...query, page: 3 })),
      pipelineEvaluations,
    };
    expect(pipelineEvaluations).toBe(2);
    const payload = `N2_TABLE_QUERY_UI_PERFORMANCE:${JSON.stringify(metrics)}\n`;
    const runtime = globalThis as typeof globalThis & {
      readonly process?: { readonly stdout?: { write(value: string): void } };
    };
    runtime.process?.stdout?.write(payload);
  });
});
