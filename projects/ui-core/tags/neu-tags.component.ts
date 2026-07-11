import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'neu-tags',
  imports: [],
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
          {{ tag }}
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
        @for (suggestion of filteredSuggestions(); track suggestion) {
          <button type="button" (click)="add(suggestion)">{{ suggestion }}</button>
        }
      </div>
    }
  `,
  styleUrl: './neu-tags.component.scss',
})
export class NeuTagsComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('Add tag...');
  readonly disabled = input(false);
  readonly suggestions = input<string[]>([]);
  readonly separators = input<string[]>(['Enter', ',']);
  readonly removeLabel = input('Remove');
  readonly valueChange = output<string[]>();
  readonly inputId = `neu-tags-${Math.random().toString(36).slice(2)}`;
  readonly value = signal<string[]>([]);
  readonly draft = signal('');
  readonly cvaDisabled = signal(false);
  readonly filteredSuggestions = computed(() => {
    const q = this.draft().toLowerCase();
    return this.suggestions().filter((item) => item.toLowerCase().includes(q) && !this.value().includes(item));
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
