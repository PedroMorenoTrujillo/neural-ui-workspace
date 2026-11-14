import { TestBed } from '@angular/core/testing';
import type { NeuFilterExpression } from '@neural-ui/core/table';
import { NeuFilterBuilderComponent } from './neu-filter-builder.component';

describe('NeuFilterBuilderComponent', () => {
  function create(value: NeuFilterExpression<'priority'> | null = null) {
    const fixture = TestBed.createComponent(NeuFilterBuilderComponent<'priority'>);
    fixture.componentRef.setInput('fields', [
      { field: 'priority', label: 'Priority', type: 'number' },
    ]);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const click = (name: string, scope = host) => {
      const button = [...scope.querySelectorAll('button')].find(
        (item) => item.textContent?.trim() === name,
      );
      if (!button) throw new Error('Missing button: ' + name);
      button.click();
      fixture.detectChanges();
    };
    return { fixture, host, click };
  }

  it('proposes a grouped, numeric Table filter only after applying', () => {
    const { fixture, host, click } = create();
    const proposals: (NeuFilterExpression<'priority'> | null)[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => proposals.push(value));

    click('Add group');
    const nested = host.querySelector('fieldset fieldset') as HTMLElement;
    click('Add condition', nested);
    const operator = nested.querySelector('select')!;
    operator.value = 'or';
    operator.dispatchEvent(new Event('change'));
    const input = nested.querySelector('input')!;
    input.value = '2.5';
    input.dispatchEvent(new Event('input'));
    expect(proposals).toEqual([]);
    expect(fixture.componentInstance.value()).toBeNull();

    click('Apply filters');
    expect(proposals).toEqual([{
      kind: 'group', operator: 'and', children: [{
        kind: 'group', operator: 'or', children: [
          { kind: 'condition', field: 'priority', rule: 'equals', value: 2.5 },
        ],
      }],
    }]);
    expect(fixture.componentInstance.value()).toBeNull();
    click('Reset draft');
    expect(host.querySelector('fieldset fieldset')).toBeNull();
  });

  it('blocks an incomplete numeric range and preserves a valid typed range', () => {
    const { fixture, host, click } = create({
      kind: 'condition', field: 'priority', rule: 'between', value: [1, 3],
    });
    const proposals: (NeuFilterExpression<'priority'> | null)[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => proposals.push(value));
    const input = host.querySelector('input')!;
    input.value = '2, letters';
    input.dispatchEvent(new Event('input'));
    click('Apply filters');
    expect(host.querySelector('[role=status]')?.textContent).toContain('Complete the comparison');
    expect(proposals).toEqual([]);

    input.value = '2, 4.5';
    input.dispatchEvent(new Event('input'));
    click('Apply filters');
    expect(proposals).toEqual([{
      kind: 'group', operator: 'and', children: [
        { kind: 'condition', field: 'priority', rule: 'between', value: [2, 4.5] },
      ],
    }]);
  });

  it('renders an applied expression in readonly mode and reflects later inputs', () => {
    const { fixture, host } = create({
      kind: 'condition', field: 'priority', rule: 'equals', value: 10,
    });
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(host.querySelector('input')?.value).toBe('10');
    expect(host.querySelector('input')?.disabled).toBe(true);
    expect(host.querySelector('button')).toBeNull();

    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    expect(host.querySelector('input')).toBeNull();
  });
});
