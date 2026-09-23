import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { NeuFormFieldComponent, NeuInputGroupComponent } from './neu-form-field.component';
import { NeuInputComponent } from '../input/neu-input.component';
import { NeuNumberInputComponent } from '../number-input/neu-number-input.component';

describe('NeuFormFieldComponent', () => {
  let fixture: ComponentFixture<NeuFormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuFormFieldComponent, NeuInputGroupComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuFormFieldComponent);
  });

  it('renders label and hint', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('hint', 'Work email');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Email');
    expect(fixture.nativeElement.textContent).toContain('Work email');
  });

  it('renders error and hint with deterministic relationship IDs', () => {
    fixture.componentRef.setInput('hint', 'Hint');
    fixture.componentRef.setInput('error', 'Required');
    fixture.componentRef.setInput('id', 'email-field');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Required');
    expect(fixture.nativeElement.textContent).toContain('Hint');
    expect(fixture.nativeElement.querySelector('.neu-form-field__hint')?.id).toBe('email-field-hint');
    expect(fixture.nativeElement.querySelector('.neu-form-field__error')?.id).toBe('email-field-error');
    expect(fixture.componentInstance.describedBy()).toBe('email-field-hint email-field-error');
    expect(fixture.componentInstance.mergeDescribedBy('help external help')).toBe(
      'help external email-field-hint email-field-error',
    );
  });

  it('renders prefix, suffix, association and computed size/error classes', () => {
    fixture.componentRef.setInput('label', 'Amount');
    fixture.componentRef.setInput('forId', 'amount-input');
    fixture.componentRef.setInput('id', 'amount-field');
    fixture.componentRef.setInput('prefix', '$');
    fixture.componentRef.setInput('suffix', 'USD');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('error', 'Invalid');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('neu-form-field--lg');
    expect(host.classList).toContain('neu-form-field--error');
    expect(host.querySelector('label')?.getAttribute('for')).toBe('amount-input');
    expect(host.querySelector('label')?.id).toBe('amount-field-label');
    expect(host.querySelector('.neu-form-field__prefix')?.textContent).toBe('$');
    expect(host.querySelector('.neu-form-field__suffix')?.textContent).toBe('USD');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Invalid');
  });

  it('omits empty descriptions and merges nullable external IDs without duplicates', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.describedBy()).toBe('');
    expect(
      fixture.componentInstance.mergeDescribedBy(null, undefined, '', 'external external'),
    ).toBe('external');
  });
});

@Component({
  imports: [NeuFormFieldComponent, NeuInputGroupComponent],
  template: `
    <neu-form-field label="Name"><input value="Ada" /></neu-form-field>
    <neu-input-group><input /><button type="button">Go</button></neu-input-group>
  `,
})
class ProjectionHostComponent {}

describe('NeuInputGroupComponent', () => {
  it('projects controls and exposes size and attachment classes', async () => {
    await TestBed.configureTestingModule({ imports: [NeuInputGroupComponent, ProjectionHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuInputGroupComponent);
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('attached', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('neu-input-group--sm');
    expect(host.classList).not.toContain('neu-input-group--attached');

    const projected = TestBed.createComponent(ProjectionHostComponent);
    projected.detectChanges();
    expect(projected.nativeElement.querySelector('neu-form-field input')).toBeTruthy();
    expect(projected.nativeElement.querySelector('neu-input-group button')?.textContent).toContain('Go');
  });
});

@Component({
  imports: [NeuFormFieldComponent, NeuInputGroupComponent, NeuInputComponent, NeuNumberInputComponent],
  template: `
    <neu-form-field #nameField="neuFormField" label="Name" forId="name-control" hint="Use your full name">
      <neu-input inputId="name-control" [floatingLabel]="false" [value]="name" />
    </neu-form-field>
    <neu-form-field #amountField="neuFormField" label="Amount" forId="amount-control"
      id="amount-field" hint="Enter a positive amount" [error]="amountError()">
      <neu-input-group>
        <span>$</span>
        <neu-number-input inputId="amount-control" [value]="amount" [required]="true" [invalid]="!!amountError()"
          [ariaDescribedBy]="amountField.mergeDescribedBy('external-note')" />
        <button type="button" (click)="actions.update(value => value + 1)">Apply</button>
      </neu-input-group>
    </neu-form-field>
    <span id="external-note">Currency information</span>
  `,
})
class FormsShellHostComponent {
  name = 'Ada';
  amount = 3;
  readonly amountError = signal('Amount is invalid');
  readonly actions = signal(0);
}

describe('NeuFormField with Signal Forms controls', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [FormsShellHostComponent] }));

  it('associates projected Input and NumberInput without owning their values', async () => {
    const fixture = TestBed.createComponent(FormsShellHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const name = host.querySelector('#name-control') as HTMLInputElement;
    const amount = host.querySelector('#amount-control') as HTMLInputElement;
    expect(host.querySelector('label[for="name-control"]')).toBeTruthy();
    expect(host.querySelector('label[for="amount-control"]')).toBeTruthy();
    expect(name.value).toBe('Ada');
    expect(amount.getAttribute('aria-describedby')).toBe('external-note amount-field-hint amount-field-error');
    expect(amount.getAttribute('aria-invalid')).toBe('true');
    expect(amount.getAttribute('aria-required')).toBe('true');
    expect(amount.value).toBeTruthy();
    expect(host.querySelector('neu-input-group')?.contains(amount)).toBe(true);
    (host.querySelector('neu-input-group > button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.actions()).toBe(1);
  });

  it('updates descriptions only from applied parent inputs and keeps distinct deterministic IDs', async () => {
    const fixture = TestBed.createComponent(FormsShellHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const fields = [...host.querySelectorAll('neu-form-field')] as HTMLElement[];
    expect(fields[0].querySelector('.neu-form-field__hint')?.id).not.toBe(fields[1].querySelector('.neu-form-field__hint')?.id);
    fixture.componentInstance.amountError.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    const amount = host.querySelector('#amount-control') as HTMLInputElement;
    expect(amount.getAttribute('aria-describedby')).toBe('external-note amount-field-hint');
    expect(amount.hasAttribute('aria-invalid')).toBe(false);
  });
});
