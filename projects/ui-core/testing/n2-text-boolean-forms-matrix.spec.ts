import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuInputMaskComponent } from '../input-mask/neu-input-mask.component';
import { NeuInputOTPComponent } from '../input-otp/neu-input-otp.component';
import { NeuPasswordComponent } from '../password/neu-password.component';
import { NeuRadioGroupComponent } from '../radio/neu-radio-group.component';
import { NeuRadioComponent } from '../radio/neu-radio.component';
import { NeuSwitchComponent } from '../switch/neu-switch.component';
import { NeuTextareaComponent } from '../textarea/neu-textarea.component';

type Role = 'admin' | 'user';
interface Values {
  textarea: string;
  password: string;
  mask: string;
  otp: string;
  enabled: boolean;
  role: Role | null;
}
const INITIAL: Values = {
  textarea: '',
  password: '',
  mask: '',
  otp: '',
  enabled: false,
  role: null,
};

const imports = [
  NeuTextareaComponent,
  NeuPasswordComponent,
  NeuInputMaskComponent,
  NeuInputOTPComponent,
  NeuSwitchComponent,
  NeuRadioGroupComponent,
  NeuRadioComponent,
];

const fields = `
  <neu-textarea data-control="textarea" [formField]="fields.textarea" />
  <neu-password data-control="password" [formField]="fields.password" />
  <neu-input-mask data-control="mask" mask="999-999" [formField]="fields.mask" />
  <neu-input-otp data-control="otp" [length]="4" [formField]="fields.otp" />
  <neu-switch data-control="enabled" [formField]="fields.enabled" />
  <neu-radio-group data-control="role" [formField]="fields.role">
    <neu-radio value="admin" label="Admin" /><neu-radio value="user" label="User" />
  </neu-radio-group>`;

@Component({ imports: [FormField, ...imports], template: fields })
class SignalHost {
  readonly data = signal<Values>({ ...INITIAL });
  readonly fields = form(this.data);
  readonly textarea = viewChild.required(NeuTextareaComponent);
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: ` <neu-textarea data-control="textarea" [formControl]="textarea" />
    <neu-password data-control="password" [formControl]="password" />
    <neu-input-mask data-control="mask" mask="999-999" [formControl]="mask" />
    <neu-input-otp data-control="otp" [length]="4" [formControl]="otp" />
    <neu-switch data-control="enabled" [formControl]="enabled" />
    <neu-radio-group data-control="role" [formControl]="role">
      <neu-radio value="admin" label="Admin" /><neu-radio value="user" label="User" />
    </neu-radio-group>`,
})
class ReactiveDirectHost {
  readonly textarea = new FormControl('', { nonNullable: true });
  readonly password = new FormControl('', { nonNullable: true });
  readonly mask = new FormControl('', { nonNullable: true });
  readonly otp = new FormControl('', { nonNullable: true });
  readonly enabled = new FormControl(false, { nonNullable: true });
  readonly role = new FormControl<Role | null>(null);
  values(): Values {
    return {
      textarea: this.textarea.value,
      password: this.password.value,
      mask: this.mask.value,
      otp: this.otp.value,
      enabled: this.enabled.value,
      role: this.role.value,
    };
  }
}

@Component({
  imports: [ReactiveFormsModule, ...imports],
  template: `<form [formGroup]="group">
    <neu-textarea data-control="textarea" formControlName="textarea" />
    <neu-password data-control="password" formControlName="password" />
    <neu-input-mask data-control="mask" mask="999-999" formControlName="mask" />
    <neu-input-otp data-control="otp" [length]="4" formControlName="otp" />
    <neu-switch data-control="enabled" formControlName="enabled" />
    <neu-radio-group data-control="role" formControlName="role">
      <neu-radio value="admin" label="Admin" /><neu-radio value="user" label="User" />
    </neu-radio-group>
  </form>`,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    textarea: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    mask: new FormControl('', { nonNullable: true }),
    otp: new FormControl('', { nonNullable: true }),
    enabled: new FormControl(false, { nonNullable: true }),
    role: new FormControl<Role | null>(null),
  });
}

@Component({
  imports: [FormsModule, ...imports],
  template: ` <neu-textarea data-control="textarea" name="textarea" [(ngModel)]="textarea" />
    <neu-password data-control="password" name="password" [(ngModel)]="password" />
    <neu-input-mask data-control="mask" name="mask" mask="999-999" [(ngModel)]="mask" />
    <neu-input-otp data-control="otp" name="otp" [length]="4" [(ngModel)]="otp" />
    <neu-switch data-control="enabled" name="enabled" [(ngModel)]="enabled" />
    <neu-radio-group data-control="role" name="role" [(ngModel)]="role">
      <neu-radio value="admin" label="Admin" /><neu-radio value="user" label="User" />
    </neu-radio-group>`,
})
class TemplateHost {
  readonly textarea = signal('');
  readonly password = signal('');
  readonly mask = signal('');
  readonly otp = signal('');
  readonly enabled = signal(false);
  readonly role = signal<Role | null>(null);
  values(): Values {
    return {
      textarea: this.textarea(),
      password: this.password(),
      mask: this.mask(),
      otp: this.otp(),
      enabled: this.enabled(),
      role: this.role(),
    };
  }
}

function root(fixture: { nativeElement: HTMLElement }, name: keyof Values): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-control="${name}"]`) as HTMLElement;
}
function text(
  fixture: { nativeElement: HTMLElement },
  name: 'textarea' | 'password' | 'mask',
  value: string,
): void {
  const native = root(fixture, name).querySelector('textarea,input') as HTMLInputElement;
  native.value = value;
  native.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
}
function pasteOtp(fixture: { nativeElement: HTMLElement }, value: string): void {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => value } });
  (root(fixture, 'otp').querySelector('input') as HTMLInputElement).dispatchEvent(event);
}
function toggle(fixture: { nativeElement: HTMLElement }): void {
  const native = root(fixture, 'enabled').querySelector('input') as HTMLInputElement;
  native.checked = true;
  native.dispatchEvent(new Event('change', { bubbles: true }));
}
function choose(fixture: { nativeElement: HTMLElement }): void {
  const options = root(fixture, 'role').querySelectorAll('input') as NodeListOf<HTMLInputElement>;
  options[1].click();
}
function editAll(fixture: { nativeElement: HTMLElement }): void {
  text(fixture, 'textarea', 'notes');
  text(fixture, 'password', 'Secret1!');
  text(fixture, 'mask', '123456');
  pasteOtp(fixture, '1234');
  toggle(fixture);
  choose(fixture);
}
const EDITED: Values = {
  textarea: 'notes',
  password: 'Secret1!',
  mask: '123-456',
  otp: '1234',
  enabled: true,
  role: 'user',
};

describe('N2-003 + N2-004 Forms matrix: 6 controls x 4 paths', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('Signal Forms [formField]: all six controls edit, dirty, touch, parent-write and reset', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual(EDITED);
    for (const name of Object.keys(EDITED) as (keyof Values)[])
      expect(fixture.componentInstance.fields[name]().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.textarea().touched()).toBe(false);
    expect(fixture.componentInstance.fields.mask().touched()).toBe(false);
    root(fixture, 'mask').querySelector('input')?.dispatchEvent(new FocusEvent('blur'));
    root(fixture, 'textarea').querySelector('textarea')?.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.fields.textarea().touched()).toBe(true);
    expect(fixture.componentInstance.fields.mask().touched()).toBe(true);
    fixture.componentInstance.fields.mask().reset('');
    fixture.detectChanges();
    expect(fixture.componentInstance.data().mask).toBe('');
    expect(fixture.componentInstance.fields.mask().dirty()).toBe(false);
    fixture.componentInstance.fields.textarea().reset('parent');
    fixture.detectChanges();
    expect(fixture.componentInstance.data().textarea).toBe('parent');
    expect(fixture.componentInstance.fields.textarea().dirty()).toBe(false);
  });

  it('Reactive [formControl]: all six controls edit and reset with no compatibility CVA', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual(EDITED);
    expect(fixture.componentInstance.mask.dirty).toBe(true);
    root(fixture, 'mask').querySelector('input')?.dispatchEvent(new FocusEvent('blur'));
    expect(fixture.componentInstance.mask.touched).toBe(true);
    fixture.componentInstance.textarea.reset();
    fixture.componentInstance.password.reset();
    fixture.componentInstance.mask.reset();
    fixture.componentInstance.otp.reset();
    fixture.componentInstance.enabled.reset();
    fixture.componentInstance.role.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual(INITIAL);
    expect(fixture.componentInstance.mask.dirty).toBe(false);
  });

  it('Reactive formControlName: all six controls edit and nonNullable values reset', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual(EDITED);
    expect(fixture.componentInstance.group.controls.mask.dirty).toBe(true);
    fixture.componentInstance.group.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual(INITIAL);
    expect(fixture.componentInstance.group.controls.mask.dirty).toBe(false);
  });

  it('Template [(ngModel)]: all six controls edit and accept parent writes without echo', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    editAll(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual(EDITED);
    expect((root(fixture, 'mask').querySelector('input') as HTMLInputElement).value).toBe('123-456');
    fixture.componentInstance.textarea.set('parent');
    fixture.componentInstance.password.set('external');
    fixture.componentInstance.mask.set('987-654');
    fixture.componentInstance.otp.set('9876');
    fixture.componentInstance.enabled.set(false);
    fixture.componentInstance.role.set('admin');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((root(fixture, 'textarea').querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'parent',
    );
    expect((root(fixture, 'role').querySelector('input') as HTMLInputElement).checked).toBe(true);
    expect((root(fixture, 'mask').querySelector('input') as HTMLInputElement).value).toBe('987-654');
  });
});
