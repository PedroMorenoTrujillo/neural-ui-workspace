import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuInputTagsComponent, NeuInputTagsHeaderDirective, NeuInputTagsFooterDirective } from '../input-tags/neu-input-tags.component';
import { NeuInputOTPComponent } from '../input-otp/neu-input-otp.component';
import { NeuSliderComponent } from '../slider/neu-slider.component';
import { NeuRatingComponent } from '../rating/neu-rating.component';

@Component({
  imports: [NeuInputTagsComponent, NeuInputTagsHeaderDirective, NeuInputTagsFooterDirective],
  template: `<neu-input-tags label="Temas" [options]="[]" [typeahead]="true" [completeOnFocus]="true" [minQueryLength]="0" [delay]="0">
    <ng-template neuInputTagsHeader><p data-help>Ayuda</p></ng-template>
    <ng-template neuInputTagsFooter><p data-footer>Fin</p></ng-template>
  </neu-input-tags>`,
})
class TagsHost {}

describe('Form control accessible semantics', () => {
  it('keeps InputTags help, footer and empty status outside the options list', async () => {
    TestBed.configureTestingModule({ imports: [TagsHost] });
    const fixture = TestBed.createComponent(TagsHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await fixture.whenStable();
    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.querySelector('[role="status"], [data-help], [data-footer]')).toBeNull();
    expect(input.getAttribute('aria-controls')).toBe(list.id);
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(list.getAttribute('aria-label')).toBe('Temas');
  });

  it('uses native OTP field semantics instead of unsupported group attributes', async () => {
    TestBed.configureTestingModule({ imports: [NeuInputOTPComponent], providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }] });
    const fixture = TestBed.createComponent(NeuInputOTPComponent);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.hasAttribute('aria-required')).toBe(false);
    expect(fixture.nativeElement.hasAttribute('aria-readonly')).toBe(false);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-label')).toBe('Dígito 1 de 6');
  });

  it('localizes range endpoints and rating options through the optional application locale', async () => {
    TestBed.configureTestingModule({ imports: [NeuSliderComponent, NeuRatingComponent], providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }] });
    const slider = TestBed.createComponent(NeuSliderComponent);
    slider.componentRef.setInput('value', [20, 60]);
    slider.componentRef.setInput('label', 'Precio');
    await slider.whenStable();
    expect(slider.componentInstance.rangeThumbLabel(0)).toBe('Precio mínimo');
    expect(slider.componentInstance.rangeThumbLabel(1)).toBe('Precio máximo');
    const rating = TestBed.createComponent(NeuRatingComponent);
    rating.componentRef.setInput('step', 0.5);
    await rating.whenStable();
    expect(rating.nativeElement.querySelector('[data-neu-rating-value="0.5"]').getAttribute('aria-label')).toBe('0,5 estrellas');
    expect(rating.componentInstance.ratingLabel()).toBe('Sin valoración. 5 estrellas disponibles');
  });
});
