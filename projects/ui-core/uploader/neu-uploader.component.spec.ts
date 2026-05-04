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

  it('should accept a valid file selection', () => {
    const { comp } = mk({ multiple: true, accept: 'image/*' });
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    const file = createFile('avatar.png');
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(1);
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it('should reject files with invalid type', () => {
    const { comp } = mk({ accept: 'image/*' });
    const rejectSpy = vi.fn();
    comp.filesRejected.subscribe(rejectSpy);
    const file = createFile('report.pdf', 'application/pdf');
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(0);
    expect(rejectSpy).toHaveBeenCalled();
    expect(comp.displayErrorMessage()).toContain('does not match the allowed file types');
  });

  it('should reject files that exceed max size', () => {
    const { comp } = mk({ maxFileSize: 5 });
    const file = createFile('big.png', 'image/png', 10);
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    comp['consumeFiles'](fileList);

    expect(comp.fileItems().length).toBe(0);
    expect(comp.displayErrorMessage()).toContain('exceeds the allowed maximum size');
  });

  it('should cap selection using maxFiles', () => {
    const { comp } = mk({ maxFiles: 1, multiple: true });
    const first = createFile('first.png');
    const second = createFile('second.png');
    const fileList = {
      0: first,
      1: second,
      length: 2,
      item: (index: number) => [first, second][index] ?? null,
    } as unknown as FileList;

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

  it('should remove one file from the list', () => {
    const { comp } = mk();
    const first = createFile('first.png');
    const second = createFile('second.png');
    comp.writeValue([first, second]);

    comp.removeFile(comp.fileItems()[0].id);

    expect(comp.fileItems().length).toBe(1);
    expect(comp.fileItems()[0].name).toBe('second.png');
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
