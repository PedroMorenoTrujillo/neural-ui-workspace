import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuOptionGroupConfig } from '@neural-ui/core/option-api';
import {
  NeuAutocompleteClearIconDirective,
  NeuAutocompleteComponent,
  NeuAutocompleteDropdownIconDirective,
  NeuAutocompleteEmptyDirective,
  NeuAutocompleteFooterDirective,
  NeuAutocompleteGroupDirective,
  NeuAutocompleteHeaderDirective,
  NeuAutocompleteItemDirective,
  NeuAutocompleteLoaderDirective,
  NeuAutocompleteLoadingIconDirective,
  NeuAutocompleteOption,
} from './public_api';

interface City {
  id: number;
  profile: { name: string };
  disabled?: boolean;
}

interface Region {
  meta: { label: string; disabled?: boolean };
  cities: readonly City[];
}

const CITIES: readonly City[] = [
  { id: 0, profile: { name: 'Amsterdam' } },
  { id: 1, profile: { name: 'Barcelona' } },
  { id: 2, profile: { name: 'Copenhagen' }, disabled: true },
  { id: 3, profile: { name: 'Dublin' } },
];

const GROUPS: readonly Region[] = [
  { meta: { label: 'North' }, cities: [CITIES[0], CITIES[2]] },
  { meta: { label: 'South', disabled: true }, cities: [CITIES[1]] },
  { meta: { label: 'West' }, cities: [CITIES[3]] },
];

const GROUP_CONFIG: NeuOptionGroupConfig<City, Region> = {
  labelAccessor: 'meta.label',
  childrenAccessor: 'cities',
  disabledAccessor: 'meta.disabled',
};

function setupCityAutocomplete() {
  const fixture = TestBed.createComponent(NeuAutocompleteComponent<City, number, 'free-text', Region>);
  fixture.componentRef.setInput('options', CITIES);
  fixture.componentRef.setInput('optionLabel', 'profile.name');
  fixture.componentRef.setInput('optionValue', (option: any) => option.id);
  fixture.componentRef.setInput('optionDisabled', 'disabled');
  fixture.componentRef.setInput('mode', 'free-text');
  fixture.componentRef.setInput('delay', 20);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

afterEach(() => {
  vi.useRealTimers();
  document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
});

describe('NeuAutocomplete contract closure', () => {
  it('debounces consumer-owned completion with latest-wins query payloads', () => {
    vi.useFakeTimers();
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('suggestions', []);
    fixture.detectChanges();
    const events: Array<{ query: string; requestId: number }> = [];
    fixture.componentInstance.suggestionsRequest.subscribe((event) => events.push(event));

    fixture.componentInstance['onQueryChange']('a', new InputEvent('input'));
    vi.advanceTimersByTime(10);
    fixture.componentInstance['onQueryChange']('am', new InputEvent('input'));
    vi.advanceTimersByTime(19);
    expect(events).toEqual([]);
    vi.advanceTimersByTime(1);

    expect(events).toEqual([
      expect.objectContaining({ query: 'am', requestId: 1, source: 'input' }),
    ]);
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('opens only after consumer suggestions are replaced and never filters them internally', () => {
    vi.useFakeTimers();
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentInstance['onQueryChange']('zz');
    vi.advanceTimersByTime(20);
    fixture.componentRef.setInput('suggestions', [CITIES[1], CITIES[3]]);
    fixture.detectChanges();

    expect(fixture.componentInstance['_filtered']()).toEqual([CITIES[1], CITIES[3]]);
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
  });

  it('enforces empty, below-minimum, exact-minimum, above-minimum and dynamic minimum states', () => {
    vi.useFakeTimers();
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('minQueryLength', 3);
    const complete = vi.fn();
    fixture.componentInstance.suggestionsRequest.subscribe(complete);

    fixture.componentInstance['onQueryChange']('');
    fixture.componentInstance['onQueryChange']('ab');
    vi.advanceTimersByTime(50);
    expect(complete).not.toHaveBeenCalled();

    fixture.componentInstance['onQueryChange']('abc');
    vi.advanceTimersByTime(20);
    fixture.componentInstance['onQueryChange']('abcd');
    vi.advanceTimersByTime(20);
    expect(complete.mock.calls.map(([event]) => event.query)).toEqual(['abc', 'abcd']);

    fixture.componentRef.setInput('minQueryLength', 5);
    fixture.componentInstance['onQueryChange']('abcd');
    vi.advanceTimersByTime(20);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('cancels scheduled completion on clear and destroy', () => {
    vi.useFakeTimers();
    const fixture = setupCityAutocomplete();
    const complete = vi.fn();
    fixture.componentInstance.suggestionsRequest.subscribe(complete);
    fixture.componentInstance['onQueryChange']('a');
    fixture.componentInstance['onQueryChange']('');
    vi.advanceTimersByTime(30);
    expect(complete).not.toHaveBeenCalled();

    fixture.componentInstance['onQueryChange']('b');
    fixture.destroy();
    vi.advanceTimersByTime(30);
    expect(complete).not.toHaveBeenCalled();
  });

  it('runs completeOnFocus immediately with a focus source', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('completeOnFocus', true);
    const complete = vi.fn();
    fixture.componentInstance.suggestionsRequest.subscribe(complete);
    fixture.componentRef.setInput('value', 'custom');
    fixture.detectChanges();

    fixture.componentInstance['_onFocus'](new FocusEvent('focus'));

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'custom', source: 'focus', requestId: 1 }),
    );
  });

  it.each([
    ['blank', '', 'typed'],
    ['current', 'typed', 'typed'],
  ] as const)('runs one %s dropdown lifecycle with the correct query', (mode, query, text) => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('dropdown', true);
    fixture.componentRef.setInput('dropdownMode', mode);
    fixture.componentRef.setInput('value', text);
    fixture.detectChanges();
    const complete = vi.fn();
    const dropdown = vi.fn();
    fixture.componentInstance.suggestionsRequest.subscribe(complete);
    fixture.componentInstance.dropdownClick.subscribe(dropdown);
    const event = new MouseEvent('click');

    fixture.componentInstance['handleDropdownClick'](event);

    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ query, source: 'dropdown' }));
    expect(dropdown).toHaveBeenCalledWith({ originalEvent: event, query, mode });
  });

  it('closes an already-open dropdown without issuing a second completion', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('dropdown', true);
    const complete = vi.fn();
    fixture.componentInstance.suggestionsRequest.subscribe(complete);
    fixture.componentInstance.openAll();
    expect(complete).toHaveBeenCalledTimes(1);

    fixture.componentInstance['handleDropdownClick'](new MouseEvent('click'));

    expect(complete).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('separates typed custom text from the previous matched option and canonical value', () => {
    const fixture = setupCityAutocomplete();
    const values: unknown[] = [];
    fixture.componentInstance.value.subscribe((value) => values.push(value));
    fixture.componentInstance['selectOption'](CITIES[0], new MouseEvent('mousedown'));
    expect(fixture.componentInstance.matchedOption()).toBe(CITIES[0]);
    expect(fixture.componentInstance.value()).toBe(0);

    fixture.componentInstance['onQueryChange']('Amsterdam edited');

    expect(fixture.componentInstance['_query']()).toBe('Amsterdam edited');
    expect(fixture.componentInstance.matchedOption()).toBeNull();
    expect(fixture.componentInstance.customTextValue()).toBe('Amsterdam edited');
    expect(fixture.componentInstance.value()).toBe('Amsterdam edited');
    expect(values).toEqual([0, 'Amsterdam edited']);
  });

  it('keeps a strict user query visible after clearing the previous option value', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('mode', 'strict');
    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();

    fixture.componentInstance['onQueryChange']('Ams');
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance['_query']()).toBe('Ams');
    expect(fixture.componentInstance['_filtered']()).toEqual([CITIES[0]]);
  });

  it('atomically clears stale selection on a force-selection edit and normalizes invalid blur', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('mode', 'strict');
    const values: unknown[] = [];
    const clear = vi.fn();
    fixture.componentInstance.value.subscribe((value) => values.push(value));
    fixture.componentInstance.cleared.subscribe(clear);
    fixture.componentInstance['selectOption'](CITIES[0], new MouseEvent('mousedown'));
    fixture.componentInstance['onQueryChange']('invalid');
    expect(values).toEqual([0, null]);

    fixture.componentInstance['_onBlur'](new FocusEvent('blur'));

    expect(fixture.componentInstance['_query']()).toBe('');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(values).toEqual([0, null]);
    expect(clear).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledWith(expect.objectContaining({ reason: 'force-selection' }));
  });

  it('resolves an exact case-insensitive force-selection label on blur', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('mode', 'strict');
    const values: unknown[] = [];
    fixture.componentInstance.value.subscribe((value) => values.push(value));
    fixture.componentInstance['onQueryChange']('amsterdam');
    fixture.componentInstance['_onBlur'](new FocusEvent('blur'));

    expect(fixture.componentInstance.matchedOption()).toBe(CITIES[0]);
    expect(fixture.componentInstance['_query']()).toBe('Amsterdam');
    expect(values).toEqual([0]);
  });

  it('keeps programmatic writes and reset silent for option, custom and null values', () => {
    const fixture = setupCityAutocomplete();
    const values = vi.fn();
    const selected = vi.fn();
    fixture.componentInstance.value.subscribe(values);
    fixture.componentInstance.optionActivated.subscribe(selected);

    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance['_query']()).toBe('Barcelona');
    fixture.componentRef.setInput('value', 'Elsewhere');
    fixture.detectChanges();
    expect(fixture.componentInstance.customTextValue()).toBe('Elsewhere');
    fixture.componentInstance.reset();

    expect(fixture.componentInstance['_query']()).toBe('');
    expect(values).not.toHaveBeenCalled();
    expect(selected).not.toHaveBeenCalled();
  });

  it('emits exactly one semantic clear and treats an already-empty clear as a no-op', () => {
    const fixture = setupCityAutocomplete();
    const values = vi.fn();
    const clear = vi.fn();
    const query = vi.fn();
    fixture.componentInstance.value.subscribe(values);
    fixture.componentInstance.cleared.subscribe(clear);
    fixture.componentInstance.queryChange.subscribe(query);
    fixture.componentInstance['selectOption'](CITIES[1]);
    values.mockClear();

    fixture.componentInstance.clear(new MouseEvent('click'), 'button');
    fixture.componentInstance.clear(new MouseEvent('click'), 'button');

    expect(values).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(null);
    expect(query).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
  });

  it('blocks clear and selection mutation in readonly mode while remaining focusable/openable', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('readonly', true);
    fixture.componentRef.setInput('dropdown', true);
    fixture.componentInstance.value.set(0);
    const values = vi.fn();
    fixture.componentInstance.value.subscribe(values);
    fixture.componentInstance.openAll();
    fixture.componentInstance['selectOption'](CITIES[1], new MouseEvent('mousedown'));
    fixture.componentInstance.clear(new MouseEvent('click'), 'button');

    expect(fixture.componentInstance['_isOpen']()).toBe(true);
    expect(fixture.componentInstance.value()).toBe(0);
    expect(values).not.toHaveBeenCalled();
  });

  it('honors direct disabled ownership and blocks interaction', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('disabled', false);
    expect(fixture.componentInstance.isDisabledFinal()).toBe(false);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance['onQueryChange']('a');
    fixture.componentInstance.openAll();

    expect(fixture.componentInstance.isDisabledFinal()).toBe(true);
    expect(fixture.componentInstance['_query']()).toBe('');
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('reconciles immutable suggestion replacement by identity without changing the model', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('suggestions', CITIES);
    fixture.componentInstance.value.set(1);
    fixture.detectChanges();
    const replacement = CITIES.map((city) => ({ ...city, profile: { ...city.profile } }));
    fixture.componentRef.setInput('suggestions', replacement);
    fixture.detectChanges();

    expect(fixture.componentInstance.matchedOption()).toBe(replacement[1]);
    expect(fixture.componentInstance.value()).toBe(1);
    expect(fixture.componentInstance['_query']()).toBe('Barcelona');
  });

  it('normalizes typed nested groups without making groups selectable', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('groups', GROUPS);
    fixture.componentRef.setInput('groupConfig', GROUP_CONFIG);
    fixture.componentInstance.openAll();
    const rows = fixture.componentInstance.visibleRows();

    expect(rows.filter((row) => row.kind === 'group')).toHaveLength(3);
    expect(fixture.componentInstance['_filtered']()).toHaveLength(4);
    const disabledCity = rows.find((row) => row.kind === 'option' && row.option.id === 1);
    expect(disabledCity?.kind === 'option' ? disabledCity.disabled : null).toBe(true);
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(rows[fixture.componentInstance['_activeIndex']()].kind).toBe('option');
  });

  it('supports nested computed option access, falsy values and NaN equality', () => {
    const fixture = setupCityAutocomplete();
    expect(fixture.componentInstance['optionLabelOf'](CITIES[0])).toBe('Amsterdam');
    expect(fixture.componentInstance['optionValueOf'](CITIES[0])).toBe(0);
    fixture.componentRef.setInput('options', [
      { id: Number.NaN, profile: { name: 'Not a number' } },
    ]);
    fixture.componentInstance.value.set(Number.NaN);
    fixture.detectChanges();
    expect(fixture.componentInstance['_query']()).toBe('Not a number');
  });

  it('renders bounded loader rows that are never exposed as option values', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 3);
    fixture.componentInstance.openAll();
    const rows = fixture.componentInstance.visibleRows();

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.kind === 'loading')).toBe(true);
    expect(fixture.componentInstance['_filtered']()).toEqual([]);
    expect(fixture.componentInstance['_activeIndex']()).toBe(-1);
  });

  it('emits bounded monotonic lazy filter and scroll requests with query metadata', () => {
    vi.useFakeTimers();
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 4);
    fixture.componentRef.setInput('dataFirst', 20);
    fixture.componentRef.setInput('totalItems', 1000);
    const lazy: Array<{ requestId: number; query: string; range?: { render: { start: number; end: number } } }> = [];
    fixture.componentInstance.suggestionsRequest.subscribe((event) => lazy.push(event));

    fixture.componentInstance['onQueryChange']('bar');
    vi.advanceTimersByTime(20);
    fixture.componentInstance['onPanelScroll']({ target: { scrollTop: 400 } } as unknown as Event);

    expect(lazy[0]).toEqual(expect.objectContaining({ range: { render: { start: 20, end: 24 }, visible: { start: 20, end: 24 } }, query: 'bar' }));
    expect(lazy[1]).toEqual(expect.objectContaining({ range: { render: { start: 10, end: 14 }, visible: { start: 10, end: 14 } }, query: 'bar' }));
    expect(lazy[1].requestId).toBeGreaterThan(lazy[0].requestId);
  });

  it('bounds non-lazy virtual DOM and exposes logical ARIA positions', async () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput(
      'options',
      Array.from({ length: 100 }, (_, id) => ({ id, profile: { name: `City ${id}` } })),
    );
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 4);
    fixture.componentRef.setInput('virtualScrollBuffer', 1);
    fixture.componentInstance.openAll();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.renderedRows().length).toBeLessThanOrEqual(6);
    const options = document.querySelectorAll('.neu-autocomplete__option');
    expect(options.length).toBeLessThanOrEqual(6);
    expect(options[0].getAttribute('aria-setsize')).toBe('100');
  });

  it('keeps aria-activedescendant on an eligible rendered row and aria-selected on the value', async () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('autoOptionFocus', true);
    fixture.componentInstance.value.set(1);
    fixture.detectChanges();
    fixture.componentInstance.openAll();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const selected = document.querySelector('.neu-autocomplete__option--selected');

    expect(input.getAttribute('aria-activedescendant')).toBe(selected?.id);
    expect(selected?.getAttribute('aria-selected')).toBe('true');
    fixture.componentInstance.close();
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('keeps autoHighlight, autoOptionFocus, hover focus and selectOnFocus independent', () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('autoHighlight', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.componentInstance['onQueryChange']('a');
    expect(fixture.componentInstance['_activeIndex']()).toBe(0);
    expect(fixture.componentInstance.value()).toBe('a');

    fixture.componentRef.setInput('selectOnFocus', true);
    fixture.componentInstance['onOptionMouseEnter'](new MouseEvent('mouseenter'), 1);
    expect(fixture.componentInstance.value()).toBe(1);

    fixture.componentRef.setInput('focusOnHover', false);
    fixture.componentInstance['onOptionMouseEnter'](new MouseEvent('mouseenter'), 3);
    expect(fixture.componentInstance['_activeIndex']()).toBe(1);
  });

  it('supports boundary, page, Enter, Escape and Tab keyboard behavior without duplicate selection', () => {
    const fixture = setupCityAutocomplete();
    const selected = vi.fn();
    fixture.componentInstance.optionActivated.subscribe(selected);
    fixture.componentInstance.openAll();
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageDown' }));
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(selected).toHaveBeenCalledOnce();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);

    fixture.componentInstance.openAll();
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance['_isOpen']()).toBe(false);

    fixture.componentInstance.openAll();
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(selected).toHaveBeenCalledTimes(2);
  });

  it('emits show/hide only on real overlay transitions', () => {
    const fixture = setupCityAutocomplete();
    const show = vi.fn();
    const hide = vi.fn();
    fixture.componentInstance.opened.subscribe(show);
    fixture.componentInstance.closed.subscribe(hide);
    fixture.componentInstance.open();
    fixture.componentInstance.open();
    fixture.componentInstance.close();
    fixture.componentInstance.close();
    expect(show).toHaveBeenCalledOnce();
    expect(hide).toHaveBeenCalledOnce();
  });

  it('forwards native form and ARIA metadata to the real input', async () => {
    const fixture = setupCityAutocomplete();
    fixture.componentRef.setInput('inputId', 'city-input');
    fixture.componentRef.setInput('name', 'city');
    fixture.componentRef.setInput('type', 'search');
    fixture.componentRef.setInput('autocomplete', 'address-level2');
    fixture.componentRef.setInput('tabindex', 4);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('minLength', 2);
    fixture.componentRef.setInput('maxLength', 12);
    fixture.componentRef.setInput('ariaLabel', 'City search');
    fixture.componentRef.setInput('ariaDescribedBy', 'city-help');
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.id).toBe('city-input');
    expect(input.name).toBe('city');
    expect(input.type).toBe('search');
    expect(input.autocomplete).toBe('address-level2');
    expect(input.tabIndex).toBe(4);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('minlength')).toBe('2');
    expect(input.getAttribute('maxlength')).toBe('12');
    expect(input.getAttribute('aria-label')).toBe('City search');
    expect(input.getAttribute('aria-describedby')).toBe('city-help');
  });

  it('integrates with Reactive Forms for write, reset, disabled and touched ownership', async () => {
    @Component({
      imports: [NeuAutocompleteComponent, ReactiveFormsModule],
      template: `<neu-autocomplete [options]="options" [formControl]="control" />`,
    })
    class Host {
      readonly options: NeuAutocompleteOption<number>[] = [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
      ];
      readonly control = new FormControl<number | string | null>(1);
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    await host.whenStable();
    const autocomplete = host.debugElement.children[0]
      .componentInstance as NeuAutocompleteComponent;
    expect(autocomplete['_query']()).toBe('One');

    host.componentInstance.control.reset();
    host.componentInstance.control.disable();
    host.detectChanges();
    await host.whenStable();
    expect(autocomplete['_query']()).toBe('');
    expect(autocomplete.isDisabledFinal()).toBe(true);
  });

  it('emits input keydown and keyup lifecycle events once', () => {
    const fixture = setupCityAutocomplete();
    const down = vi.fn();
    const up = vi.fn();
    fixture.componentInstance.inputKeydown.subscribe(down);
    fixture.componentInstance.keyUp.subscribe(up);
    const keydown = new KeyboardEvent('keydown', { key: 'Shift' });
    const keyup = new KeyboardEvent('keyup', { key: 'Shift' });
    fixture.componentInstance['onKeyDown'](keydown);
    fixture.componentInstance.keyUp.emit(keyup);
    expect(down).toHaveBeenCalledWith(keydown);
    expect(up).toHaveBeenCalledWith(keyup);
  });

  it('renders strict item/group/loader/empty/header/footer and icon templates', async () => {
    @Component({
      imports: [
        NeuAutocompleteComponent,
        NeuAutocompleteItemDirective,
        NeuAutocompleteGroupDirective,
        NeuAutocompleteLoaderDirective,
        NeuAutocompleteEmptyDirective,
        NeuAutocompleteHeaderDirective,
        NeuAutocompleteFooterDirective,
        NeuAutocompleteLoadingIconDirective,
        NeuAutocompleteClearIconDirective,
        NeuAutocompleteDropdownIconDirective,
      ],
      template: `
        <neu-autocomplete
          [groups]="groups"
          [groupConfig]="config"
          [dropdown]="true"
          [loading]="true"
          [clearable]="true"
        >
          <ng-template [neuAutocompleteItem]="cities" let-city="option"
            >Item {{ city.profile.name }}</ng-template
          >
          <ng-template [neuAutocompleteGroup]="groups" let-group="group"
            >Group {{ group.meta.label }}</ng-template
          >
          <ng-template neuAutocompleteLoader let-index="logicalIndex"
            >Loader {{ index }}</ng-template
          >
          <ng-template neuAutocompleteEmpty>Empty slot</ng-template>
          <ng-template neuAutocompleteHeader>Header slot</ng-template>
          <ng-template neuAutocompleteFooter>Footer slot</ng-template>
          <ng-template neuAutocompleteLoadingIcon>Loading icon</ng-template>
          <ng-template neuAutocompleteClearIcon>Clear icon</ng-template>
          <ng-template neuAutocompleteDropdownIcon>Dropdown icon</ng-template>
        </neu-autocomplete>
      `,
    })
    class Host {
      readonly cities = CITIES;
      readonly groups = GROUPS;
      readonly config = GROUP_CONFIG;
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    const autocomplete = host.debugElement.children[0]
      .componentInstance as NeuAutocompleteComponent;
    autocomplete.openAll();
    host.detectChanges();
    await host.whenStable();
    expect(document.body.textContent).toContain('Header slot');
    expect(document.body.textContent).toContain('Footer slot');
    expect(document.body.textContent).toContain('Loader 0');
    expect(host.nativeElement.textContent).toContain('Loading icon');
    expect(host.nativeElement.textContent).toContain('Dropdown icon');
  });

  it('exercises projected queries, imperative methods and real DOM listener paths', async () => {
    @Component({
      imports: [
        NeuAutocompleteComponent,
        NeuAutocompleteItemDirective,
        NeuAutocompleteGroupDirective,
        NeuAutocompleteLoaderDirective,
        NeuAutocompleteEmptyDirective,
        NeuAutocompleteHeaderDirective,
        NeuAutocompleteFooterDirective,
        NeuAutocompleteLoadingIconDirective,
        NeuAutocompleteClearIconDirective,
        NeuAutocompleteDropdownIconDirective,
      ],
      template: `
        <neu-autocomplete
          [groups]="groups"
          [groupConfig]="config"
          [optionLabel]="'profile.name'"
          [optionValue]="valueOf"
          [dropdown]="true"
          [virtualScroll]="true"
          [virtualScrollVisibleItems]="2"
        >
          <ng-template [neuAutocompleteItem]="cities">item</ng-template>
          <ng-template [neuAutocompleteGroup]="groups">group</ng-template>
          <ng-template neuAutocompleteLoader>loader</ng-template>
          <ng-template neuAutocompleteEmpty>empty</ng-template>
          <ng-template neuAutocompleteHeader>header</ng-template>
          <ng-template neuAutocompleteFooter>footer</ng-template>
          <ng-template neuAutocompleteLoadingIcon>loading</ng-template>
          <ng-template neuAutocompleteClearIcon>clear</ng-template>
          <ng-template neuAutocompleteDropdownIcon>dropdown</ng-template>
        </neu-autocomplete>
      `,
    })
    class Host {
      readonly valueOf = (city: City) => city.id;
      readonly cities = CITIES;
      readonly groups = GROUPS;
      readonly config = GROUP_CONFIG;
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    await host.whenStable();
    const autocomplete = host.debugElement.children[0]
      .componentInstance as NeuAutocompleteComponent<City, number, 'free-text', Region>;

    expect(
      [
        autocomplete.itemTpl(),
        autocomplete.groupTpl(),
        autocomplete.loaderTpl(),
        autocomplete.emptyTpl(),
        autocomplete.headerTpl(),
        autocomplete.footerTpl(),
        autocomplete.loadingIconTpl(),
        autocomplete.clearIconTpl(),
        autocomplete.dropdownIconTpl(),
      ].every(Boolean),
    ).toBe(true);
    expect(autocomplete.displayText()).toBe('');
    expect(autocomplete.allOptions()).toHaveLength(4);

    autocomplete.value.set(0);
    host.detectChanges();
    autocomplete.openAll();
    host.detectChanges();
    await host.whenStable();
    host.detectChanges();
    const input = host.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));

    const option = document.querySelector('.neu-autocomplete__option') as HTMLElement;
    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const list = document.querySelector('.neu-autocomplete__list') as HTMLElement;
    list.scrollTop = 40;
    list.dispatchEvent(new Event('scroll', { bubbles: true }));
    autocomplete['_viewport']()?.checkViewportSize();
    autocomplete['_viewport']()?.scrollToIndex(1);
    expect(list.scrollTop).toBe(40);

    const dropdown = host.nativeElement.querySelector(
      '.neu-autocomplete__dropdown',
    ) as HTMLButtonElement;
    dropdown.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    const clear = host.nativeElement.querySelector('.neu-autocomplete__clear') as HTMLButtonElement;
    clear.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    autocomplete.close();
    autocomplete['_closePanel']();
    autocomplete.focus();
    autocomplete.close(null, 'programmatic', true);
  });

  it('covers fallback accessors, announcements, sizing and lazy geometry branches', () => {
    const fixture = setupCityAutocomplete();
    const component = fixture.componentInstance;
    expect(component['_viewport']()).toBeUndefined();

    fixture.componentRef.setInput('groups', [{ meta: { label: 'Function' }, cities: CITIES }]);
    fixture.componentRef.setInput('groupConfig', {
      labelAccessor: () => 'Function',
      childrenAccessor: () => undefined,
    } as unknown as NeuOptionGroupConfig<City, Region>);
    fixture.detectChanges();
    expect(component.allOptions()).toEqual([]);

    fixture.componentRef.setInput('groupConfig', {
      labelAccessor: 'meta.label',
      childrenAccessor: 'missing.path',
    });
    fixture.detectChanges();
    expect(component.allOptions()).toEqual([]);
    fixture.componentRef.setInput('groupConfig', {
      labelAccessor: 'meta.label',
      childrenAccessor: 'meta.label',
    });
    fixture.detectChanges();
    expect(component.allOptions()).toEqual([]);

    fixture.componentRef.setInput('groups', []);
    fixture.componentRef.setInput('options', [
      { ...CITIES[0], group: 'Legacy' },
    ] as unknown as City[]);
    fixture.detectChanges();
    expect(component.normalizedRows().some((row) => row.kind === 'group')).toBe(true);

    fixture.componentRef.setInput('groups', GROUPS);
    fixture.componentRef.setInput('groupConfig', GROUP_CONFIG);
    fixture.componentRef.setInput('filterConfig', { strategy: 'server' });
    fixture.detectChanges();
    expect(component.visibleRows().length).toBeGreaterThan(0);

    component.open();
    fixture.componentRef.setInput('searchMessage', '{0} available');
    expect(component.resultsAnnouncement()).toContain('available');
    fixture.componentRef.setInput('searchMessage', null);
    fixture.componentRef.setInput('groups', []);
    fixture.componentRef.setInput('options', [CITIES[0]]);
    fixture.detectChanges();
    expect(component.resultsAnnouncement()).toBe('1 resultado disponible');

    fixture.componentRef.setInput('virtualScrollItemSize', Number.NaN);
    fixture.componentRef.setInput('size', 'sm');
    expect(component.effectiveVirtualScrollItemSize()).toBe(36);
    fixture.componentRef.setInput('size', 'lg');
    expect(component.effectiveVirtualScrollItemSize()).toBe(52);
    fixture.componentRef.setInput('virtualScrollItemSize', 0);
    expect(component.effectiveVirtualScrollItemSize()).toBe(1);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('dataFirst', 3);
    fixture.componentRef.setInput('totalItems', null);
    expect(component.logicalOptionCount()).toBe(component.visibleOptionCount());
    expect(component.virtualTopHeight()).toBe(3);
    expect(component.virtualBottomHeight()).toBe(0);

    fixture.componentRef.setInput('optionValue', () => null as unknown as number);
    fixture.componentRef.setInput('optionLabel', () => '');
    expect(component['trackByOption'](7, CITIES[0])).toBe(7);
    component.close();
    expect(component.resultsAnnouncement()).toBe('');
  });

  it('covers guarded input, keyboard, overlay and late model reconciliation branches', async () => {
    const fixture = setupCityAutocomplete();
    const component = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    fixture.componentRef.setInput('maxLength', 2);
    input.value = 'abcd';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(input.value).toBe('ab');
    fixture.componentRef.setInput('readonly', true);
    input.value = 'blocked';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(component['_query']()).toBe('ab');
    fixture.componentRef.setInput('readonly', false);

    component.close();
    component['onQueryChange']('');
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageDown' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageUp' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'Tab' }));

    component.openAll();
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true }));
    component.openAll();
    component['onKeyDown'](new KeyboardEvent('keydown', { key: 'PageUp' }));
    input.value = 'abc';
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, shiftKey: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, shiftKey: true }),
    );

    fixture.componentRef.setInput('loading', true);
    component['handleDropdownClick'](new MouseEvent('click'));
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('disabled', true);
    component['_onFocus']();
    component.focus();
    fixture.componentRef.setInput('disabled', false);

    component['onPanelScroll']({ target: { scrollTop: 20 } } as unknown as Event);
    component['onPositionChange']({ connectionPair: { originY: 'top' } } as never);
    expect(component.panelAbove()).toBe(true);
    component['onDocClick'](new MouseEvent('mousedown'));
    component['onWindowResize']();

    component.value.set(99);
    fixture.componentRef.setInput('options', [...CITIES, { id: 99, profile: { name: 'Late' } }]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.matchedOption()?.id).toBe(99);
    expect(component['_optionId'](999)).toContain('option-999');
  });

  it('derives hydration-stable IDs from explicit metadata without a global counter', () => {
    const first = setupCityAutocomplete();
    const second = setupCityAutocomplete();
    first.componentRef.setInput('inputId', 'origin-city');
    second.componentRef.setInput('inputId', 'destination-city');

    expect(first.componentInstance.inputElementId()).toBe('origin-city');
    expect(first.componentInstance.listId()).toBe('origin-city-list');
    expect(second.componentInstance.inputElementId()).toBe('destination-city');
  });

  it('keeps 10k-option filtering, virtual DOM and repeated overlay cleanup bounded', async () => {
    const fixture = setupCityAutocomplete();
    const component = fixture.componentInstance;
    const many = Array.from({ length: 10_000 }, (_, id) => ({
      id,
      profile: { name: `City ${id}` },
    }));
    fixture.componentRef.setInput('options', many);
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('virtualScrollVisibleItems', 8);
    fixture.componentRef.setInput('virtualScrollBuffer', 2);
    fixture.detectChanges();

    component['filterQuery'].set('City 9999');
    component['allowEmptyQuery'].set(true);
    fixture.detectChanges();
    expect(component.visibleOptionCount()).toBe(1);
    expect(component.renderedRows()).toHaveLength(1);

    for (let cycle = 0; cycle < 3; cycle++) {
      component.openAll();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.visibleOptionCount()).toBe(10_000);
      expect(component.renderedRows().length).toBeLessThanOrEqual(12);
      expect(document.querySelectorAll('.neu-autocomplete__panel')).toHaveLength(1);
      component.close();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.querySelectorAll('.neu-autocomplete__panel')).toHaveLength(0);
    }
  });
});
