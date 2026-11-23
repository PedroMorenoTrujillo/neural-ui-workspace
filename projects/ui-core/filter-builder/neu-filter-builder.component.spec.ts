import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NeuSelectHarness } from '@neural-ui/core/testing';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
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

  it('proposes a grouped, numeric Table filter only after applying', async () => {
    const { fixture, host, click } = create();
    const proposals: (NeuFilterExpression<'priority'> | null)[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => proposals.push(value));

    click('Add group');
    const nested = host.querySelector('fieldset fieldset') as HTMLElement;
    click('Add condition', nested);
    const nestedSelects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(NeuSelectHarness);
    await nestedSelects[1]!.selectOption('Any condition');
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

  it('selects the field and comparison from a saved expression on first render and on updates', async () => {
    const fixture = TestBed.createComponent(NeuFilterBuilderComponent<'name' | 'priority'>);
    fixture.componentRef.setInput('fields', [
      { field: 'name', label: 'Name' },
      { field: 'priority', label: 'Priority', type: 'number' },
    ]);
    fixture.componentRef.setInput('value', {
      kind: 'condition', field: 'priority', rule: 'between', value: [2, 5],
    });
    fixture.detectChanges();

    const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(NeuSelectHarness);
    const selectedOptions = () => Promise.all(selects.slice(1).map(select => select.getValueText()));
    expect(await selectedOptions()).toEqual(['Priority', 'Between']);

    fixture.componentRef.setInput('value', {
      kind: 'condition', field: 'name', rule: 'contains', value: 'Ada',
    });
    fixture.detectChanges();
    expect(await selectedOptions()).toEqual(['Name', 'Contains']);
  });

  it('emits complete edits immediately and preserves the draft when their proposal is accepted', () => {
    const { fixture, host } = create({
      kind: 'condition', field: 'priority', rule: 'between', value: [2, 5],
    });
    fixture.componentRef.setInput('commit', 'immediate');
    fixture.detectChanges();
    const proposals: (NeuFilterExpression<'priority'> | null)[] = [];
    fixture.componentInstance.valueChange.subscribe(value => {
      proposals.push(value);
      fixture.componentRef.setInput('value', value);
    });

    const input = host.querySelector('input')!;
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    type('6,');
    expect(proposals).toEqual([]);
    type('6,  8');
    expect(proposals).toEqual([{
      kind: 'group', operator: 'and', children: [
        { kind: 'condition', field: 'priority', rule: 'between', value: [6, 8] },
      ],
    }]);
    expect(input.value).toBe('6,  8');
  });

  it('renders an applied expression in readonly mode and reflects later inputs', () => {
    const { fixture, host } = create({
      kind: 'condition', field: 'priority', rule: 'equals', value: 10,
    });
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(host.querySelector('input')?.value).toBe('10');
    expect(host.querySelector('input')?.disabled).toBe(true);
    expect(host.querySelector('.neu-filter-builder__actions')).toBeNull();

    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    expect(host.querySelector('input')).toBeNull();
  });

  it('localizes Spanish controls and prunes empty nested groups without dropping conditions', () => {
    TestBed.configureTestingModule({ providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }] });
    const { fixture, host, click } = create({
      kind: 'group', operator: 'or', children: [
        { kind: 'condition', field: 'priority', rule: 'equals', value: 5 },
        { kind: 'group', operator: 'and', children: [] },
      ],
    });
    const proposals: (NeuFilterExpression<'priority'> | null)[] = [];
    fixture.componentInstance.valueChange.subscribe(value => proposals.push(value));
    expect(host.querySelector('legend')?.textContent).toBe('Filtros');
    click('Aplicar filtros');
    expect(proposals).toEqual([{
      kind: 'group', operator: 'or', children: [
        { kind: 'condition', field: 'priority', rule: 'equals', value: 5 },
      ],
    }]);
  });

  it('replaces field-specific comparisons and emits text lists and valueless rules', async () => {
    const { fixture, host, click } = create({
      kind: 'condition', field: 'priority', rule: 'equals', value: 5,
    });
    fixture.componentRef.setInput('fields', [
      { field: 'priority', label: 'Priority', type: 'number' },
      { field: 'name', label: 'Name', rules: ['contains', 'in', 'isNull'] },
    ]);
    fixture.detectChanges();
    const proposals: unknown[] = [];
    fixture.componentInstance.valueChange.subscribe(value => proposals.push(value));
    const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(NeuSelectHarness);
    await selects[1]!.selectOption('Name');
    expect(await selects[2]!.getValueText()).toBe('Contains');
    const text = host.querySelector('input')!;
    text.value = 'Ada';
    text.dispatchEvent(new Event('input'));
    click('Apply filters');
    expect(proposals.at(-1)).toEqual({ kind: 'group', operator: 'and', children: [
      { kind: 'condition', field: 'name', rule: 'contains', value: 'Ada' },
    ] });
    await selects[2]!.selectOption('In list');
    const list = host.querySelector('input')!;
    list.value = 'Ada, Grace';
    list.dispatchEvent(new Event('input'));
    click('Apply filters');
    expect(proposals.at(-1)).toEqual({ kind: 'group', operator: 'and', children: [
      { kind: 'condition', field: 'name', rule: 'in', value: ['Ada', 'Grace'] },
    ] });
    await selects[2]!.selectOption('Is null');
    expect(host.querySelector('input')).toBeNull();
    click('Apply filters');
    expect(proposals.at(-1)).toEqual({ kind: 'group', operator: 'and', children: [
      { kind: 'condition', field: 'name', rule: 'isNull', value: null },
    ] });
  });

  it('returns focus to the parent actions when removing a nested group from its header', () => {
    const { fixture, host, click } = create();
    click('Add group');
    const nested = host.querySelector('fieldset fieldset')!;
    const parentAdd = host.querySelector('fieldset')!.querySelector<HTMLButtonElement>(
      ':scope > .neu-filter-builder__actions > button',
    )!;
    nested.querySelector<HTMLButtonElement>('button[aria-label^="Remove Filter group"]')!.click();
    fixture.detectChanges();

    expect(host.contains(nested)).toBe(false);
    expect(document.activeElement).toBe(parentAdd);
  });

  it('restores keyboard focus after removing the last condition and emits an empty filter', () => {
    const { fixture, host, click } = create({
      kind: 'condition', field: 'priority', rule: 'equals', value: 5,
    });
    const proposals: unknown[] = [];
    fixture.componentInstance.valueChange.subscribe(value => proposals.push(value));
    const remove = host.querySelector<HTMLButtonElement>('[aria-label="Remove Field 1"]')!;
    remove.focus();
    remove.click();
    fixture.detectChanges();
    expect(host.querySelector('input')).toBeNull();
    expect(document.activeElement?.textContent?.trim()).toBe('Add condition');
    click('Apply filters');
    expect(proposals).toEqual([null]);
  });
});
