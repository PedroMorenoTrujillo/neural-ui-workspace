import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableAdvancedFilterBuilderComponent } from './internal/features/advanced-filters/neu-table-advanced-filter-builder.component';
import type { NeuFilterExpression, NeuTableColumn } from './public/neu-table.types';

interface Row {
  readonly name: string;
  readonly score: number;
}
type Field = 'name' | 'score';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name', filter: {
    field: 'name', rules: ['contains', 'equals', 'isNull'], defaultRule: 'contains',
  } },
  { id: 'score', header: 'Score', field: 'score', filter: {
    field: 'score', rules: ['greaterThan', 'equals'], defaultRule: 'greaterThan',
  } },
];

function create(
  availableColumns: readonly NeuTableColumn<Row, Field>[] = columns,
  filters: NeuFilterExpression<Field> | null = null,
) {
  const fixture = TestBed.createComponent(NeuTableAdvancedFilterBuilderComponent<Row, Field>);
  const applied = vi.fn<(next: NeuFilterExpression<Field>) => void>();
  const closed = vi.fn();
  fixture.componentRef.setInput('columns', availableColumns);
  fixture.componentRef.setInput('filters', filters);
  fixture.componentRef.setInput('applyFilters', applied);
  fixture.componentRef.setInput('close', closed);
  fixture.detectChanges();
  return { fixture, applied, closed };
}

function change(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('NeuTable advanced filter builder interactions', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('builds an OR filter from field, rule and value controls', () => {
    const existing: NeuFilterExpression<Field> = {
      kind: 'condition', field: 'name', rule: 'contains', value: 'Ada',
    };
    const { fixture, applied, closed } = create(columns, existing);
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    change(selects[0], 'score');
    fixture.detectChanges();
    expect(selects[1].value).toBe('greaterThan');
    const value = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    value.value = '10';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    change(selects[2], 'or');
    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();

    expect(applied).toHaveBeenCalledExactlyOnceWith({
      kind: 'group', operator: 'or', children: [
        existing, { kind: 'condition', field: 'score', rule: 'greaterThan', value: '10' },
      ],
    });
    expect(closed).toHaveBeenCalledOnce();
  });

  it('switches to a valueless rule and ignores unsupported control values', () => {
    const { fixture, applied } = create();
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    change(selects[1], 'not-a-rule');
    change(selects[2], 'xor');
    fixture.detectChanges();
    expect(selects[1].value).toBe('');
    change(selects[1], 'isNull');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(applied).toHaveBeenCalledExactlyOnceWith({
      kind: 'condition', field: 'name', rule: 'isNull', value: null,
    });
  });

  it('does not apply without a filterable field and closes on Cancel or Escape', () => {
    const { fixture, applied, closed } = create([
      { id: 'name', header: 'Name', field: 'name' },
    ]);
    (fixture.nativeElement.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(applied).not.toHaveBeenCalled();
    (fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.nativeElement.querySelector('section').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
