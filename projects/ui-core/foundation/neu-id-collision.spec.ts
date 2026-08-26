import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuAutocompleteComponent } from '@neural-ui/core/autocomplete';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuListboxComponent } from '@neural-ui/core/listbox';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuPanelComponent } from '@neural-ui/core/panel';
import { NeuSelectComponent } from '@neural-ui/core/select';
import { NeuTooltipDirective } from '@neural-ui/core/tooltip';

@Component({
  imports: [
    NeuAutocompleteComponent,
    NeuDialogComponent,
    NeuInputComponent,
    NeuListboxComponent,
    NeuPanelComponent,
    NeuSelectComponent,
    NeuTooltipDirective,
  ],
  template: `
    <neu-input label="Name" />
    <neu-input label="Name" />
    <neu-select label="Status" [options]="options" />
    <neu-select label="Status" [options]="options" />
    <neu-listbox ariaLabel="Choice" [options]="options" />
    <neu-listbox ariaLabel="Choice" [options]="options" />
    <neu-autocomplete label="City" [options]="options" />
    <neu-autocomplete label="City" [options]="options" />
    <button neuTooltip="Help">One</button>
    <button neuTooltip="Help">Two</button>
    <neu-dialog title="One" />
    <neu-dialog title="Two" />
    <neu-panel>One</neu-panel>
    <neu-panel>Two</neu-panel>
  `,
})
class IdCollisionHost {
  readonly options = ['One', 'Two'];
}

describe('Neural generated ID collisions', () => {
  it('keeps identical component instances unique and their ARIA references intact', () => {
    const fixture = TestBed.createComponent(IdCollisionHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const ids = Array.from(
      host.querySelectorAll<HTMLElement>('[id]'),
      (element) => element.id,
    ).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);

    const references = Array.from(
      host.querySelectorAll<HTMLElement>(
        '[for], [aria-controls], [aria-describedby], [aria-labelledby]',
      ),
    ).flatMap((element) =>
      ['for', 'aria-controls', 'aria-describedby', 'aria-labelledby']
        .flatMap((attribute) => element.getAttribute(attribute)?.split(/\s+/) ?? [])
        .filter(Boolean),
    );

    expect(references.every((reference) => reference.startsWith('neu-'))).toBe(true);
    const eagerReferences = Array.from(
      host.querySelectorAll<HTMLElement>('[for], [aria-labelledby]'),
    ).flatMap((element) =>
      ['for', 'aria-labelledby'].flatMap(
        (attribute) => element.getAttribute(attribute)?.split(/\s+/) ?? [],
      ),
    );
    expect(eagerReferences.every((reference) => ids.includes(reference))).toBe(true);

    const autocompleteIds = Array.from(
      host.querySelectorAll<HTMLInputElement>('.neu-autocomplete__input'),
      (element) => element.id,
    );
    expect(autocompleteIds).toHaveLength(2);
    expect(new Set(autocompleteIds).size).toBe(2);

    const tooltipIds = Array.from(
      host.querySelectorAll<HTMLButtonElement>('button[neuTooltip]'),
      (element) => element.getAttribute('aria-describedby'),
    );
    expect(new Set(tooltipIds).size).toBe(2);
  });
});
