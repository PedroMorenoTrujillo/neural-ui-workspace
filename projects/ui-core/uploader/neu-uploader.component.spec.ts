import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { NeuUploaderComponent } from './neu-uploader.component';

async function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuUploaderComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function file(name: string, type = 'text/plain', contents = 'content'): File {
  return new File([contents], name, { type, lastModified: 1 });
}

function select(component: NeuUploaderComponent, files: readonly File[]): void {
  component['consumeFiles'](files as unknown as FileList);
}

@Component({
  imports: [NeuUploaderComponent],
  template: `<neu-uploader [dropzone]="dropzone()" [disabled]="disabled()" />`,
})
class UploaderFocusHost {
  readonly dropzone = signal(true);
  readonly disabled = signal(false);
}

@Component({
  imports: [NeuUploaderComponent],
  template: `
    <ng-template #preview let-item><strong class="custom-preview">{{ item.name }} · {{ item.status }}</strong></ng-template>
    <neu-uploader [value]="files()" [previewTemplate]="preview" />
  `,
})
class UploaderPreviewHost { readonly files = signal<readonly File[]>([file('report.txt')]); }

describe('NeuUploaderComponent N2-009', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('uses readonly File[] with [] as the exact empty value', async () => {
    const fixture = await setup();
    expect(fixture.componentInstance.value()).toEqual([]);
    expect(Array.isArray(fixture.componentInstance.value())).toBe(true);
  });

  it.each([true, false])('focuses its visible trigger with dropzone=%s', async (dropzone) => {
    const fixture = TestBed.createComponent(UploaderFocusHost);
    fixture.componentInstance.dropzone.set(dropzone);
    fixture.detectChanges();
    await fixture.whenStable();
    const uploader = fixture.debugElement.query(By.directive(NeuUploaderComponent)).componentInstance as NeuUploaderComponent;
    uploader.focus();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(dropzone ? '.neu-uploader__dropzone' : '.neu-uploader__picker-trigger'));
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      outside.focus();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      uploader.focus();
      expect(document.activeElement).toBe(outside);
    } finally { outside.remove(); }
  });

  it('ignores a drop without a file transfer and still clears drag feedback', async () => {
    const fixture = await setup({ dropzone: true });
    const component = fixture.componentInstance;
    const changed = vi.fn();
    component.value.subscribe(changed);
    component.onDragOver(new Event('dragover', { cancelable: true }) as DragEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader--drag-over')).not.toBeNull();
    const event = new Event('drop', { cancelable: true }) as DragEvent;
    component.onDrop(event);
    expect(event.defaultPrevented).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader--drag-over')).toBeNull();
    expect(component.value()).toEqual([]);
    expect(changed).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'readonly'])('does not remove a file while %s', async (state) => {
    const attachment = file('report.txt');
    const fixture = await setup({ value: [attachment] });
    const component = fixture.componentInstance;
    const removed = vi.fn();
    component.fileRemoved.subscribe(removed);
    const id = component['fileItems']()[0].id;
    fixture.componentRef.setInput(state, true);
    fixture.detectChanges();
    const event = new Event('click', { bubbles: true });
    const stopped = vi.spyOn(event, 'stopPropagation');
    component.removeFile(id, event);
    expect(component.value()).toEqual([attachment]);
    expect(removed).not.toHaveBeenCalled();
    expect(stopped).toHaveBeenCalledTimes(1);
  });

  it('renders a projected file preview and removes it on an owner write', async () => {
    const fixture = TestBed.createComponent(UploaderPreviewHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.custom-preview')?.textContent).toContain('report.txt');
    fixture.componentInstance.files.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-preview')).toBeNull();
  });

  it('gives the icon-only Neural picker button its accessible choose label', async () => {
    const fixture = await setup({ dropzone: false, showPickerText: false, chooseLabel: 'Choose attachment' });
    const trigger = fixture.nativeElement.querySelector('.neu-uploader__picker-trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('Choose attachment');
    fixture.componentRef.setInput('chooseLabel', 'Elegir adjunto');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-label')).toBe('Elegir adjunto');
    fixture.destroy();
  });

  it('adds accepted files using one immutable snapshot and emits contextual detail', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const selected = vi.fn();
    const changes = vi.fn();
    component.filesSelected.subscribe(selected);
    component.value.subscribe(changes);
    const first = file('one.txt');
    const before = component.value();
    select(component, [first]);
    expect(component.value()).toEqual([first]);
    expect(component.value()).not.toBe(before);
    expect(changes).toHaveBeenCalledExactlyOnceWith([first]);
    expect(selected).toHaveBeenCalledExactlyOnceWith([first]);
  });

  it('supports multiple selection and single replacement', async () => {
    const fixture = await setup();
    const one = file('one.txt');
    const two = file('two.txt');
    select(fixture.componentInstance, [one, two]);
    expect(fixture.componentInstance.value()).toEqual([one, two]);
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();
    const replacement = file('replacement.txt');
    select(fixture.componentInstance, [replacement, two]);
    expect(fixture.componentInstance.value()).toEqual([replacement]);
  });

  it('uses file identity for duplicate policy', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const rejected = vi.fn();
    component.filesRejected.subscribe(rejected);
    const first = file('same.txt');
    const sameMetadata = file('same.txt');
    select(component, [first]);
    select(component, [first, sameMetadata]);
    expect(component.value()).toEqual([first, sameMetadata]);
    expect(rejected).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ code: 'duplicate', file: first }),
    ]);
  });

  it('rejects disallowed type, excessive size and max count without value echoes', async () => {
    const fixture = await setup({ accept: 'image/*', maxFileSize: 4, maxFiles: 1 });
    const component = fixture.componentInstance;
    const rejected = vi.fn();
    const changes = vi.fn();
    component.filesRejected.subscribe(rejected);
    component.value.subscribe(changes);
    select(component, [
      file('text.txt'),
      file('large.png', 'image/png', '12345'),
      file('ok.png', 'image/png', '1'),
      file('extra.png', 'image/png', '1'),
    ]);
    expect(component.value().map((entry) => entry.name)).toEqual(['ok.png']);
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(rejected.mock.calls[0][0].map((error: { code: string }) => error.code)).toEqual([
      'accept',
      'max-file-size',
      'max-files',
    ]);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('removes, retries and clears with exactly one domain event per gesture', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const first = file('one.txt');
    const second = file('two.txt');
    select(component, [first, second]);
    const removed = vi.fn();
    const retried = vi.fn();
    const cleared = vi.fn();
    component.fileRemoved.subscribe(removed);
    component.fileRetry.subscribe(retried);
    component.cleared.subscribe(cleared);
    const firstItem = component['fileItems']()[0];
    component.setFileState(firstItem.id, { status: 'error', error: 'Failed' });
    component.retryFile(firstItem.id);
    expect(retried).toHaveBeenCalledTimes(1);
    expect(component['fileItems']()[0].status).toBe('uploading');
    component.removeFile(firstItem.id);
    expect(component.value()).toEqual([second]);
    expect(removed).toHaveBeenCalledExactlyOnceWith(first);
    component.clearFiles();
    expect(component.value()).toEqual([]);
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it('accepts external writes and reset without echo or stale item state', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const changes = vi.fn();
    component.value.subscribe(changes);
    const external = file('external.txt');
    fixture.componentRef.setInput('value', [external]);
    fixture.detectChanges();
    const id = component['fileItems']()[0].id;
    component.setFileState(id, { status: 'error' });
    expect(component['fileItems']()[0].status).toBe('error');
    fixture.componentRef.setInput('value', []);
    fixture.detectChanges();
    expect(component.value()).toEqual([]);
    expect(component['fileItems']()).toEqual([]);
    expect(changes).not.toHaveBeenCalled();
  });

  it('blocks add, drop, remove and clear in readonly and disabled states', async () => {
    const existing = file('existing.txt');
    const fixture = await setup({ value: [existing], readonly: true });
    const component = fixture.componentInstance;
    const id = component['fileItems']()[0].id;
    select(component, [file('blocked.txt')]);
    component.removeFile(id);
    component.clearFiles();
    expect(component.value()).toEqual([existing]);
    expect((fixture.nativeElement.querySelector('.neu-uploader__remove') as HTMLButtonElement).disabled).toBe(true);
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onDrop({
      preventDefault: vi.fn(),
      dataTransfer: { files: [file('drop.txt')] },
    } as unknown as DragEvent);
    expect(component.value()).toEqual([existing]);
  });

  it('provides a keyboard-operable dropzone and one logical touch boundary', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const touch = vi.fn();
    component.touch.subscribe(touch);
    const click = vi.spyOn(component.fileInput().nativeElement, 'click');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    component.onDropzoneKey(event);
    expect(event.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    component.onBoundaryFocusIn();
    component.onBoundaryFocusOut({
      relatedTarget: null,
      currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    component.onBoundaryFocusOut({
      relatedTarget: null,
      currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    expect(touch).toHaveBeenCalledTimes(1);
    const dropzone = fixture.nativeElement.querySelector('.neu-uploader__dropzone');
    expect(dropzone.getAttribute('role')).toBe('button');
    expect(dropzone.getAttribute('tabindex')).toBe('0');
  });

  it('shows drag feedback and accepts a dropped file through the rendered dropzone', async () => {
    const fixture = await setup({ label: 'Evidence' });
    const component = fixture.componentInstance;
    const dropzone = fixture.nativeElement.querySelector('.neu-uploader__dropzone') as HTMLElement;
    const first = file('evidence.txt');
    const selected = vi.fn();
    component.filesSelected.subscribe(selected);

    const over = new Event('dragover', { bubbles: true, cancelable: true });
    dropzone.dispatchEvent(over);
    fixture.detectChanges();
    expect(over.defaultPrevented).toBe(true);
    expect(fixture.nativeElement.querySelector('.neu-uploader--drag-over')).not.toBeNull();

    dropzone.dispatchEvent(new Event('dragleave', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader--drag-over')).toBeNull();

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [first] } });
    dropzone.dispatchEvent(drop);
    fixture.detectChanges();
    expect(drop.defaultPrevented).toBe(true);
    expect(component.value()).toEqual([first]);
    expect(selected).toHaveBeenCalledExactlyOnceWith([first]);
    expect(fixture.nativeElement.querySelector('.neu-uploader__item-name')?.textContent).toContain('evidence.txt');
  });

  it('uses the picker-only trigger and blocks file gestures when disabled', async () => {
    const fixture = await setup({ dropzone: false, showPickerText: false });
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.neu-uploader__picker-trigger') as HTMLButtonElement;
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const picker = vi.spyOn(input, 'click');

    expect(host.querySelector('.neu-uploader__dropzone')).toBeNull();
    trigger.click();
    expect(picker).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
    const before = picker.mock.calls.length;
    trigger.click();
    expect(picker).toHaveBeenCalledTimes(before);
    expect(component.value()).toEqual([]);
  });

  it('accepts a native file selection and exposes retry, remove and clear actions in the rendered list', async () => {
    const fixture = await setup({ maxFiles: 2 });
    const component = fixture.componentInstance;
    const first = file('report.txt');
    const input = fixture.nativeElement.querySelector('.neu-uploader__native-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [first] });
    const selected = vi.fn();
    const retried = vi.fn();
    const removed = vi.fn();
    const cleared = vi.fn();
    component.filesSelected.subscribe(selected);
    component.fileRetry.subscribe(retried);
    component.fileRemoved.subscribe(removed);
    component.cleared.subscribe(cleared);

    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(component.value()).toEqual([first]);
    expect(selected).toHaveBeenCalledExactlyOnceWith([first]);
    expect(fixture.nativeElement.querySelector('.neu-uploader__summary')?.textContent).toContain('1/2');
    const id = component['fileItems']()[0].id;
    component.setFileState(id, { status: 'error', error: 'Network failed' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader__item-meta')?.textContent).toContain('Network failed');
    (fixture.nativeElement.querySelector('.neu-uploader__retry') as HTMLButtonElement).click();
    expect(retried).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader__item--uploading')).not.toBeNull();
    (fixture.nativeElement.querySelector('.neu-uploader__remove') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.value()).toEqual([]);
    expect(removed).toHaveBeenCalledExactlyOnceWith(first);

    Object.defineProperty(input, 'files', { configurable: true, value: [file('again.txt')] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-uploader__actions button:last-child') as HTMLButtonElement).click();
    expect(component.value()).toEqual([]);
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it('opens the file picker from the dropzone body, choose button and Space key', async () => {
    const fixture = await setup();
    const input = fixture.nativeElement.querySelector('.neu-uploader__native-input') as HTMLInputElement;
    const picker = vi.spyOn(input, 'click');
    const dropzone = fixture.nativeElement.querySelector('.neu-uploader__dropzone') as HTMLElement;
    dropzone.click();
    expect(picker).toHaveBeenCalledTimes(1);
    expect(dropzone.querySelector('button')).toBeNull();
    (fixture.nativeElement.querySelector('.neu-uploader__actions button') as HTMLButtonElement).click();
    expect(picker).toHaveBeenCalledTimes(2);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    dropzone.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(picker).toHaveBeenCalledTimes(3);
  });

  it('reports an empty selection and formats byte values', async () => {
    const fixture = await setup();
    const rejected = vi.fn();
    fixture.componentInstance.filesRejected.subscribe(rejected);
    fixture.componentInstance['consumeFiles'](null);
    expect(rejected).toHaveBeenCalledWith([
      expect.objectContaining({ code: 'empty-selection' }),
    ]);
    expect(fixture.componentInstance.formatBytes(0)).toBe('0 B');
    expect(fixture.componentInstance.formatBytes(1536)).toBe('1.5 KB');
  });

  it('matches file extensions and exact MIME types without accepting unrelated files', async () => {
    const fixture = await setup({ accept: '.csv, application/json', multiple: true });
    const csv = file('REPORT.CSV', 'application/octet-stream');
    const json = file('data.bin', 'application/json');
    const rejected = file('photo.png', 'image/png');
    select(fixture.componentInstance, [csv, json, rejected]);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([csv, json]);
    expect(fixture.nativeElement.querySelectorAll('.neu-uploader__item')).toHaveLength(2);
  });

  it('renders explicit progress, item progress, hint and the validation error state', async () => {
    const fixture = await setup({ hint: 'Upload a receipt', showProgress: true, progress: 25 });
    const component = fixture.componentInstance;
    const dropzone = fixture.nativeElement.querySelector('.neu-uploader__dropzone') as HTMLElement;
    expect(dropzone.getAttribute('aria-describedby')).toBe(`${component.inputId()}-hint`);
    const receipt = file('receipt.pdf', 'application/pdf');
    select(component, [receipt]);
    const id = component['fileItems']()[0].id;
    component.setFileState(id, { progress: 50, status: 'uploading' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-uploader__progress')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-uploader__item neu-progress-bar')).toBeTruthy();
    fixture.componentRef.setInput('errorMessage', 'Upload failed');
    fixture.detectChanges();
    expect(dropzone.getAttribute('aria-describedby')).toBe(`${component.inputId()}-error`);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Upload failed');
  });

  it('keeps the picker inert while disabled and records one logical focus exit', async () => {
    const fixture = await setup({ disabled: true, dropzone: false });
    const picker = vi.spyOn(fixture.componentInstance.fileInput().nativeElement, 'click');
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    fixture.componentInstance.openFilePicker();
    fixture.componentInstance.onBoundaryFocusIn();
    fixture.componentInstance.onBoundaryFocusOut({
      relatedTarget: null, currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    fixture.componentInstance.onBoundaryFocusOut({
      relatedTarget: null, currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    expect(picker).not.toHaveBeenCalled();
    expect(touched).toHaveBeenCalledOnce();
  });

  it('derives picker labels and non-dropzone descriptions from applied inputs', async () => {
    const fixture = await setup({ dropzone: false, showPickerText: false, chooseLabel: 'Browse', accept: '.pdf', maxFileSize: 1024 });
    const component = fixture.componentInstance;
    expect(component.pickerButtonAriaLabel()).toBe('Browse');
    expect(component.descriptionText()).toContain('.pdf');
    expect(component.descriptionText()).toContain('1.0 KB');
    fixture.componentRef.setInput('showPickerText', true);
    fixture.detectChanges();
    expect(component.pickerButtonAriaLabel()).toBeNull();
  });

  it('does not open the picker from a readonly dropzone key', async () => {
    const fixture = await setup({ readonly: true });
    const picker = vi.spyOn(fixture.componentInstance.fileInput().nativeElement, 'click');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    fixture.componentInstance.onDropzoneKey(event);
    expect(event.defaultPrevented).toBe(false);
    expect(picker).not.toHaveBeenCalled();
  });

  it('keeps focus within the composite without emitting touch', async () => {
    const fixture = await setup();
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    const root = fixture.nativeElement as HTMLElement;
    const child = root.querySelector('.neu-uploader__native-input') as HTMLElement;
    fixture.componentInstance.onBoundaryFocusOut({ relatedTarget: child, currentTarget: root } as unknown as FocusEvent);
    expect(touched).not.toHaveBeenCalled();
  });

  it('ignores drag and retry gestures when there is no dropzone or matching file', async () => {
    const fixture = await setup({ dropzone: false });
    const component = fixture.componentInstance;
    const preventDefault = vi.fn();
    component.onDragOver({ preventDefault } as unknown as DragEvent);
    component.onDragLeave({ preventDefault } as unknown as DragEvent);
    component.onDrop({ preventDefault } as unknown as DragEvent);
    component.retryFile('missing');
    component.removeFile('missing');
    expect(preventDefault).not.toHaveBeenCalled();
    expect(component.value()).toEqual([]);
  });
});
