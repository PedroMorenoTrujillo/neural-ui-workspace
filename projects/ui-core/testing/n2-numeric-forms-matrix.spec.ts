import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuKnobComponent } from '../knob/neu-knob.component';
import { NeuNumberInputComponent } from '../number-input/neu-number-input.component';

interface NumericValues {
  amount: number | null;
  volume: number;
}

const INITIAL: NumericValues = { amount: null, volume: 25 };
const EDITED: NumericValues = { amount: 1234.5, volume: 30 };
const controls = [NeuNumberInputComponent, NeuKnobComponent];

@Component({
  imports: [FormField, ...controls],
  template: `
    <neu-number-input data-control="amount" [formatOptions]="format" [formField]="fields.amount" />
    <neu-knob data-control="volume" [step]="5" [formField]="fields.volume" />
  `,
})
class SignalHost {
  readonly data = signal<NumericValues>({ ...INITIAL });
  readonly fields = form(this.data);
  readonly format = { locale: 'en-US', style: 'decimal' } as const;
  readonly amount = viewChild.required(NeuNumberInputComponent);
  readonly volume = viewChild.required(NeuKnobComponent);
}

@Component({
  imports: [ReactiveFormsModule, ...controls],
  template: `
    <neu-number-input data-control="amount" [formControl]="amount" />
    <neu-knob data-control="volume" [step]="5" [formControl]="volume" />
  `,
})
class ReactiveDirectHost {
  readonly amount = new FormControl<number | null>(null);
  readonly volume = new FormControl(25, { nonNullable: true });
  readonly amountControl = viewChild.required(NeuNumberInputComponent);
  readonly volumeControl = viewChild.required(NeuKnobComponent);
}

@Component({
  imports: [ReactiveFormsModule, ...controls],
  template: `
    <form [formGroup]="group">
      <neu-number-input data-control="amount" formControlName="amount" />
      <neu-knob data-control="volume" [step]="5" formControlName="volume" />
    </form>
  `,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    amount: new FormControl<number | null>(null),
    volume: new FormControl(25, { nonNullable: true }),
  });
}

@Component({
  imports: [FormsModule, ...controls],
  template: `
    <neu-number-input data-control="amount" name="amount" [(ngModel)]="amount" />
    <neu-knob data-control="volume" name="volume" [step]="5" [(ngModel)]="volume" />
  `,
})
class TemplateHost {
  readonly amount = signal<number | null>(null);
  readonly volume = signal(25);
  readonly amountControl = viewChild.required(NeuNumberInputComponent);
  readonly volumeControl = viewChild.required(NeuKnobComponent);
}

function root(fixture: { nativeElement: HTMLElement }, name: keyof NumericValues): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-control="${name}"]`) as HTMLElement;
}

function editAll(fixture: { nativeElement: HTMLElement }): void {
  const amount = root(fixture, 'amount').querySelector('input') as HTMLInputElement;
  amount.value = '1,234.5';
  amount.dispatchEvent(new InputEvent('input', { bubbles: true, data: '1,234.5' }));
  const knob = root(fixture, 'volume').querySelector('[role="spinbutton"]') as HTMLElement;
  knob.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
  );
}

describe('N2-005 Forms matrix: NumberInput + Knob x 4 paths', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('Signal Forms [formField]: edits, dirty, touch, parent write and reset', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    expect(fixture.componentInstance.fields.amount().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.volume().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.amount().touched()).toBe(false);
    root(fixture, 'amount').dispatchEvent(new FocusEvent('focusout'));
    root(fixture, 'volume')
      .querySelector('[role="spinbutton"]')
      ?.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.fields.amount().touched()).toBe(true);
    expect(fixture.componentInstance.fields.volume().touched()).toBe(true);
    fixture.componentInstance.fields.amount().reset(null);
    fixture.componentInstance.fields.volume().reset(25);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(INITIAL);
  });

  it('Reactive [formControl]: both controls edit and parent writes do not echo', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const amountChanges = vi.fn();
    const volumeChanges = vi.fn();
    fixture.componentInstance.amountControl().value.subscribe(amountChanges);
    fixture.componentInstance.volumeControl().value.subscribe(volumeChanges);
    fixture.componentInstance.amount.setValue(10);
    fixture.componentInstance.volume.setValue(20);
    fixture.detectChanges();
    expect(amountChanges).not.toHaveBeenCalled();
    expect(volumeChanges).not.toHaveBeenCalled();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.amount.value).toBe(1234.5);
    expect(fixture.componentInstance.volume.value).toBe(25);
    expect(amountChanges).toHaveBeenCalledExactlyOnceWith(1234.5);
    expect(volumeChanges).toHaveBeenCalledExactlyOnceWith(25);
  });

  it('Reactive formControlName: both controls edit and reset to their form values', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    fixture.componentInstance.group.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual(INITIAL);
    expect((root(fixture, 'amount').querySelector('input') as HTMLInputElement).value).toBe('');
  });

  it('Template [(ngModel)]: both controls edit and accept parent writes without echo', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.amount()).toBe(1234.5);
    expect(fixture.componentInstance.volume()).toBe(30);
    const amountChanges = vi.fn();
    const volumeChanges = vi.fn();
    fixture.componentInstance.amountControl().value.subscribe(amountChanges);
    fixture.componentInstance.volumeControl().value.subscribe(volumeChanges);
    fixture.componentInstance.amount.set(null);
    fixture.componentInstance.volume.set(60);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.amountControl().value()).toBeNull();
    expect(fixture.componentInstance.volumeControl().value()).toBe(60);
    expect(amountChanges).not.toHaveBeenCalled();
    expect(volumeChanges).not.toHaveBeenCalled();
  });
});
