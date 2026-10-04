import { TestBed } from '@angular/core/testing';
import { NeuSelectComponent } from '../select/neu-select.component';
import { NeuAutocompleteComponent } from '../autocomplete/neu-autocomplete.component';

describe('Selector empty overlay semantics', () => {
  it('keeps Select empty status outside the options list and skips the empty tab stop', async () => {
    TestBed.configureTestingModule({ imports: [NeuSelectComponent] });
    const fixture = TestBed.createComponent(NeuSelectComponent);
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
    fixture.componentInstance.requestOpen();
    await fixture.whenStable();
    const list = document.querySelector('.neu-select__list') as HTMLElement;
    const status = document.querySelector('.neu-select__empty') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(list.contains(status)).toBe(false);
    expect(list.tabIndex).toBe(-1);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(document.querySelector('.neu-select__loader')?.getAttribute('role')).toBe('presentation');
    expect(list.getAttribute('aria-busy')).toBe('true');
  });

  it('keeps Autocomplete empty status outside its options list', async () => {
    TestBed.configureTestingModule({ imports: [NeuAutocompleteComponent] });
    const fixture = TestBed.createComponent(NeuAutocompleteComponent);
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
    fixture.componentInstance.openAll();
    await fixture.whenStable();
    const list = document.querySelector('.neu-autocomplete__list') as HTMLElement;
    const status = document.querySelector('.neu-autocomplete__empty') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(list.contains(status)).toBe(false);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(document.querySelector('.neu-autocomplete__loader')?.getAttribute('role')).toBe('presentation');
    expect(list.getAttribute('aria-busy')).toBe('true');
  });
});
