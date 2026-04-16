import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuRadioGroupComponent } from './neu-radio-group.component';
import { NeuRadioComponent } from './neu-radio.component';

@Component({
  template: `
    <neu-radio-group [formControl]="ctrl" [direction]="direction">
      <neu-radio value="a" label="Opción A" />
      <neu-radio value="b" label="Opción B" />
      <neu-radio value="c" label="Opción C" [disabled]="disableC" />
    </neu-radio-group>
  `,
  imports: [NeuRadioGroupComponent, NeuRadioComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl<string | null>(null);
  direction: any = 'column';
  disableC = false;
}

describe('NeuRadioComponent + NeuRadioGroupComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render all radio labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Opción A');
    expect(text).toContain('Opción B');
    expect(text).toContain('Opción C');
  });

  it('should have no option selected by default', () => {
    const inputs: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[type="radio"]');
    inputs.forEach((i) => expect(i.checked).toBe(false));
  });

  it('should mark the correct radio as checked when formControl is set', () => {
    host.ctrl.setValue('b');
    fixture.detectChanges();
    const inputs: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
    expect(inputs[2].checked).toBe(false);
  });

  it('should update formControl when a radio is clicked', () => {
    const inputs: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[type="radio"]');
    inputs[0].click();
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('a');
  });

  it('should disable a specific radio with disabled input', () => {
    const df = TestBed.createComponent(TestHostComponent);
    df.componentInstance.disableC = true;
    df.detectChanges();
    const inputs: NodeListOf<HTMLInputElement> =
      df.nativeElement.querySelectorAll('input[type="radio"]');
    expect(inputs[2].disabled).toBe(true);
  });

  it('should disable all radios when formControl is disabled', () => {
    host.ctrl.disable();
    fixture.detectChanges();
    const inputs: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[type="radio"]');
    inputs.forEach((i) => expect(i.disabled).toBe(true));
  });

  it('NeuRadioComponent onBlur should not throw', () => {
    @Component({
      template: `<neu-radio-group name="x"><neu-radio value="a" label="A" /></neu-radio-group>`,
      imports: [NeuRadioGroupComponent, NeuRadioComponent],
    })
    class BlurHost {}
    const f = TestBed.createComponent(BlurHost);
    f.detectChanges();
    const radioInput: HTMLInputElement = f.nativeElement.querySelector('input[type="radio"]');
    expect(() => radioInput.dispatchEvent(new Event('blur'))).not.toThrow();
  });

  it('selecting a radio programmatically updates isChecked', async () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.writeValue('b');
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance._value()).toBe('b');
  });

  it('NeuRadioGroupComponent registerOnChange callback is called on change', async () => {
    const f = TestBed.createComponent(NeuRadioGroupComponent);
    f.detectChanges();
    await f.whenStable();
    let changed: unknown;
    f.componentInstance.registerOnChange((v: unknown) => (changed = v));
    f.componentInstance.select('c');
    expect(changed).toBe('c');
  });
});
