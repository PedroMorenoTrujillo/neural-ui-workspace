import { Component, input, signal, type InputSignal, type OnChanges } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuButtonComponent } from '@neural-ui/core/button';
import type {
  NeuTableEditError,
  NeuTableLabels,
  NeuTableMessage,
} from '../../../public/neu-table.types';
import { tableMessage } from '../../semantics/neu-table-labels';

@Component({
  selector: 'neu-table-active-editor',
  standalone: true,
  imports: [FormField, NeuInputComponent, NeuButtonComponent],
  template: `
    <label class="neu-table2__editor-label" [for]="editorId()">{{ label() }}</label>
    <neu-input
      [inputId]="editorId()" [floatingLabel]="false" size="sm"
      [formField]="fields.value"
      [attr.aria-invalid]="errors().length > 0 || null"
      [attr.aria-describedby]="errors().length > 0 ? editorId() + '-errors' : null"
      [attr.aria-busy]="pending() || null"
      (valueChange)="setValue()($event)"
      (keydown.enter)="submit($event)"
      (keydown.escape)="dismiss($event)"
      (focusout)="blur($event)"
    />
    @if (showActions()) {
      <span class="neu-table2__editor-actions" data-neu-selection-stop>
        <button neu-button size="sm" type="button" [disabled]="pending()" (click)="commit()()">{{ text('save') }}</button>
        <button neu-button size="sm" variant="outline" type="button" (click)="cancel()('consumer')">{{ text('cancel') }}</button>
      </span>
    }
    @if (pending()) {
      <span role="status">{{ text('validating') }}</span>
    }
    @if (errors().length > 0) {
      <span [id]="editorId() + '-errors'" role="alert">
        @for (error of errors(); track error.code + ':' + error.message) {
          {{ error.message }}
        }
      </span>
    }
  `,
  styles: `
    :host { position:relative; display:grid; gap:.5rem; min-inline-size:0; padding-block:.5rem; }
    .neu-table2__editor-label { position:absolute; inline-size:1px; block-size:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
    .neu-table2__editor-actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .neu-table2__editor-actions button { block-size:2.25rem; padding-block:0; }
  `,
})
export class NeuTableActiveEditorComponent implements OnChanges {
  readonly messages = input<NeuTableLabels['messages']>();
  protected readonly text = (key: NeuTableMessage) =>
    tableMessage(this.messages(), key, { column: this.label() });
  readonly editorId: InputSignal<string> = input.required();
  readonly label: InputSignal<string> = input.required();
  readonly value: InputSignal<unknown> = input.required();
  readonly errors: InputSignal<readonly NeuTableEditError[]> = input.required();
  readonly pending: InputSignal<boolean> = input.required();
  readonly commitOnBlur: InputSignal<boolean> = input.required();
  readonly showActions = input(true);
  readonly setValue: InputSignal<(value: unknown) => void> = input.required();
  readonly commit: InputSignal<() => void> = input.required();
  readonly cancel: InputSignal<(reason: 'escape' | 'consumer') => void> = input.required();
  private readonly model = signal({ value: '' });
  readonly fields = form(this.model);

  ngOnChanges(): void {
    this.model.set({ value: this.value() == null ? '' : String(this.value()) });
  }

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
    this.cancel()('escape');
  }

  protected blur(event: FocusEvent): void {
    if (!this.commitOnBlur()) return;
    const input = event.currentTarget as HTMLInputElement | null;
    queueMicrotask(() => {
      if (input?.isConnected === true) this.commit()();
    });
  }
}
