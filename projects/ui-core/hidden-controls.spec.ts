import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuCascadeSelectComponent } from './cascade-select/neu-cascade-select.component';
import { NeuCheckboxComponent } from './checkbox/neu-checkbox.component';
import { NeuDateInputComponent } from './date-input/neu-date-input.component';
import { NeuInputComponent } from './input/neu-input.component';
import { NeuInputMaskComponent } from './input-mask/neu-input-mask.component';
import { NeuInputOTPComponent } from './input-otp/neu-input-otp.component';
import { NeuInputTagsComponent } from './input-tags/neu-input-tags.component';
import { NeuKnobComponent } from './knob/neu-knob.component';
import { NeuListboxComponent } from './listbox/neu-listbox.component';
import { NeuNumberInputComponent } from './number-input/neu-number-input.component';
import { NeuPasswordComponent } from './password/neu-password.component';
import { NeuRadioGroupComponent } from './radio/neu-radio-group.component';
import { NeuRatingComponent } from './rating/neu-rating.component';
import { NeuRichTextEditorComponent } from './rich-text-editor/neu-rich-text-editor.component';
import { NeuSliderComponent } from './slider/neu-slider.component';
import { NeuSwitchComponent } from './switch/neu-switch.component';
import { NeuTextareaComponent } from './textarea/neu-textarea.component';
import { NeuToggleButtonGroupComponent } from './toggle-button-group/neu-toggle-button-group.component';
import { NeuUploaderComponent } from './uploader/neu-uploader.component';

const controls: readonly Type<unknown>[] = [
  NeuCascadeSelectComponent,
  NeuCheckboxComponent,
  NeuDateInputComponent,
  NeuInputComponent,
  NeuInputMaskComponent,
  NeuInputOTPComponent,
  NeuInputTagsComponent,
  NeuKnobComponent,
  NeuListboxComponent,
  NeuNumberInputComponent,
  NeuPasswordComponent,
  NeuRadioGroupComponent,
  NeuRatingComponent,
  NeuRichTextEditorComponent,
  NeuSliderComponent,
  NeuSwitchComponent,
  NeuTextareaComponent,
  NeuToggleButtonGroupComponent,
  NeuUploaderComponent,
];

describe('Official hidden state', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  for (const control of controls) {
    it(`${control.name} hides and restores its rendered host`, async () => {
      const fixture = TestBed.createComponent(control);
      fixture.detectChanges();
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      expect(getComputedStyle(host).display).not.toBe('none');

      fixture.componentRef.setInput('hidden', true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.hidden).toBe(true);
      expect(getComputedStyle(host).display).toBe('none');

      fixture.componentRef.setInput('hidden', false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.hidden).toBe(false);
      expect(getComputedStyle(host).display).not.toBe('none');
    });
  }
});
