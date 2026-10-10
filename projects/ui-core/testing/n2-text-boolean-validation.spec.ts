import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { NeuInputMaskComponent } from '../input-mask/neu-input-mask.component';
import { NeuInputOTPComponent } from '../input-otp/neu-input-otp.component';
import { NeuPasswordComponent } from '../password/neu-password.component';
import { NeuRadioGroupComponent } from '../radio/neu-radio-group.component';
import { NeuRadioComponent } from '../radio/neu-radio.component';
import { NeuSwitchComponent } from '../switch/neu-switch.component';
import { NeuTextareaComponent } from '../textarea/neu-textarea.component';

type Role = 'admin' | 'user';

@Component({
  imports: [
    FormField,
    NeuTextareaComponent,
    NeuPasswordComponent,
    NeuInputMaskComponent,
    NeuInputOTPComponent,
    NeuSwitchComponent,
    NeuRadioGroupComponent,
    NeuRadioComponent,
  ],
  template: ` <neu-textarea data-field="textarea" [formField]="fields.textarea" />
    <neu-password data-field="password" [formField]="fields.password" />
    <neu-input-mask data-field="mask" mask="999-999" [formField]="fields.mask" />
    <neu-input-otp data-field="otp" [length]="4" [formField]="fields.otp" />
    <neu-switch data-field="enabled" [formField]="fields.enabled" />
    <neu-radio-group data-field="role" [formField]="fields.role">
      <neu-radio value="admin" /><neu-radio value="user" />
    </neu-radio-group>`,
})
class ValidationHost {
  readonly data = signal({
    textarea: '',
    password: '',
    mask: '',
    otp: '',
    enabled: false,
    role: null as Role | null,
  });
  readonly fields = form(this.data, (path) => {
    required(path.textarea);
    minLength(path.textarea, 3);
    maxLength(path.textarea, 5);
    pattern(path.textarea, /^[A-Z]+$/);
    validate(path.textarea, ({ value }) =>
      value() === 'BAD' ? { kind: 'reserved', message: 'Reserved' } : undefined,
    );
    required(path.password);
    minLength(path.password, 8);
    pattern(path.password, /[A-Z]/);
    required(path.mask);
    pattern(path.mask, /^\d{3}-\d{3}$/);
    required(path.otp);
    minLength(path.otp, 4);
    maxLength(path.otp, 4);
    required(path.enabled);
    required(path.role);
    validate(path.role, ({ value }) =>
      value() === 'admin' ? { kind: 'admin-blocked', message: 'Blocked' } : undefined,
    );
  });
}

function kinds(field: { errors(): readonly { kind: string }[] }): string[] {
  return field.errors().map((error) => error.kind);
}

describe('N2-003 + N2-004 validation propagation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('propagates required/min/max/pattern/custom validation to the four string controls', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const { fields } = fixture.componentInstance;
    for (const field of [fields.textarea(), fields.password(), fields.mask(), fields.otp()]) {
      expect(kinds(field)).toContain('required');
    }
    const textarea = fixture.nativeElement.querySelector(
      '[data-field="textarea"] textarea',
    ) as HTMLTextAreaElement;
    const password = fixture.nativeElement.querySelector(
      '[data-field="password"] input',
    ) as HTMLInputElement;
    const mask = fixture.nativeElement.querySelector(
      '[data-field="mask"] input',
    ) as HTMLInputElement;
    const otp = fixture.nativeElement.querySelector('[data-field="otp"]') as HTMLElement;
    expect(textarea.required).toBe(true);
    expect(textarea.minLength).toBe(3);
    expect(textarea.maxLength).toBe(5);
    expect(textarea.getAttribute('pattern')).toBe('^[A-Z]+$');
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(8);
    expect(password.pattern).toBe('[A-Z]');
    expect(mask.required).toBe(true);
    expect(mask.pattern).toBe('^\\d{3}-\\d{3}$');
    expect(otp.hasAttribute('aria-required')).toBe(false);
    expect([...otp.querySelectorAll('input')].every(input => input.required)).toBe(true);
    expect(otp.getAttribute('aria-invalid')).toBe('true');
    fields.textarea().value.set('AB');
    expect(kinds(fields.textarea())).toContain('minLength');
    fields.textarea().value.set('ABCDEF');
    expect(kinds(fields.textarea())).toContain('maxLength');
    fields.textarea().value.set('abc');
    expect(kinds(fields.textarea())).toContain('pattern');
    fields.textarea().value.set('BAD');
    expect(kinds(fields.textarea())).toContain('reserved');
    fields.textarea().value.set('GOOD');
    expect(fields.textarea().valid()).toBe(true);
  });

  it('applies requiredTrue to Switch and required/custom validation to typed RadioGroup', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const { fields } = fixture.componentInstance;
    const checkbox = fixture.nativeElement.querySelector(
      '[data-field="enabled"] input',
    ) as HTMLInputElement;
    const group = fixture.nativeElement.querySelector('[data-field="role"]') as HTMLElement;
    expect(kinds(fields.enabled())).toContain('required');
    expect(checkbox.required).toBe(true);
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    fields.enabled().value.set(true);
    expect(fields.enabled().valid()).toBe(true);
    expect(kinds(fields.role())).toContain('required');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    fields.role().value.set('admin');
    expect(kinds(fields.role())).toContain('admin-blocked');
    fields.role().value.set('user');
    expect(fields.role().valid()).toBe(true);
  });

  it('validates mask and OTP canonical model values, not presentation fragments', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const { fields } = fixture.componentInstance;
    fields.mask().value.set('123-45');
    expect(kinds(fields.mask())).toContain('pattern');
    fields.mask().value.set('123-456');
    expect(fields.mask().valid()).toBe(true);
    fields.otp().value.set('123');
    expect(kinds(fields.otp())).toContain('minLength');
    fields.otp().value.set('1234');
    expect(fields.otp().valid()).toBe(true);
  });
});
