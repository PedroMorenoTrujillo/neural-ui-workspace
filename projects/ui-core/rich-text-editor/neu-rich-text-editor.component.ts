import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuButtonComponent } from '@neural-ui/core/button';
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

let _neuRichTextEditorIdSeq = 0;

@Component({
  selector: 'neu-rich-text-editor',
  imports: [NeuButtonComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-rich-text-editor-host',
    '[class.neu-rich-text-editor-host--sm]': 'size() === "sm"',
    '[class.neu-rich-text-editor-host--lg]': 'size() === "lg"',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuRichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="neu-rich-text-editor" [class.neu-rich-text-editor--disabled]="isDisabledFinal()">
      @if (label()) {
        <label class="neu-rich-text-editor__label" [for]="editorId()">{{ label() }}</label>
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
              [disabled]="isDisabledFinal()"
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
                [disabled]="isDisabledFinal()"
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
          [attr.contenteditable]="isDisabledFinal() ? 'false' : 'true'"
          [attr.data-placeholder]="placeholder()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [style.min-height]="minHeight()"
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

      @if (showPreview() && value()) {
        <details class="neu-rich-text-editor__preview">
          <summary>{{ previewLabel() }}</summary>
          <div class="neu-rich-text-editor__preview-content" [innerHTML]="value()"></div>
        </details>
      }
    </div>
  `,
  styleUrl: './neu-rich-text-editor.component.scss',
})
export class NeuRichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Write here...');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly size = input<NeuRichTextEditorSize>('md');
  readonly minHeight = input<string>('180px');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  /**
   * @deprecated Use `labels.toolbar` instead.
   */
  readonly toolbarAriaLabel = input<string>('');
  readonly labels = input<Partial<NeuRichTextEditorLabels>>({});
  readonly variables = input<readonly string[]>([]);
  readonly variablesLabel = input<string>('Variables');
  readonly variablesAriaLabel = input<string>('Available variables');
  readonly maxPastedImageBytes = input<number>(1_500_000);
  readonly showPreview = input<boolean>(false);
  readonly previewLabel = input<string>('Preview');
  readonly editorId = input<string>(`neu-rich-text-editor-${++_neuRichTextEditorIdSeq}`);

  readonly valueChange = output<string>();
  readonly imageRejected = output<NeuRichTextImageRejectedEvent>();

  protected readonly value = signal('');
  protected readonly focused = signal(false);
  private readonly cvaDisabled = signal(false);
  private readonly editorRef = viewChild<ElementRef<HTMLDivElement>>('editorRef');

  private viewReady = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly isDisabledFinal = computed(
    () => this.disabled() || this.readonly() || this.cvaDisabled(),
  );
  readonly mergedLabels = computed<NeuRichTextEditorLabels>(() => ({
    ...DEFAULT_RICH_TEXT_EDITOR_LABELS,
    ...(this.toolbarAriaLabel() ? { toolbar: this.toolbarAriaLabel() } : {}),
    ...this.labels(),
  }));
  readonly hasError = computed(() => !!this.errorMessage());
  readonly ariaDescribedBy = computed(() => {
    if (this.hasError()) {
      return `${this.editorId()}-error`;
    }
    return this.hint() ? `${this.editorId()}-hint` : null;
  });

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderValue(this.value());
  }

  writeValue(value: string | null): void {
    const html = normalizeRichTextHtml(value ?? '');
    this.value.set(html);
    this.renderValue(html);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  format(command: NeuRichTextEditorCommand): void {
    if (this.isDisabledFinal()) return;
    this.focus();
    document.execCommand(command);
    this.syncValueFromEditor();
  }

  addLink(): void {
    if (this.isDisabledFinal()) return;
    const url = window.prompt(this.mergedLabels().linkUrlPrompt);
    if (!url) return;
    const text = window.prompt(this.mergedLabels().linkTextPrompt) || url;
    this.insertHtml(`<a href="${escapeRichTextAttribute(url)}">${escapeRichTextHtml(text)}</a>`);
  }

  addImageUrl(): void {
    if (this.isDisabledFinal()) return;
    const url = window.prompt(this.mergedLabels().imageUrlPrompt);
    if (!url) return;
    const alt =
      window.prompt(this.mergedLabels().imageAltPrompt) || this.mergedLabels().imageAltFallback;
    this.insertHtml(
      `<img src="${escapeRichTextAttribute(url)}" alt="${escapeRichTextAttribute(alt)}">`,
    );
  }

  insertVariable(variable: string): void {
    if (this.isDisabledFinal()) return;
    this.insertHtml(escapeRichTextHtml(variable));
  }

  handleInput(): void {
    this.syncValueFromEditor();
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  handlePaste(event: ClipboardEvent): void {
    if (this.isDisabledFinal()) return;

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

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      this.insertHtml(
        sanitizeRichTextHtml(
          `<img src="${escapeRichTextAttribute(src)}" alt="${escapeRichTextAttribute(
            this.mergedLabels().pastedImageAlt,
          )}">`,
        ),
      );
    };
    reader.readAsDataURL(file);
  }

  private insertHtml(html: string): void {
    this.focus();
    document.execCommand('insertHTML', false, sanitizeRichTextHtml(html));
    this.syncValueFromEditor();
  }

  private syncValueFromEditor(): void {
    const html = sanitizeRichTextHtml(this.editorRef()?.nativeElement.innerHTML ?? '');
    this.value.set(html);
    this.onChange(html);
    this.valueChange.emit(html);
  }

  private focus(): void {
    this.editorRef()?.nativeElement.focus();
  }

  private renderValue(html: string): void {
    const editor = this.editorRef()?.nativeElement;
    if (!this.viewReady || !editor) return;
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }
}
