import {
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
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuProgressBarComponent } from '@neural-ui/core/progress-bar';
import type { NeuUploaderError, NeuUploaderFileItem, NeuUploaderSize } from './neu-uploader.types';

export type { NeuUploaderError, NeuUploaderFileItem, NeuUploaderSize } from './neu-uploader.types';

let _neuUploaderIdSeq = 0;

@Component({
  selector: 'neu-uploader',
  imports: [NeuButtonComponent, NeuProgressBarComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuUploaderComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-uploader-host',
    '[class.neu-uploader-host--sm]': 'size() === "sm"',
    '[class.neu-uploader-host--lg]': 'size() === "lg"',
  },
  template: `
    @if (label()) {
      <label class="neu-uploader__label" [for]="inputId()">{{ label() }}</label>
    }

    <input
      #fileInput
      class="neu-uploader__native-input"
      [id]="inputId()"
      type="file"
      [attr.accept]="accept() || null"
      [attr.multiple]="multiple() ? '' : null"
      [disabled]="isDisabledFinal()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="hasError() ? 'true' : null"
      (change)="onNativeInputChange($event)"
    />

    <div
      class="neu-uploader"
      [class.neu-uploader--disabled]="isDisabledFinal()"
      [class.neu-uploader--drag-over]="isDragOver()"
      [class.neu-uploader--error]="hasError()"
      [class.neu-uploader--has-files]="fileItems().length > 0"
      [class.neu-uploader--picker-only]="!dropzone()"
    >
      @if (dropzone()) {
        <div
          class="neu-uploader__dropzone"
          [attr.aria-describedby]="describedBy()"
          (click)="openFilePicker()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <div class="neu-uploader__empty-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div class="neu-uploader__copy">
            <p class="neu-uploader__headline">{{ headlineText() }}</p>
            <p class="neu-uploader__description">{{ descriptionText() }}</p>
          </div>

          <div class="neu-uploader__actions">
            <button
              neu-button
              type="button"
              variant="primary"
              size="sm"
              (click)="openFilePicker(); $event.stopPropagation()"
            >
              {{ chooseLabel() }}
            </button>
            @if (fileItems().length > 0) {
              <button
                neu-button
                type="button"
                variant="outline"
                size="sm"
                (click)="clearFiles($event)"
              >
                {{ clearLabel() }}
              </button>
            }
          </div>
        </div>
      } @else {
        <button
          neu-button
          type="button"
          variant="primary"
          size="sm"
          icon="lucideUpload"
          class="neu-uploader__picker-trigger"
          [disabled]="isDisabledFinal()"
          [attr.aria-label]="pickerButtonAriaLabel()"
          [attr.aria-describedby]="describedBy()"
          (click)="openFilePicker()"
        >
          @if (showPickerText() && chooseLabel()) {
            {{ chooseLabel() }}
          }
        </button>
      }

      @if (shouldShowProgress()) {
        <div class="neu-uploader__progress">
          <neu-progress-bar
            [value]="progress() ?? 0"
            [label]="progressLabel()"
            [showValue]="true"
            size="sm"
          />
        </div>
      }

      @if (fileItems().length > 0) {
        <div class="neu-uploader__summary">
          <span>{{ summaryText() }}</span>
          @if (maxFiles() !== null) {
            <span>{{ fileItems().length }}/{{ maxFiles() }}</span>
          }
        </div>

        <ul class="neu-uploader__list" [attr.aria-label]="listAriaLabel()">
          @for (item of fileItems(); track item.id) {
            <li class="neu-uploader__item">
              <div class="neu-uploader__item-main">
                <span class="neu-uploader__item-name">{{ item.name }}</span>
                <span class="neu-uploader__item-meta">{{ formatBytes(item.size) }}</span>
              </div>
              <button
                class="neu-uploader__remove"
                type="button"
                [disabled]="isDisabledFinal()"
                [attr.aria-label]="removeAriaLabel() + ' ' + item.name"
                (click)="removeFile(item.id, $event)"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          }
        </ul>
      }
    </div>

    @if (hasError()) {
      <p class="neu-uploader__error" [id]="inputId() + '-error'" role="alert">
        {{ displayErrorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-uploader__hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-uploader.component.scss',
})
export class NeuUploaderComponent implements ControlValueAccessor {
  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  label = input<string>('');
  hint = input<string>('');
  errorMessage = input<string>('');
  placeholder = input<string>('Drag files here or select them from your device.');
  pickerDescription = input<string>('Use the button below to choose files from your device.');
  dropzoneLabel = input<string>('Drop files here to add them');
  chooseLabel = input<string>('Choose files');
  clearLabel = input<string>('Clear');
  progressLabel = input<string>('Upload in progress');
  showPickerText = input<boolean>(false);
  showProgress = input<boolean>(true);
  listAriaLabel = input<string>('Selected files');
  removeAriaLabel = input<string>('Remove file');
  acceptedTypesLabel = input<string>('Allowed types');
  maxFileSizeTextLabel = input<string>('Max size');
  fileCountSingularLabel = input<string>('file');
  fileCountPluralLabel = input<string>('files');
  emptySelectionMessage = input<string>('No file was selected.');
  invalidTypeMessage = input<string>('File {{fileName}} does not match the allowed file types.');
  maxFileSizeMessage = input<string>('File {{fileName}} exceeds the allowed maximum size.');
  duplicateFileMessage = input<string>('File {{fileName}} has already been selected.');
  maxFilesMessage = input<string>('You can only select up to {{maxFiles}} files.');
  accept = input<string>('');
  multiple = input<boolean>(true);
  dropzone = input<boolean>(true);
  disabled = input<boolean>(false);
  size = input<NeuUploaderSize>('md');
  maxFiles = input<number | null>(null);
  maxFileSize = input<number | null>(null);
  progress = input<number | null>(null);

  readonly filesSelected = output<File[]>();
  readonly fileRemoved = output<File>();
  readonly filesRejected = output<NeuUploaderError[]>();
  readonly cleared = output<void>();

  readonly inputId = input<string>(`neu-uploader-${++_neuUploaderIdSeq}`);

  protected readonly isDragOver = signal(false);
  protected readonly internalErrors = signal<NeuUploaderError[]>([]);
  protected readonly fileItems = signal<NeuUploaderFileItem[]>([]);

  private readonly cvaDisabled = signal(false);
  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly isDisabledFinal = computed(() => this.disabled() || this.cvaDisabled());
  readonly hasError = computed(() => !!this.displayErrorMessage());
  readonly shouldShowProgress = computed(() => this.showProgress() && this.progress() !== null);
  readonly pickerButtonAriaLabel = computed(() =>
    this.showPickerText() && this.chooseLabel() ? null : this.chooseLabel(),
  );
  readonly describedBy = computed(() => {
    if (this.hasError()) {
      return `${this.inputId()}-error`;
    }
    return this.hint() ? `${this.inputId()}-hint` : null;
  });
  readonly headlineText = computed(() =>
    this.isDragOver() && this.dropzone() ? this.dropzoneLabel() : this.chooseLabel(),
  );
  readonly descriptionText = computed(() => {
    const parts: string[] = [this.dropzone() ? this.placeholder() : this.pickerDescription()];
    if (this.accept()) {
      parts.push(`${this.acceptedTypesLabel()}: ${this.accept()}`);
    }
    if (this.maxFileSize() !== null) {
      parts.push(`${this.maxFileSizeTextLabel()}: ${this.formatBytes(this.maxFileSize() ?? 0)}`);
    }
    return parts.join(' · ');
  });
  readonly summaryText = computed(() => {
    const totalSize = this.fileItems().reduce((acc, item) => acc + item.size, 0);
    const fileCount = this.fileItems().length;
    return `${fileCount} ${fileCount === 1 ? this.fileCountSingularLabel() : this.fileCountPluralLabel()} · ${this.formatBytes(totalSize)}`;
  });
  readonly displayErrorMessage = computed(() => {
    if (this.errorMessage()) {
      return this.errorMessage();
    }
    const [first] = this.internalErrors();
    return first?.message ?? '';
  });

  writeValue(value: File[] | File | null | undefined): void {
    if (!value) {
      this.fileItems.set([]);
      return;
    }

    const files = Array.isArray(value) ? value : [value];
    this.fileItems.set(files.map((file) => this.toItem(file)));
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  openFilePicker(): void {
    if (this.isDisabledFinal()) {
      return;
    }

    this.onTouched();
    this.fileInput().nativeElement.click();
  }

  onDropzoneKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.openFilePicker();
  }

  onNativeInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.consumeFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (!this.dropzone() || this.isDisabledFinal()) {
      return;
    }
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (!this.dropzone()) {
      return;
    }
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    if (!this.dropzone() || this.isDisabledFinal()) {
      return;
    }
    event.preventDefault();
    this.isDragOver.set(false);
    this.consumeFiles(event.dataTransfer?.files ?? null);
  }

  removeFile(id: string, event?: Event): void {
    event?.stopPropagation();
    const current = this.fileItems();
    const match = current.find((item) => item.id === id);
    if (!match) {
      return;
    }

    const next = current.filter((item) => item.id !== id);
    this.fileItems.set(next);
    this.internalErrors.set([]);
    this.emitValue(next);
    this.fileRemoved.emit(match.file);
    this.onTouched();
  }

  clearFiles(event?: Event): void {
    event?.stopPropagation();
    this.fileItems.set([]);
    this.internalErrors.set([]);
    this.fileInput().nativeElement.value = '';
    this.emitValue([]);
    this.cleared.emit();
    this.onTouched();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const base = 1024;
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
    const size = bytes / Math.pow(base, exponent);
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  private consumeFiles(list: FileList | null): void {
    if (!list || list.length === 0) {
      this.reportErrors([
        {
          code: 'empty-selection',
          message: this.emptySelectionMessage(),
        },
      ]);
      return;
    }

    this.onTouched();
    const incoming = Array.from(list);
    const current = this.fileItems();
    const nextItems = this.multiple() ? [...current] : [];
    const errors: NeuUploaderError[] = [];
    const existingIds = new Set(nextItems.map((item) => item.id));

    for (const file of incoming) {
      if (!this.isAcceptedType(file)) {
        errors.push({
          code: 'accept',
          file,
          message: this.interpolate(this.invalidTypeMessage(), { fileName: file.name }),
        });
        continue;
      }

      if (this.maxFileSize() !== null && file.size > (this.maxFileSize() ?? 0)) {
        errors.push({
          code: 'max-file-size',
          file,
          message: this.interpolate(this.maxFileSizeMessage(), { fileName: file.name }),
        });
        continue;
      }

      const item = this.toItem(file);
      if (existingIds.has(item.id)) {
        errors.push({
          code: 'duplicate',
          file,
          message: this.interpolate(this.duplicateFileMessage(), { fileName: file.name }),
        });
        continue;
      }

      if (this.maxFiles() !== null && nextItems.length >= (this.maxFiles() ?? 0)) {
        errors.push({
          code: 'max-files',
          file,
          message: this.interpolate(this.maxFilesMessage(), {
            maxFiles: String(this.maxFiles() ?? 0),
          }),
        });
        continue;
      }

      nextItems.push(item);
      existingIds.add(item.id);

      if (!this.multiple()) {
        break;
      }
    }

    this.fileItems.set(nextItems);
    this.internalErrors.set(errors);
    this.emitValue(nextItems);
    this.filesSelected.emit(nextItems.map((item) => item.file));

    if (errors.length > 0) {
      this.filesRejected.emit(errors);
    }
  }

  private emitValue(items: NeuUploaderFileItem[]): void {
    this.onChange(items.map((item) => item.file));
  }

  private toItem(file: File): NeuUploaderFileItem {
    return {
      id: this.fileSignature(file),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: this.progress(),
    };
  }

  private fileSignature(file: File): string {
    return `${file.name}__${file.size}__${file.lastModified}`;
  }

  private reportErrors(errors: NeuUploaderError[]): void {
    this.internalErrors.set(errors);
    this.filesRejected.emit(errors);
  }

  private interpolate(template: string, values: Record<string, string>): string {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
      template,
    );
  }

  private isAcceptedType(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) {
      return true;
    }

    const acceptedTypes = accept
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    return acceptedTypes.some((rule) => {
      if (rule.startsWith('.')) {
        return fileName.endsWith(rule);
      }

      if (rule.endsWith('/*')) {
        const prefix = rule.slice(0, -1);
        return mimeType.startsWith(prefix);
      }

      return mimeType === rule;
    });
  }
}
