import { Component, input, linkedSignal, type InputSignal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';

@Component({
  selector: 'neu-tree-table-private-editor',
  standalone: true,
  imports: [FormField],
  template: `
    <label class="neu-tree-table2__editor-label" [for]="editorId()">Edit {{ label() }}</label>
    <input
      [id]="editorId()"
      data-tree-editor
      [formField]="fields.value"
      [attr.aria-invalid]="error() !== null || null"
      [attr.aria-describedby]="error() !== null ? editorId() + '-error' : null"
      (input)="update($event)"
      (keydown.enter)="submit($event)"
      (keydown.escape)="dismiss($event)"
    />
    <span class="neu-tree-table2__editor-actions">
      <button type="button" (click)="commit()()">Save</button>
      <button type="button" (click)="cancel()()">Cancel</button>
    </span>
    @if (error(); as message) {
      <span [id]="editorId() + '-error'" role="alert">{{ message }}</span>
    }
  `,
})
export class NeuTreeTableActiveEditorComponent {
  readonly editorId: InputSignal<string> = input.required();
  readonly label: InputSignal<string> = input.required();
  readonly value: InputSignal<unknown> = input.required();
  readonly error: InputSignal<string | null> = input<string | null>(null);
  readonly setValue: InputSignal<(value: unknown) => void> = input.required();
  readonly commit: InputSignal<() => void> = input.required();
  readonly cancel: InputSignal<() => void> = input.required();
  private readonly model = linkedSignal(() => ({
    value: this.value() === null || this.value() === undefined ? '' : String(this.value()),
  }));
  readonly fields = form(this.model);

  protected update(event: Event): void {
    this.setValue()((event.target as HTMLInputElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.commit()();
  }

  protected dismiss(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cancel()();
  }
}
