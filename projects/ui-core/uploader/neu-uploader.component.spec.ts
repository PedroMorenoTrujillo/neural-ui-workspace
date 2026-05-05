import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideUpload } from '@ng-icons/lucide';
import { NeuUploaderComponent } from './neu-uploader.component';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuUploaderComponent);
  for (const [key, value] of Object.entries(inputs)) {
    f.componentRef.setInput(key, value);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

function createFile(name: string, type = 'image/png', size = 10): File {
  const content = new Uint8Array(size).fill(1);
  return new File([content], name, { type, lastModified: size });
}

function toFileList(...files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (index: number) => files[index] ?? null,
  } as unknown as FileList;
}

describe('NeuUploaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideIcons({ lucideUpload })],
    }).compileComponents();
  });

  it('should render native file input', () => {
    const { f } = mk({ label: 'Adjuntos' });
    expect(f.nativeElement.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('should open picker from keyboard trigger', () => {
    const { f, comp } = mk();
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    comp.onDropzoneKey(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should open the picker when clicking the dropzone', () => {
    const { f } = mk();
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const dropzone = f.nativeElement.querySelector('.neu-uploader__dropzone') as HTMLElement;
    const clickSpy = vi.spyOn(input, 'click');

    dropzone.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should accept a valid file selection', () => {
    const { comp } = mk({ multiple: true, accept: 'image/*' });
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    const file = createFile('avatar.png');
    const fileList = toFileList(file);

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(1);
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it('should process native input changes from the rendered input element', () => {
    const { f, comp } = mk();
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile('input.png');

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: toFileList(file),
    });
    Object.defineProperty(input, 'value', {
      configurable: true,
      value: 'filled',
      writable: true,
    });

    input.dispatchEvent(new Event('change'));
    f.detectChanges();

    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['input.png']);
    expect(input.value).toBe('');
  });

  it('should reject files with invalid type', () => {
    const { comp } = mk({ accept: 'image/*' });
    const rejectSpy = vi.fn();
    comp.filesRejected.subscribe(rejectSpy);
    const file = createFile('report.pdf', 'application/pdf');
    const fileList = toFileList(file);

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(0);
    expect(rejectSpy).toHaveBeenCalled();
    expect(comp.displayErrorMessage()).toContain('does not match the allowed file types');
  });

  it('should reject files that exceed max size', () => {
    const { comp } = mk({ maxFileSize: 5 });
    const file = createFile('big.png', 'image/png', 10);
    const fileList = toFileList(file);

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(0);
    expect(comp.displayErrorMessage()).toContain('exceeds the allowed maximum size');
  });

  it('should cap selection using maxFiles', () => {
    const { comp } = mk({ maxFiles: 1, multiple: true });
    const first = createFile('first.png');
    const second = createFile('second.png');
    const fileList = toFileList(first, second);

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(1);
    expect(comp.displayErrorMessage()).toContain('You can only select up to 1 files');
  });

  it('should show a picker-only variant when dropzone is disabled', () => {
    const { f } = mk({
      dropzone: false,
      pickerDescription: 'Use the button below to browse files.',
    });

    const root = f.nativeElement.querySelector('.neu-uploader') as HTMLElement;
    const pickerTrigger = f.nativeElement.querySelector(
      '.neu-uploader__picker-trigger',
    ) as HTMLElement;
    expect(root.classList.contains('neu-uploader--picker-only')).toBe(true);
    expect(pickerTrigger).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-uploader__picker')).toBeNull();
    expect(root.querySelector('.neu-uploader__copy')).toBeNull();
    expect(root.textContent?.trim()).toBe('');
  });

  it('should open the picker from the picker-only trigger button', () => {
    const { f } = mk({ dropzone: false });
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const trigger = f.nativeElement.querySelector(
      '.neu-uploader__picker-trigger',
    ) as HTMLButtonElement;
    const clickSpy = vi.spyOn(input, 'click');

    trigger.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should optionally render text in the picker-only button', () => {
    const { f } = mk({
      dropzone: false,
      showPickerText: true,
      chooseLabel: 'Subir archivo',
    });

    const pickerTrigger = f.nativeElement.querySelector(
      '.neu-uploader__picker-trigger',
    ) as HTMLElement;

    expect(pickerTrigger.textContent?.trim()).toBe('Subir archivo');
    expect(pickerTrigger.getAttribute('aria-label')).toBeNull();
  });

  it('should clear current files', () => {
    const { comp } = mk();
    const file = createFile('avatar.png');
    comp.writeValue([file]);

    comp.clearFiles();

    expect(comp.fileItems().length).toBe(0);
  });

  it('should clear files from the rendered clear button', () => {
    const { f, comp } = mk();
    comp.writeValue([createFile('avatar.png')]);
    f.detectChanges();

    const buttons = f.nativeElement.querySelectorAll('.neu-uploader__actions button');
    (buttons[1] as HTMLButtonElement).click();
    f.detectChanges();

    expect(comp.fileItems()).toEqual([]);
  });

  it('should remove one file from the list', () => {
    const { comp } = mk();
    const first = createFile('first.png');
    const second = createFile('second.png');
    comp.writeValue([first, second]);

    comp.removeFile(comp.fileItems()[0].id);

    expect(comp.fileItems().length).toBe(1);
    expect(comp.fileItems()[0].name).toBe('second.png');
  });

  it('should remove a file from the rendered remove button', () => {
    const { f, comp } = mk();
    comp.writeValue([createFile('first.png'), createFile('second.png')]);
    f.detectChanges();

    const removeButton = f.nativeElement.querySelector(
      '.neu-uploader__remove',
    ) as HTMLButtonElement;
    removeButton.click();
    f.detectChanges();

    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['second.png']);
  });

  it('should show progress bar when progress is provided', () => {
    const { f } = mk({ progress: 45 });
    expect(f.nativeElement.querySelector('neu-progress-bar')).toBeTruthy();
  });

  it('should not show progress bar when progress is null', () => {
    const { f } = mk({ progress: null });
    expect(f.nativeElement.querySelector('neu-progress-bar')).toBeNull();
  });

  it('should not show progress bar when disabled explicitly', () => {
    const { f } = mk({ progress: 45, showProgress: false });
    expect(f.nativeElement.querySelector('neu-progress-bar')).toBeNull();
  });

  it('should become disabled through CVA', () => {
    const { comp } = mk();
    comp.setDisabledState(true);
    expect(comp.isDisabledFinal()).toBe(true);
  });

  it('should describe the control with the hint when there is no error', () => {
    const { f, comp } = mk({ hint: 'PNG or JPG' });

    expect(comp.describedBy()).toContain('-hint');
    expect(f.nativeElement.querySelector('.neu-uploader__hint')?.textContent).toContain(
      'PNG or JPG',
    );
  });

  it('should prioritize an explicit error message over the hint', () => {
    const { f, comp } = mk({ hint: 'PNG or JPG', errorMessage: 'Upload failed' });
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    expect(comp.displayErrorMessage()).toBe('Upload failed');
    expect(comp.describedBy()).toContain('-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('should build description text with accepted types and max size', () => {
    const { comp } = mk({
      accept: 'image/*,.pdf',
      maxFileSize: 1536,
      acceptedTypesLabel: 'Tipos',
      maxFileSizeTextLabel: 'Tamano maximo',
    });

    expect(comp.descriptionText()).toContain('Tipos: image/*,.pdf');
    expect(comp.descriptionText()).toContain('Tamano maximo: 1.5 KB');
  });

  it('should update drag state and headline while dragging over the dropzone', () => {
    const { comp } = mk({ dropzoneLabel: 'Suelta archivos aqui' });
    const preventDefault = vi.fn();

    comp.onDragOver({ preventDefault } as unknown as DragEvent);
    expect(preventDefault).toHaveBeenCalled();
    expect(comp.isDragOver()).toBe(true);
    expect(comp.headlineText()).toBe('Suelta archivos aqui');

    comp.onDragLeave({ preventDefault } as unknown as DragEvent);
    expect(comp.isDragOver()).toBe(false);
  });

  it('should update drag state through dropzone DOM drag events', () => {
    const { f, comp } = mk();
    const dropzone = f.nativeElement.querySelector('.neu-uploader__dropzone') as HTMLElement;

    dropzone.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(comp.isDragOver()).toBe(true);

    dropzone.dispatchEvent(new Event('dragleave', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(comp.isDragOver()).toBe(false);
  });

  it('should ignore drag and picker actions when disabled', () => {
    const { f, comp } = mk({ disabled: true });
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    const preventDefault = vi.fn();

    comp.openFilePicker();
    comp.onDragOver({ preventDefault } as unknown as DragEvent);

    expect(clickSpy).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
    expect(comp.isDragOver()).toBe(false);
  });

  it('should handle drops and emit selected files', () => {
    const { comp } = mk({ multiple: true });
    const selectedSpy = vi.fn();
    const file = createFile('drop.png');
    comp.filesSelected.subscribe(selectedSpy);
    comp.isDragOver.set(true);

    comp.onDrop({
      preventDefault: vi.fn(),
      dataTransfer: { files: toFileList(file) },
    } as unknown as DragEvent);

    expect(comp.isDragOver()).toBe(false);
    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['drop.png']);
    expect(selectedSpy).toHaveBeenCalledWith([file]);
  });

  it('should reject empty selections', () => {
    const { comp } = mk();
    const rejectSpy = vi.fn();
    comp.filesRejected.subscribe(rejectSpy);

    comp['consumeFiles'](null);

    expect(rejectSpy).toHaveBeenCalled();
    expect(comp.displayErrorMessage()).toBe('No file was selected.');
  });

  it('should reject duplicate files already present in the list', () => {
    const { comp } = mk({ multiple: true });
    const rejectSpy = vi.fn();
    const file = createFile('avatar.png');
    comp.filesRejected.subscribe(rejectSpy);
    comp.writeValue([file]);

    comp['consumeFiles'](toFileList(file));

    expect(comp.fileItems().length).toBe(1);
    expect(rejectSpy).toHaveBeenCalled();
    expect(comp.displayErrorMessage()).toContain('already been selected');
  });

  it('should replace the current list when multiple is disabled', () => {
    const { comp } = mk({ multiple: false });
    const original = createFile('first.png');
    const replacement = createFile('second.png');
    comp.writeValue([original]);

    comp['consumeFiles'](toFileList(replacement));

    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['second.png']);
  });

  it('should accept exact mime types and file extensions from the accept rule', () => {
    const { comp } = mk({ accept: '.csv,application/pdf' });

    expect(comp['isAcceptedType'](createFile('data.csv', 'text/csv'))).toBe(true);
    expect(comp['isAcceptedType'](createFile('report.pdf', 'application/pdf'))).toBe(true);
    expect(comp['isAcceptedType'](createFile('avatar.png', 'image/png'))).toBe(false);
  });

  it('should reset the native input after a change event', () => {
    const { comp } = mk();
    const file = createFile('avatar.png');
    const target = { files: toFileList(file), value: 'filled' } as HTMLInputElement;

    comp.onNativeInputChange({ target } as unknown as Event);

    expect(target.value).toBe('');
    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['avatar.png']);
  });

  it('should clear files, emit cleared and reset the native input value', () => {
    const { f, comp } = mk();
    const clearedSpy = vi.fn();
    const onChange = vi.fn();
    const file = createFile('avatar.png');
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    comp.cleared.subscribe(clearedSpy);
    comp.registerOnChange(onChange);
    comp.writeValue([file]);

    Object.defineProperty(input, 'value', { value: 'filled', writable: true });
    comp.clearFiles();

    expect(comp.fileItems()).toEqual([]);
    expect(input.value).toBe('');
    expect(clearedSpy).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should remove files with event propagation stopped and emit the removed file', () => {
    const { comp } = mk();
    const removedSpy = vi.fn();
    const touchedSpy = vi.fn();
    const first = createFile('first.png');
    const second = createFile('second.png');
    const stopPropagation = vi.fn();
    comp.fileRemoved.subscribe(removedSpy);
    comp.registerOnTouched(touchedSpy);
    comp.writeValue([first, second]);

    comp.removeFile(comp.fileItems()[0].id, { stopPropagation } as unknown as Event);

    expect(stopPropagation).toHaveBeenCalled();
    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['second.png']);
    expect(removedSpy).toHaveBeenCalledWith(first);
    expect(touchedSpy).toHaveBeenCalled();
  });

  it('should format bytes for zero and whole-byte values', () => {
    const { comp } = mk();

    expect(comp.formatBytes(0)).toBe('0 B');
    expect(comp.formatBytes(10)).toBe('10 B');
  });

  it('should write single file values and clear them on null', () => {
    const { comp } = mk();
    const file = createFile('avatar.png');

    comp.writeValue(file);
    expect(comp.fileItems().map((item: any) => item.name)).toEqual(['avatar.png']);

    comp.writeValue(null);
    expect(comp.fileItems()).toEqual([]);
  });
});

describe('NeuUploaderComponent – ReactiveFormsModule integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [provideIcons({ lucideUpload })],
    }).compileComponents();
  });

  it('should integrate with Reactive Forms', () => {
    @Component({
      template: `<neu-uploader [formControl]="ctrl" />`,
      imports: [NeuUploaderComponent, ReactiveFormsModule],
    })
    class HostComponent {
      readonly ctrl = new FormControl<File[] | null>(null);
    }

    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();

    const uploader = f.debugElement.children[0].componentInstance as NeuUploaderComponent;
    const file = createFile('avatar.png');
    uploader.writeValue([file]);
    uploader['emitValue'](uploader['fileItems']());
    f.detectChanges();

    expect(f.componentInstance.ctrl.value?.[0]?.name).toBe('avatar.png');
  });
});
