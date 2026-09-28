import {
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { InternalNeuIconOutletComponent, neuStructuralIconPath, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import { neuIconEdit as iconEdit } from '@neural-ui/core/internal';
import { neuIconCheck as iconCheck } from '@neural-ui/core/internal';
import { neuIconX as iconX } from '@neural-ui/core/internal';

export type NeuInlineMode = 'text' | 'number';
export type NeuInlineEditorType = NeuInlineMode | 'select' | 'textarea' | 'date';
export type NeuInlineValue<M extends NeuInlineMode> = M extends 'number'
  ? number | null
  : string;
export type NeuInlineEditorSize = 'sm' | 'md' | 'lg';

export interface NeuInlineEditorCommitEvent<M extends NeuInlineMode = NeuInlineMode> {
  readonly previousValue: NeuInlineValue<M>;
  readonly value: NeuInlineValue<M>;
}

interface NeuInlineEditorValueCommitEvent<V> {
  readonly previousValue: V;
  readonly value: V;
}

@Component({
  selector: 'neu-inline-editor',
  imports: [NeuButtonComponent, InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '(focusout)': 'onEditFocusout($event)',
  },
  template: `
    @if (editing()) {
      <div class="neu-inline-editor__edit">
        <input
          #editorControl
          class="neu-inline-editor__control"
          type="text"
          [inputMode]="type() === 'number' ? 'decimal' : 'text'"
          [value]="draft()"
          [placeholder]="placeholder()"
          [attr.aria-label]="editLabel()"
          [attr.aria-invalid]="draftValid() ? null : 'true'"
          [attr.aria-describedby]="ariaDescribedBy() || null"
          [disabled]="disabled()"
          [readOnly]="readonly()"
          (input)="onDraftInput($any($event.target).value)"
          (keydown)="onEditKeydown($event)"
        />

        <div class="neu-inline-editor__actions">
          <button
            neu-button
            type="button"
            tone="brand" variant="solid"
            [size]="size()"
            [iconOnly]="true"
            [ariaLabel]="saveLabel()"
            [disabled]="disabled() || readonly() || !draftValid()"
            (click)="commit()"
          ><neu-icon-outlet [icon]="iconCheck" [fallbackPath]="iconFallbackPath(iconCheck)" [fallbackText]="iconFallbackText(iconCheck)" size="1em" /></button>
          <button
            neu-button
            type="button"
            tone="neutral" variant="ghost"
            [size]="size()"
            [iconOnly]="true"
            [ariaLabel]="cancelLabel()"
            [disabled]="disabled()"
            (click)="cancel()"
          ><neu-icon-outlet [icon]="iconX" [fallbackPath]="iconFallbackPath(iconX)" [fallbackText]="iconFallbackText(iconX)" size="1em" /></button>
        </div>
      </div>
    } @else {
      <button
        neu-button
        class="neu-inline-editor__display"
        type="button"
        tone="neutral" variant="ghost"
        [size]="size()"
        [disabled]="disabled()"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-label]="editLabel()"
        (click)="beginEdit()"
      >
        <span class="neu-inline-editor__value" [class.neu-inline-editor__value--empty]="isEmpty()">
          {{ displayValue() }}
        </span>
        @if (!readonly()) {
          <neu-icon-outlet [icon]="iconEdit" [fallbackPath]="iconFallbackPath(iconEdit)" [fallbackText]="iconFallbackText(iconEdit)" size="14px" aria-hidden="true" />
        }
      </button>
    }
  `,
  styleUrl: './neu-inline-editor.component.scss',
})
export class NeuInlineEditorControl<V = string | number | null> implements FormValueControl<V> {
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconFallbackText = neuSemanticIconText;
  protected readonly iconCheck = iconCheck;
  protected readonly iconEdit = iconEdit;
  protected readonly iconX = iconX;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly editorControl = viewChild<ElementRef<HTMLInputElement>>('editorControl');

  readonly value = model<V>('' as V);
  readonly type = input<NeuInlineEditorType>('text');
  readonly options = input<readonly unknown[]>([]);
  readonly size = input<NeuInlineEditorSize>('sm');
  readonly placeholder = input('');
  readonly emptyLabel = input('Empty');
  readonly editLabel = input('Edit value');
  readonly saveLabel = input('Save value');
  readonly cancelLabel = input('Cancel edit');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly ariaDescribedBy = input('');
  readonly startInEdit = input(false);
  readonly saveOnBlur = input(false);

  readonly editStart = output<V>();
  readonly editCancel = output<V>();
  readonly valueCommitted = output<NeuInlineEditorValueCommitEvent<V>>();
  readonly touch = output<void>();

  readonly editing = signal(false);
  readonly draft = signal('');
  private readonly snapshot = signal<{ readonly value: V } | null>(null);
  private touchSent = false;

  readonly draftValid = computed(() => {
    if (this.type() !== 'number') return true;
    const text = this.draft().trim();
    return text === '' || Number.isFinite(Number(text));
  });
  readonly isEmpty = computed(() => this.value() === null || this.value() === '');
  readonly displayValue = computed(() =>
    this.isEmpty() ? this.emptyLabel() : String(this.value()),
  );

  constructor() {
    afterNextRender(() => {
      if (this.startInEdit()) this.beginEdit();
    });
  }

  beginEdit(): void {
    if (this.disabled() || this.readonly() || this.editing()) return;
    const current = this.value();
    this.snapshot.set({ value: current });
    this.draft.set(current === null ? '' : String(current));
    this.touchSent = false;
    this.editing.set(true);
    this.editStart.emit(current);
    queueMicrotask(() => this.editorControl()?.nativeElement.focus());
  }

  onDraftInput(value: string): void {
    if (this.disabled() || this.readonly()) return;
    this.draft.set(value);
  }

  commit(): void {
    if (this.disabled() || this.readonly() || !this.editing() || !this.draftValid()) return;
    const snapshot = this.snapshot();
    if (!snapshot) return;
    const previousValue = snapshot.value;

    // An owner write made while editing always wins over the local draft.
    if (!Object.is(this.value(), previousValue)) {
      this.editing.set(false);
      this.editCancel.emit(this.value());
      this.markTouched();
      return;
    }

    const next = this.parseDraft();
    this.value.set(next);
    this.editing.set(false);
    this.valueCommitted.emit({ previousValue, value: next });
    this.markTouched();
  }

  cancel(): void {
    if (!this.editing()) return;
    this.editing.set(false);
    this.draft.set('');
    this.editCancel.emit(this.value());
    this.markTouched();
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    }
  }

  onEditFocusout(event: FocusEvent): void {
    if (!this.editing()) return;
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.host.nativeElement.contains(nextTarget)) return;
    queueMicrotask(() => {
      if (!this.editing()) return;
      if (this.saveOnBlur()) this.commit();
      else this.markTouched();
    });
  }

  focus(options?: FocusOptions): void {
    if (this.disabled()) return;
    const target =
      this.editorControl()?.nativeElement ??
      ((this.host.nativeElement as HTMLElement).querySelector(
        '.neu-inline-editor__display',
      ) as HTMLButtonElement | null);
    target?.focus(options);
  }

  reset(): void {
    this.editing.set(false);
    this.draft.set('');
    this.snapshot.set(null);
    this.touchSent = false;
  }

  hostClasses(): Record<string, boolean> {
    return {
      'neu-inline-editor': true,
      [`neu-inline-editor--${this.size()}`]: true,
      'neu-inline-editor--editing': this.editing(),
      'neu-inline-editor--disabled': this.disabled(),
      'neu-inline-editor--readonly': this.readonly(),
      'neu-inline-editor--invalid': this.invalid() || this.errors().length > 0,
      'neu-inline-editor--hidden': this.hidden(),
    };
  }

  private parseDraft(): V {
    if (this.type() === 'number') {
      const text = this.draft().trim();
      return (text === '' ? null : Number(text)) as V;
    }
    return this.draft() as V;
  }

  private markTouched(): void {
    if (this.touchSent) return;
    this.touchSent = true;
    this.touch.emit();
  }
}

/** Public mode-specialized instance type. */
export type NeuInlineEditorComponent<M extends NeuInlineMode = 'text'> =
  NeuInlineEditorControl<NeuInlineValue<M>>;

/** Runtime Angular component constructor with direct field-value inference. */
export const NeuInlineEditorComponent = NeuInlineEditorControl;
