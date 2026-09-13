import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuCheckboxComponent } from '../checkbox/neu-checkbox.component';
import { NeuInputComponent } from '../input/neu-input.component';

/** Testing-only interaction driver shared by every N2 Forms path. */
class N2FormsDriver {
  static type(root: HTMLElement, value: string): void {
    const input = root.querySelector('input:not([type="checkbox"])') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  }

  static toggle(root: HTMLElement): void {
    const checkbox = root.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }

  static blurInput(root: HTMLElement): void {
    (root.querySelector('input:not([type="checkbox"])') as HTMLInputElement).dispatchEvent(
      new FocusEvent('blur'),
    );
  }
}

@Component({
  imports: [FormField, NeuInputComponent, NeuCheckboxComponent],
  template: `
    <neu-input label="Text" [formField]="fields.text" />
    <neu-checkbox label="Flag" [formField]="fields.flag" />
  `,
})
class SignalHost {
  readonly data = signal({ text: '', flag: false });
  readonly fields = form(this.data);
  readonly input = viewChild.required(NeuInputComponent);
  readonly checkbox = viewChild.required(NeuCheckboxComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuInputComponent, NeuCheckboxComponent],
  template: `
    <neu-input label="Text" [formControl]="text" />
    <neu-checkbox label="Flag" [formControl]="flag" />
  `,
})
class ReactiveDirectHost {
  readonly text = new FormControl('', { nonNullable: true });
  readonly flag = new FormControl(false, { nonNullable: true });
  readonly input = viewChild.required(NeuInputComponent);
  readonly checkbox = viewChild.required(NeuCheckboxComponent);
}

@Component({
  imports: [ReactiveFormsModule, NeuInputComponent, NeuCheckboxComponent],
  template: `
    <form [formGroup]="group">
      <neu-input label="Text" formControlName="text" />
      <neu-checkbox label="Flag" formControlName="flag" />
    </form>
  `,
})
class ReactiveGroupHost {
  readonly group = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
    flag: new FormControl(false, { nonNullable: true }),
  });
  readonly input = viewChild.required(NeuInputComponent);
  readonly checkbox = viewChild.required(NeuCheckboxComponent);
}

@Component({
  imports: [FormsModule, NeuInputComponent, NeuCheckboxComponent],
  template: `
    <neu-input name="text" label="Text" [(ngModel)]="text" />
    <neu-checkbox name="flag" label="Flag" [(ngModel)]="flag" />
  `,
})
class TemplateHost {
  readonly text = signal('');
  readonly flag = signal(false);
  readonly input = viewChild.required(NeuInputComponent);
  readonly checkbox = viewChild.required(NeuCheckboxComponent);
}

describe('N2 Forms matrix with the real Neural UI pilots', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('PASS: Signal Forms [formField] supports user edits, touch, dirty, reset and parent writes', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();

    expect(fixture.componentInstance.fields.text().touched()).toBe(false);
    expect(fixture.componentInstance.fields.text().dirty()).toBe(false);
    N2FormsDriver.type(fixture.nativeElement, 'signal');
    N2FormsDriver.toggle(fixture.nativeElement);
    fixture.detectChanges();

    expect(fixture.componentInstance.data()).toEqual({ text: 'signal', flag: true });
    expect(fixture.componentInstance.fields.text().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.flag().dirty()).toBe(true);
    expect(fixture.componentInstance.fields.text().touched()).toBe(false);

    N2FormsDriver.blurInput(fixture.nativeElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.fields.text().touched()).toBe(true);

    fixture.componentInstance.fields.text().reset('');
    fixture.componentInstance.fields.flag().reset(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toEqual({ text: '', flag: false });
    expect(fixture.componentInstance.fields.text().dirty()).toBe(false);
    expect(fixture.componentInstance.fields.text().touched()).toBe(false);
  });

  it('PASS: Reactive Forms [formControl] supports both pilots without CVA or event echo', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    const inputChanges = vi.fn();
    const checkboxChanges = vi.fn();
    fixture.componentInstance.input().value.subscribe(inputChanges);
    fixture.componentInstance.checkbox().checked.subscribe(checkboxChanges);

    fixture.componentInstance.text.setValue('parent');
    fixture.componentInstance.flag.setValue(true);
    fixture.detectChanges();
    expect(inputChanges).not.toHaveBeenCalled();
    expect(checkboxChanges).not.toHaveBeenCalled();
    expect(fixture.componentInstance.checkbox().checked()).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement).checked,
    ).toBe(true);
    expect(fixture.componentInstance.checkbox().disabled()).toBe(false);
    expect(fixture.componentInstance.checkbox().readonly()).toBe(false);

    N2FormsDriver.type(fixture.nativeElement, 'direct');
    N2FormsDriver.toggle(fixture.nativeElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.text.value).toBe('direct');
    expect(fixture.componentInstance.flag.value).toBe(false);
    expect(inputChanges).toHaveBeenCalledExactlyOnceWith('direct');
    expect(checkboxChanges).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('PASS: Reactive Forms formControlName supports both pilots and nonNullable reset', () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    N2FormsDriver.type(fixture.nativeElement, 'group');
    N2FormsDriver.toggle(fixture.nativeElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ text: 'group', flag: true });

    fixture.componentInstance.group.reset();
    fixture.detectChanges();
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ text: '', flag: false });
    expect(
      (fixture.nativeElement.querySelector('input:not([type="checkbox"])') as HTMLInputElement)
        .value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('PASS: Template Forms [(ngModel)] supports user edits and external updates without echo', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const inputChanges = vi.fn();
    const checkboxChanges = vi.fn();
    fixture.componentInstance.input().value.subscribe(inputChanges);
    fixture.componentInstance.checkbox().checked.subscribe(checkboxChanges);

    N2FormsDriver.type(fixture.nativeElement, 'template');
    fixture.componentInstance.checkbox().checked.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.text()).toBe('template');
    expect(fixture.componentInstance.flag()).toBe(true);
    expect(inputChanges).toHaveBeenCalledExactlyOnceWith('template');
    expect(checkboxChanges).toHaveBeenCalledExactlyOnceWith(true);

    inputChanges.mockClear();
    checkboxChanges.mockClear();
    fixture.componentInstance.text.set('external');
    fixture.componentInstance.flag.set(false);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.input().value()).toBe('external');
    expect(fixture.componentInstance.checkbox().checked()).toBe(false);
    expect(inputChanges).not.toHaveBeenCalled();
    expect(checkboxChanges).not.toHaveBeenCalled();
  });
});
