import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
});
