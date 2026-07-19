import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NeuInlineEditorComponent } from './neu-inline-editor.component';
import { collectCvaChanges, detectStableChanges, dispatchKeyboard } from '../testing/cva-contract';

async function setup(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(NeuInlineEditorComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  await detectStableChanges(fixture);
  return fixture;
}

describe('NeuInlineEditorComponent', () => {
  it('renders the display value and enters edit mode', async () => {
    const fixture = await setup({ value: 'Draft' });

    expect(fixture.nativeElement.textContent).toContain('Draft');
    fixture.nativeElement.querySelector('.neu-inline-editor__display').click();
    await detectStableChanges(fixture);

    expect(fixture.nativeElement.querySelector('.neu-inline-editor__edit')).toBeTruthy();
  });

  it('emits valueChange and editCommit when committed', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    const values: unknown[] = [];
    const commits: unknown[] = [];
    component.valueChange.subscribe((value) => values.push(value));
    component.editCommit.subscribe((event) => commits.push(event));

    component.beginEdit();
    fixture.detectChanges();
    component.stringControl.setValue('Published');
    component.commit();

    expect(values).toEqual(['Published']);
    expect(commits).toEqual([{ previousValue: 'Draft', value: 'Published' }]);
  });

  it('restores the previous value on cancel', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;

    component.beginEdit();
    component.stringControl.setValue('Changed');
    component.cancel();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Draft');
  });

  it('supports CVA writeValue and disabled state', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const changes = collectCvaChanges(component);

    component.writeValue('Initial');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Initial');

    component.setDisabledState(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')?.disabled).toBe(true);

    component.setDisabledState(false);
    component.beginEdit();
    component.stringControl.setValue('Next');
    component.commit();
    expect(changes).toEqual(['Next']);
  });

  it('syncs the public disabled input through its internal reactive controls', async () => {
    const fixture = await setup({ value: 'Draft', startInEdit: true });
    const component = fixture.componentInstance;

    expect(component.stringControl.enabled).toBe(true);
    fixture.componentRef.setInput('disabled', true);
    await detectStableChanges(fixture);

    expect(component.stringControl.disabled).toBe(true);
    expect(component.numberControl.disabled).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.neu-input__field') as HTMLInputElement | null)?.disabled,
    ).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    await detectStableChanges(fixture);
    expect(component.stringControl.enabled).toBe(true);
    expect(component.numberControl.enabled).toBe(true);
  });

  it('cancels with Escape and commits with Enter', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;

    component.beginEdit();
    component.stringControl.setValue('Changed');
    await detectStableChanges(fixture);
    dispatchKeyboard(fixture.nativeElement.querySelector('.neu-inline-editor__edit'), 'Escape');
    await detectStableChanges(fixture);
    expect(fixture.nativeElement.textContent).toContain('Draft');

    component.beginEdit();
    component.stringControl.setValue('Final');
    await detectStableChanges(fixture);
    dispatchKeyboard(fixture.nativeElement.querySelector('.neu-inline-editor__edit'), 'Enter');
    await detectStableChanges(fixture);
    expect(fixture.nativeElement.textContent).toContain('Final');
  });

  it('commits numeric values as numbers', async () => {
    const fixture = await setup({ type: 'number', value: 3 });
    const component = fixture.componentInstance;
    const values: unknown[] = [];
    component.valueChange.subscribe((value) => values.push(value));

    component.beginEdit();
    component.numberControl.setValue(8);
    component.commit();

    expect(values).toEqual([8]);
  });

  it('commits on focusout when saveOnBlur is enabled', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: true });
    const component = fixture.componentInstance;
    const values: unknown[] = [];
    component.valueChange.subscribe((value) => values.push(value));

    component.beginEdit();
    component.stringControl.setValue('Blurred');
    component.onEditFocusout(new FocusEvent('focusout'));
    await fixture.whenStable();

    expect(values).toEqual(['Blurred']);
  });

  it('works with Reactive Forms', async () => {
    @Component({
      imports: [ReactiveFormsModule, NeuInlineEditorComponent],
      template: `<neu-inline-editor [formControl]="control" />`,
    })
    class HostComponent {
      control = new FormControl('Alpha');
    }

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    await detectStableChanges(fixture);
    const editor = fixture.debugElement.query(By.directive(NeuInlineEditorComponent))
      .componentInstance as NeuInlineEditorComponent;

    editor.beginEdit();
    editor.stringControl.setValue('Beta');
    editor.commit();

    expect(fixture.componentInstance.control.value).toBe('Beta');
  });

  it('commits and cancels through the rendered action buttons', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    component.stringControl.setValue('Saved');
    const buttons = fixture.nativeElement.querySelectorAll('.neu-inline-editor__actions button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    expect(component.displayValue()).toBe('Saved');

    component.beginEdit();
    component.stringControl.setValue('Discarded');
    await detectStableChanges(fixture);
    (fixture.nativeElement.querySelectorAll('.neu-inline-editor__actions button') as NodeListOf<HTMLButtonElement>)[1].click();
    expect(component.displayValue()).toBe('Saved');
  });

  it('keeps focusout editing when focus stays inside and supports control variants', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: true });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    const inside = fixture.nativeElement.querySelector('.neu-inline-editor__actions button') as HTMLButtonElement;
    component.onEditFocusout({ relatedTarget: inside } as unknown as FocusEvent);
    expect(component.editing()).toBe(true);

    fixture.componentRef.setInput('type', 'select');
    fixture.componentRef.setInput('options', [{ label: 'Published', value: 'published' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('neu-select')).toBeTruthy();
    component.cancel();
    fixture.componentRef.setInput('type', 'textarea');
    component.beginEdit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('neu-textarea')).toBeTruthy();
  });

  it('commits on rendered focusout when focus leaves the editor', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: true });
    const component = fixture.componentInstance;
    const commits: unknown[] = [];
    component.editCommit.subscribe((event) => commits.push(event));

    component.beginEdit();
    component.stringControl.setValue('Blur DOM');
    await detectStableChanges(fixture);

    const edit = fixture.nativeElement.querySelector('.neu-inline-editor__edit') as HTMLElement;
    edit.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await fixture.whenStable();
    await detectStableChanges(fixture);

    expect(component.editing()).toBe(false);
    expect(component.displayValue()).toBe('Blur DOM');
    expect(commits).toEqual([{ previousValue: 'Draft', value: 'Blur DOM' }]);
  });

  it('renders date and number variants and normalizes invalid number input to null', async () => {
    const fixture = await setup({ type: 'date', value: '2026-05-03', startInEdit: true });
    const component = fixture.componentInstance;
    await detectStableChanges(fixture);
    expect(fixture.nativeElement.querySelector('neu-date-input')).toBeTruthy();

    fixture.componentRef.setInput('type', 'number');
    fixture.componentRef.setInput('value', undefined);
    await detectStableChanges(fixture);
    expect(fixture.nativeElement.querySelector('neu-number-input')).toBeTruthy();
    expect(component.displayValue()).toBe('Empty');

    component.numberControl.setValue(Number.NaN);
    expect((component as any)._value()).toBeNull();
    component.commit();
    expect(component.displayValue()).toBe('0');
  });

  it('does not begin edit when readonly or disabled and exposes host state classes', async () => {
    const fixture = await setup({ value: 'Draft', readonly: true, size: 'lg' });
    const component = fixture.componentInstance;

    component.beginEdit();
    expect(component.editing()).toBe(false);
    expect(component.hostClasses()).toEqual(
      expect.objectContaining({
        'neu-inline-editor': true,
        'neu-inline-editor--lg': true,
        'neu-inline-editor--readonly': true,
      }),
    );

    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    await detectStableChanges(fixture);
    component.beginEdit();
    expect(component.editing()).toBe(false);
    expect(component.hostClasses()['neu-inline-editor--disabled']).toBe(true);
  });

  it('select display falls back to the raw value when no option label matches', async () => {
    const fixture = await setup({
      type: 'select',
      value: 'archived',
      options: [{ label: 'Published', value: 'published' }],
    });

    expect(fixture.componentInstance.displayValue()).toBe('archived');
  });

  it('keeps editing when saveOnBlur is disabled and commits Enter only outside textarea', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: false });
    const component = fixture.componentInstance;
    component.beginEdit();
    component.stringControl.setValue('Still editing');
    component.onEditFocusout(new FocusEvent('focusout'));
    await fixture.whenStable();

    expect(component.editing()).toBe(true);

    fixture.componentRef.setInput('type', 'textarea');
    await detectStableChanges(fixture);
    component.onEditKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(component.editing()).toBe(true);

    fixture.componentRef.setInput('type', 'text');
    await detectStableChanges(fixture);
    component.onEditKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(component.editing()).toBe(false);
  });

  it('ignores cross-type control updates and disabled commits', async () => {
    const fixture = await setup({ type: 'number', value: 5 });
    const component = fixture.componentInstance;

    component.stringControl.setValue('ignored');
    expect(component.displayValue()).toBe('5');

    fixture.componentRef.setInput('type', 'text');
    await detectStableChanges(fixture);
    component.numberControl.setValue(42);
    expect(component.displayValue()).toBe('5');

    component.beginEdit();
    fixture.componentRef.setInput('disabled', true);
    await detectStableChanges(fixture);
    component.commit();
    expect(component.editing()).toBe(true);
  });
});
