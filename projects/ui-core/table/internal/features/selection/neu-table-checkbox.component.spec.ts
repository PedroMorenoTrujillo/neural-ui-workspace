import { PLATFORM_ID, provideZonelessChangeDetection, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuCheckboxComponent } from '@neural-ui/core/checkbox';
import { NeuTableCheckboxComponent } from './neu-table-checkbox.component';

const controls = (ariaLabel: string) => ({
  checked: false, indeterminate: false, disabled: false, ariaLabel,
  activate() {}, enter() {},
});

describe('Table controlled Neural checkbox adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [NeuTableCheckboxComponent],
    providers: [provideZonelessChangeDetection()],
  }));

  it('restores a model write without a pointer gesture or an attached native field', () => {
    const fixture = TestBed.createComponent(NeuTableCheckboxComponent);
    fixture.componentRef.setInput('controls', controls('Select row'));
    const control = TestBed.createComponent(NeuCheckboxComponent).componentInstance;
    const adapter = fixture.componentInstance as unknown as {
      propose(control: NeuCheckboxComponent): void;
    };
    const events: MouseEvent[] = [];
    fixture.componentInstance.activate.subscribe(event => events.push(event));
    control.checked.set(true);
    adapter.propose(control);
    expect(control.checked()).toBe(false);
    expect(events).toEqual([]);
  });

  it('emits one gesture and restores rejected writes without reentrant proposals', () => {
    const fixture = TestBed.createComponent(NeuTableCheckboxComponent);
    fixture.componentRef.setInput('controls', controls('Select row'));
    const control = TestBed.createComponent(NeuCheckboxComponent).componentInstance;
    const adapter = fixture.componentInstance as unknown as {
      capture(event: MouseEvent): void;
      propose(control: NeuCheckboxComponent): void;
    };
    const events: MouseEvent[] = [];
    fixture.componentInstance.activate.subscribe(event => events.push(event));
    control.checked.subscribe(() => adapter.propose(control));
    const click = new MouseEvent('click', { shiftKey: true });
    adapter.capture(click);
    control.checked.set(true);
    expect(events).toEqual([click]);
    expect(events[0].shiftKey).toBe(true);
    expect(control.checked()).toBe(false);
  });

  it('records the SSR hydration state without browser globals', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = TestBed.createComponent(NeuTableCheckboxComponent);
    fixture.componentRef.setInput('controls', controls('Select all'));
    expect(TestBed.inject(TransferState).get(makeStateKey<boolean>('neu-table-checkbox-ssr'), false)).toBe(true);
  });
});
