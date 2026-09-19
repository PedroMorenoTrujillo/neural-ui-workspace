import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  escapeRichTextAttribute,
  escapeRichTextHtml,
  normalizeRichTextHtml,
  plainTextToRichTextHtml,
  sanitizeRichTextHtml,
} from './neu-rich-text-editor.utils';

export type NeuRichTextEditorSize = 'sm' | 'md' | 'lg';
export type NeuRichTextEditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'removeFormat';

export interface NeuRichTextImageRejectedEvent {
  file: File;
  maxBytes: number;
  reason: 'size';
}

export interface NeuRichTextEditorLabels {
  toolbar: string;
  formatGroup: string;
  listsGroup: string;
  insertGroup: string;
  clearGroup: string;
  bold: string;
  italic: string;
  underline: string;
  unorderedList: string;
  orderedList: string;
  addLink: string;
  addImageUrl: string;
  clearFormat: string;
  linkUrlPrompt: string;
  linkTextPrompt: string;
  imageUrlPrompt: string;
  imageAltPrompt: string;
  imageAltFallback: string;
  pastedImageAlt: string;
}

const DEFAULT_RICH_TEXT_EDITOR_LABELS: NeuRichTextEditorLabels = {
  toolbar: 'Rich text editor',
  formatGroup: 'Text formatting',
  listsGroup: 'Lists',
  insertGroup: 'Insert',
  clearGroup: 'Clear',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  unorderedList: 'Bullet list',
  orderedList: 'Numbered list',
  addLink: 'Add link',
  addImageUrl: 'Add image by URL',
  clearFormat: 'Clear formatting',
  linkUrlPrompt: 'Link URL',
  linkTextPrompt: 'Link text',
  imageUrlPrompt: 'Image URL',
  imageAltPrompt: 'Alternative text',
  imageAltFallback: 'Image',
  pastedImageAlt: 'Pasted image',
};

@Component({
  selector: 'neu-rich-text-editor',
  imports: [NeuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-rich-text-editor-host',
    '[class.neu-rich-text-editor-host--sm]': 'size() === "sm"',
    '[class.neu-rich-text-editor-host--lg]': 'size() === "lg"',
    '[hidden]': 'hidden()',
    '(focusin)': 'onBoundaryFocusIn()',
    '(focusout)': 'onBoundaryFocusOut($event)',
  },
  template: `
    <div class="neu-rich-text-editor" [class.neu-rich-text-editor--disabled]="isDisabledFinal()">
      @if (label()) {
        <label class="neu-rich-text-editor__label" [id]="editorId() + '-label'" [for]="editorId()">
          {{ label() }}
        </label>
      }

      <div
        class="neu-rich-text-editor__frame"
        [class.neu-rich-text-editor__frame--focused]="focused()"
        [class.neu-rich-text-editor__frame--error]="hasError()"
      >
        <div
          class="neu-rich-text-editor__toolbar"
          role="toolbar"
          [attr.aria-label]="mergedLabels().toolbar"
        >
          <div
            class="neu-rich-text-editor__toolbar-group"
            role="group"
            [attr.aria-label]="mergedLabels().formatGroup"
          >
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideBold"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().bold"
              [title]="mergedLabels().bold"
              [disabled]="isInteractionBlocked()"
              (click)="format('bold')"
            ></button>
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideItalic"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().italic"
              [title]="mergedLabels().italic"
              [disabled]="isInteractionBlocked()"
              (click)="format('italic')"
            ></button>
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideUnderline"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().underline"
              [title]="mergedLabels().underline"
              [disabled]="isInteractionBlocked()"
              (click)="format('underline')"
            ></button>
          </div>

          <div
            class="neu-rich-text-editor__toolbar-group"
            role="group"
            [attr.aria-label]="mergedLabels().listsGroup"
          >
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideList"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().unorderedList"
              [title]="mergedLabels().unorderedList"
              [disabled]="isInteractionBlocked()"
              (click)="format('insertUnorderedList')"
            ></button>
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideListOrdered"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().orderedList"
              [title]="mergedLabels().orderedList"
              [disabled]="isInteractionBlocked()"
              (click)="format('insertOrderedList')"
            ></button>
          </div>

          <div
            class="neu-rich-text-editor__toolbar-group"
            role="group"
            [attr.aria-label]="mergedLabels().insertGroup"
          >
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideLink"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().addLink"
              [title]="mergedLabels().addLink"
              [disabled]="isInteractionBlocked()"
              (click)="addLink()"
            ></button>
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideImage"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().addImageUrl"
              [title]="mergedLabels().addImageUrl"
              [disabled]="isInteractionBlocked()"
              (click)="addImageUrl()"
            ></button>
          </div>

          <div
            class="neu-rich-text-editor__toolbar-group"
            role="group"
            [attr.aria-label]="mergedLabels().clearGroup"
          >
            <button
              neu-button
              type="button"
              variant="ghost"
              size="sm"
              icon="lucideEraser"
              [iconOnly]="true"
              [ariaLabel]="mergedLabels().clearFormat"
              [title]="mergedLabels().clearFormat"
              [disabled]="isInteractionBlocked()"
              (click)="format('removeFormat')"
            ></button>
          </div>
        </div>

        @if (variables().length) {
          <div class="neu-rich-text-editor__variables" [attr.aria-label]="variablesAriaLabel()">
            <span class="neu-rich-text-editor__variables-label">{{ variablesLabel() }}</span>
            @for (variable of variables(); track variable) {
              <button
                class="neu-rich-text-editor__variable"
                type="button"
                [disabled]="isInteractionBlocked()"
                (click)="insertVariable(variable)"
              >
                {{ variable }}
              </button>
            }
          </div>
        }

        <div
          #editorRef
          class="neu-rich-text-editor__surface"
          role="textbox"
          aria-multiline="true"
          [id]="editorId()"
          [attr.aria-label]="label() ? null : mergedLabels().toolbar"
          [attr.aria-labelledby]="label() ? editorId() + '-label' : null"
          [attr.contenteditable]="isInteractionBlocked() ? 'false' : 'true'"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.tabindex]="disabled() ? -1 : 0"
          [attr.data-placeholder]="placeholder()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [style.min-height]="minHeight()"
          [innerHTML]="sanitizedValue()"
          (input)="handleInput()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (paste)="handlePaste($event)"
        ></div>
      </div>

      @if (hasError()) {
        <p class="neu-rich-text-editor__error" [id]="editorId() + '-error'" role="alert">
          {{ errorMessage() }}
        </p>
      } @else if (hint()) {
        <p class="neu-rich-text-editor__hint" [id]="editorId() + '-hint'">{{ hint() }}</p>
      }

      @if (showPreview() && sanitizedValue()) {
        <details class="neu-rich-text-editor__preview">
          <summary>{{ previewLabel() }}</summary>
          <div class="neu-rich-text-editor__preview-content" [innerHTML]="sanitizedValue()"></div>
        </details>
      }
    </div>
  `,
  styleUrl: './neu-rich-text-editor.component.scss',
})
export class NeuRichTextEditorComponent implements FormValueControl<string> {
  readonly value = model<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('Write here...');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly size = input<NeuRichTextEditorSize>('md');
  readonly minHeight = input<string>('180px');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly labels = input<Partial<NeuRichTextEditorLabels>>({});
  readonly variables = input<readonly string[]>([]);
  readonly variablesLabel = input<string>('Variables');
  readonly variablesAriaLabel = input<string>('Available variables');
  readonly maxPastedImageBytes = input<number>(1_500_000);
  readonly showPreview = input<boolean>(false);
  readonly previewLabel = input<string>('Preview');
  readonly editorId = input<string>(inject(NeuIdGenerator).getId('neu-rich-text-editor-'));

  readonly imageRejected = output<NeuRichTextImageRejectedEvent>();
  readonly valueCommitted = output<string>();
  readonly touch = output<void>();

  protected readonly focused = signal(false);
  private readonly editorRef = viewChild<ElementRef<HTMLDivElement>>('editorRef');

  private destroyed = false;
  private readonly activeReaders = new Set<FileReader>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private boundaryStart: string | null = null;
  private touchSent = false;
  private lastRenderedValue = '';

  constructor() {
    afterRenderEffect(() => {
      const html = this.sanitizedValue();
      if (html !== this.lastRenderedValue && this.activeReaders.size) this.abortReaders();
      this.lastRenderedValue = html;
      this.renderValue(html);
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.abortReaders();
    });
  }

  readonly isDisabledFinal = computed(() => this.disabled());
  readonly isInteractionBlocked = computed(() => this.disabled() || this.readonly());
  readonly sanitizedValue = computed(() => normalizeRichTextHtml(this.value() ?? ''));
  readonly mergedLabels = computed<NeuRichTextEditorLabels>(() => ({
    ...DEFAULT_RICH_TEXT_EDITOR_LABELS,
    ...this.labels(),
  }));
  readonly hasError = computed(
    () => this.invalid() || this.errors().length > 0 || !!this.errorMessage(),
  );
  readonly ariaDescribedBy = computed(() => {
    if (this.hasError()) {
      return `${this.editorId()}-error`;
    }
    return this.hint() ? `${this.editorId()}-hint` : null;
  });

  format(command: NeuRichTextEditorCommand): void {
    if (this.isInteractionBlocked()) return;
    this.focus();
    this.document.execCommand?.(command);
    this.syncValueFromEditor();
  }

  addLink(): void {
    if (this.isInteractionBlocked()) return;
    const url = this.document.defaultView?.prompt(this.mergedLabels().linkUrlPrompt);
    if (!url) return;
    const text = this.document.defaultView?.prompt(this.mergedLabels().linkTextPrompt) || url;
    this.insertHtml(`<a href="${escapeRichTextAttribute(url)}">${escapeRichTextHtml(text)}</a>`);
  }

  addImageUrl(): void {
    if (this.isInteractionBlocked()) return;
    const url = this.document.defaultView?.prompt(this.mergedLabels().imageUrlPrompt);
    if (!url) return;
    const alt =
      this.document.defaultView?.prompt(this.mergedLabels().imageAltPrompt) ||
      this.mergedLabels().imageAltFallback;
    this.insertHtml(
      `<img src="${escapeRichTextAttribute(url)}" alt="${escapeRichTextAttribute(alt)}">`,
    );
  }

  insertVariable(variable: string): void {
    if (this.isInteractionBlocked()) return;
    this.insertHtml(escapeRichTextHtml(variable));
  }

  handleInput(): void {
    this.syncValueFromEditor();
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {}

  onBoundaryFocusIn(): void {
    if (this.disabled()) return;
    this.focused.set(true);
    this.touchSent = false;
    if (this.boundaryStart === null) this.boundaryStart = this.value();
  }

  onBoundaryFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    queueMicrotask(() => {
      const host = this.editorRef()?.nativeElement.closest('neu-rich-text-editor');
      if (host?.contains(this.document.activeElement)) return;
      this.focused.set(false);
      this.markTouched();
      const start = this.boundaryStart;
      this.boundaryStart = null;
      if (start !== null && start !== this.value()) this.valueCommitted.emit(this.value());
    });
  }

  handlePaste(event: ClipboardEvent): void {
    if (this.isInteractionBlocked()) return;

    const imageFile = Array.from(event.clipboardData?.files ?? []).find((file) =>
      file.type.startsWith('image/'),
    );
    if (imageFile) {
      event.preventDefault();
      this.insertPastedImage(imageFile);
      return;
    }

    const html = event.clipboardData?.getData('text/html');
    if (html) {
      event.preventDefault();
      this.insertHtml(sanitizeRichTextHtml(html));
      return;
    }

    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      event.preventDefault();
      this.insertHtml(plainTextToRichTextHtml(text));
    }
  }

  private insertPastedImage(file: File): void {
    const maxBytes = this.maxPastedImageBytes();
    if (file.size > maxBytes) {
      this.imageRejected.emit({ file, maxBytes, reason: 'size' });
      return;
    }

    const FileReaderCtor = this.document.defaultView?.FileReader;
    if (!FileReaderCtor) return;
    const reader = new FileReaderCtor();
    const baseValue = this.value();
    const release = () => {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      this.activeReaders.delete(reader);
    };
    this.activeReaders.add(reader);
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      release();
      if (this.destroyed || this.value() !== baseValue) return;
      this.insertHtml(
        sanitizeRichTextHtml(
          `<img src="${escapeRichTextAttribute(src)}" alt="${escapeRichTextAttribute(
            this.mergedLabels().pastedImageAlt,
          )}">`,
        ),
      );
    };
    reader.onerror = release;
    reader.onabort = release;
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      release();
      throw error;
    }
  }

  private insertHtml(html: string): void {
    this.focus();
    this.document.execCommand?.('insertHTML', false, sanitizeRichTextHtml(html));
    this.syncValueFromEditor();
  }

  private syncValueFromEditor(): void {
    const html = sanitizeRichTextHtml(this.editorRef()?.nativeElement.innerHTML ?? '');
    this.value.set(html);
  }

  focus(): void {
    this.editorRef()?.nativeElement.focus();
  }

  reset(): void {
    this.abortReaders();
    this.focused.set(false);
    this.boundaryStart = null;
    this.touchSent = false;
    this.renderValue(this.sanitizedValue());
  }

  private renderValue(html: string): void {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }

  private abortReaders(): void {
    for (const reader of this.activeReaders) {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      if (reader.readyState === 1) reader.abort();
    }
    this.activeReaders.clear();
  }

  private markTouched(): void {
    if (this.touchSent) return;
    this.touchSent = true;
    this.touch.emit();
  }
}
