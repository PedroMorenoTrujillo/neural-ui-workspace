import { ChangeDetectionStrategy, Component, Directive, TemplateRef, ViewEncapsulation, computed, contentChild, forwardRef, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
export interface NeuTagSuggestion { label: string; value: string; data?: unknown; }
@Directive({ selector: 'ng-template[neuTagItem]' })
export class NeuTagItemDirective { constructor(readonly templateRef: TemplateRef<{ $implicit: string; remove: () => void }>) {} }
@Directive({ selector: 'ng-template[neuTagSuggestion]' })
export class NeuTagSuggestionDirective { constructor(readonly templateRef: TemplateRef<{ $implicit: NeuTagSuggestion }>) {} }

@Component({
  selector: 'neu-tags',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NeuTagsComponent), multi: true }],
  host: { class: 'neu-tags' },
  template: `
    @if (label()) {
      <label class="neu-tags__label" [for]="inputId">{{ label() }}</label>
    }
    <div class="neu-tags__box" [class.neu-tags__box--disabled]="disabled() || cvaDisabled()">
      @for (tag of value(); track tag) {
        <span class="neu-tags__tag">
          @if (tagTpl()) { <ng-container [ngTemplateOutlet]="tagTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: tag, remove: remove.bind(this, tag) }" /> } @else { {{ tag }} }
          <button type="button" [attr.aria-label]="removeLabel() + ' ' + tag" (click)="remove(tag)">×</button>
        </span>
      }
      <input
        [id]="inputId"
        [placeholder]="value().length ? '' : placeholder()"
        [value]="draft()"
        [disabled]="disabled() || cvaDisabled()"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onKeyDown($event)"
        (blur)="commitDraft()"
      />
    </div>
    @if (suggestions().length && draft()) {
      <div class="neu-tags__suggestions">
        @for (suggestion of filteredSuggestions(); track suggestion.value) {
          <button type="button" (click)="add(suggestion.value)">@if (suggestionTpl()) { <ng-container [ngTemplateOutlet]="suggestionTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: suggestion }" /> } @else { {{ suggestion.label }} }</button>
        }
      </div>
    }
  `,
  styleUrl: './neu-tags.component.scss',
})
export class NeuTagsComponent implements ControlValueAccessor {
  readonly tagTpl = contentChild(NeuTagItemDirective);
  readonly suggestionTpl = contentChild(NeuTagSuggestionDirective);
  readonly label = input('');
  readonly placeholder = input('Add tag...');
  readonly disabled = input(false);
  readonly suggestions = input<Array<string | NeuTagSuggestion>>([]);
  readonly separators = input<string[]>(['Enter', ',']);
  readonly removeLabel = input('Remove');
  readonly valueChange = output<string[]>();
  readonly inputId = `neu-tags-${Math.random().toString(36).slice(2)}`;
  readonly value = signal<string[]>([]);
  readonly draft = signal('');
  readonly cvaDisabled = signal(false);
  readonly filteredSuggestions = computed(() => {
    const q = this.draft().toLowerCase();
    return this.suggestions().map((item) => typeof item === 'string' ? { label: item, value: item } : item).filter((item) => item.label.toLowerCase().includes(q) && !this.value().includes(item.value));
  });
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this.value.set(value ?? []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
  onKeyDown(event: KeyboardEvent): void {
    if (this.separators().includes(event.key)) {
      event.preventDefault();
      this.commitDraft();
    }
    if (event.key === 'Backspace' && !this.draft() && this.value().length) {
      this.remove(this.value()[this.value().length - 1]!);
    }
  }
  commitDraft(): void {
    const tag = this.draft().trim().replace(/,$/, '');
    if (tag) {
      this.add(tag);
    }
    this.onTouched();
  }
  add(tag: string): void {
    if (!this.value().includes(tag)) {
      this.commit([...this.value(), tag]);
    }
    this.draft.set('');
  }
  remove(tag: string): void {
    this.commit(this.value().filter((item) => item !== tag));
  }
  private commit(value: string[]): void {
    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
