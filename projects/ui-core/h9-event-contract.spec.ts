import {
  Component,
  OutputRef,
  Type,
  provideZonelessChangeDetection,
  viewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { By } from '@angular/platform-browser';
import { NeuAutocompleteComponent } from './autocomplete/neu-autocomplete.component';
import { NeuInputTagsComponent } from './input-tags/neu-input-tags.component';
import { NeuTreeSelectComponent } from './tree-select/neu-tree-select.component';
import { NeuCascadeSelectComponent } from './cascade-select/neu-cascade-select.component';
import { NeuDateInputComponent } from './date-input/neu-date-input.component';
import { civilDate, localDateTime, localTime } from './date-input/neu-date-value';
import { NeuVirtualListComponent } from './virtual-list/neu-virtual-list.component';
import { NeuDialogComponent } from './modal/neu-modal.component';
import { NeuBottomSheetComponent } from './bottom-sheet/neu-bottom-sheet.component';
import { NeuColorPickerComponent } from './color-picker/neu-color-picker.component';
import { NeuPickListComponent } from './pick-list/neu-pick-list.component';
import { NeuSplitterComponent } from './splitter/neu-splitter.component';
import { NeuSplitButtonComponent } from './split-button/neu-split-button.component';
import { NeuImageViewerDirective } from './image-viewer/neu-image-viewer.component';
import { NeuNumberInputComponent } from './number-input/neu-number-input.component';

function capture<T>(output: OutputRef<T>): T[] {
  const values: T[] = [];
  output.subscribe((value) => values.push(value));
  return values;
}
function mount<T>(type: Type<T>, inputs: Record<string, unknown> = {}): ComponentFixture<T> {
  const f = TestBed.createComponent(type);
  for (const [name, value] of Object.entries(inputs)) f.componentRef.setInput(name, value);
  f.detectChanges();
  return f;
}
function inputText(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
@Component({
  imports: [NeuAutocompleteComponent, NeuInputTagsComponent],
  template: `<neu-autocomplete
      [options]="options"
      optionLabel="label"
      [optionValue]="valueOf"
      (optionActivated)="selected.push($event)"
    />
    <neu-input-tags
      [suggestions]="options"
      optionLabel="label"
      optionValue="value"
      (select)="tagsSelected.push($event)"
    />`,
})
class SelectionHost {
  options = [{ label: 'Alpha', value: 'a' }];
  readonly valueOf = (option: { label: string; value: string }) => option.value;
  selected: unknown[] = [];
  tagsSelected: unknown[] = [];
  autocomplete = viewChild.required(NeuAutocompleteComponent);
  tags = viewChild.required(NeuInputTagsComponent);
}
@Component({
  imports: [NeuImageViewerDirective],
  template: `<img [neuImageViewer]="'image.svg'" />`,
})
class ImageHost {
  viewer = viewChild.required(NeuImageViewerDirective);
}

describe('H9-A2 zoneless runtime event contracts', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('B01 isolates native selection at the input while template and OutputRef receive one domain selection', async () => {
    const f = mount(SelectionHost);
    const host = f.componentInstance;
    const direct = capture(host.autocomplete().optionActivated);
    const tagsDirect = capture(host.tags().select);
    const inputs = Array.from(f.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    for (const input of inputs) {
      let native = 0;
      input.addEventListener('select', () => native++);
      input.value = 'Alpha';
      input.dispatchEvent(new Event('select', { bubbles: true }));
      input.setSelectionRange(0, 2);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(native).toBeGreaterThanOrEqual(1);
    }
    expect(host.selected).toEqual([]);
    expect(host.tagsSelected).toEqual([]);
    expect(direct).toEqual([]);
    expect(tagsDirect).toEqual([]);
    const event = new MouseEvent('click');
    host.autocomplete().selectOption(host.options[0], event);
    host.tags().selectOption(event, host.options[0]);
    expect(host.selected).toEqual([
      { originalEvent: event, option: host.options[0], value: 'a', source: 'pointer' },
    ]);
    expect(host.tagsSelected).toEqual([{ originalEvent: event, value: 'a' }]);
    expect(direct).toEqual(host.selected);
    expect(tagsDirect).toEqual(host.tagsSelected);
    f.destroy();
    inputs.forEach((input) => input.dispatchEvent(new Event('select', { bubbles: true })));
    expect(host.selected).toHaveLength(1);
    expect(host.tagsSelected).toHaveLength(1);
  });

  it('TreeSelect separates query edits, explicit clear, expansion and lazy requests from CVA writes', async () => {
    const root = { value: 'root', label: 'Root', children: [{ value: 'leaf', label: 'Leaf' }] };
    const lazy = { value: 'lazy', label: 'Lazy', lazy: true };
    const f = mount(NeuTreeSelectComponent, { nodes: [root, lazy], clearable: true });
    const c = f.componentInstance;
    const filters = capture(c.filter),
      clears = capture(c.cleared),
      expansions = capture(c.nodeExpansionChange),
      requests = capture(c.nodeExpand);
    const opened = capture(c.opened),
      closed = capture(c.closed);
    c.writeValue(root);
    c.query.set('programmatic');
    f.detectChanges();
    expect(filters).toEqual([]);
    expect(clears).toEqual([]);
    c.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(opened).toHaveLength(1);
    const search = document.querySelector<HTMLInputElement>('.neu-tree-select__search')!;
    inputText(search, 'root');
    inputText(search, 'root');
    inputText(search, '');
    expect(filters).toEqual([{ query: 'root' }, { query: '' }]);
    c.toggleExpanded(root, new MouseEvent('click'));
    c.toggleExpanded(root, new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    c.toggleExpanded(lazy, new MouseEvent('click'));
    expect(expansions).toEqual([
      { node: root, expanded: true },
      { node: root, expanded: false },
      { node: lazy, expanded: true },
    ]);
    expect(requests).toEqual([lazy]);
    c.clear(new MouseEvent('click'));
    expect(clears).toHaveLength(1);
    c.writeValue(null);
    c.setDisabledState(true);
    c.clear(new Event('click'));
    c.toggleExpanded(root, new Event('click'));
    inputText(search, 'disabled');
    expect(clears).toHaveLength(1);
    expect(expansions).toHaveLength(3);
    expect(filters).toHaveLength(2);
    c.close();
    c.close();
    f.detectChanges();
    await f.whenStable();
    expect(closed).toHaveLength(1);
    c.setDisabledState(false);
    c.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(opened).toHaveLength(2);
    expect(filters).toHaveLength(2);
    f.destroy();
    await Promise.resolve();
    expect(closed).toHaveLength(1);
    c['onPanelAttached']();
    c['onPanelDetached']();
    inputText(search, 'late');
    expect(opened).toHaveLength(2);
    expect(filters).toHaveLength(2);
  });

  it('CascadeSelect exposes only changed user group paths, with no selection/restore echo', async () => {
    const leaf = { value: 'leaf', label: 'Leaf' };
    const root = { value: 'root', label: 'Root', children: [leaf] };
    const f = mount(NeuCascadeSelectComponent, { options: [root] });
    const c = f.componentInstance;
    const groups = capture(c.groupChange),
      opened = capture(c.opened),
      closed = capture(c.closed);
    c.openPanel();
    f.detectChanges();
    await f.whenStable();
    expect(opened).toHaveLength(1);
    c.activate(root);
    expect(groups).toEqual([[root]]);
    c.goToDepth(0);
    expect(groups).toHaveLength(1);
    c.goBack();
    expect(groups).toEqual([[root], []]);
    c.activate(root);
    c.activate(leaf);
    f.detectChanges();
    expect(groups).toHaveLength(3);
    expect(closed).toHaveLength(1);
    c.value.set(leaf);
    c.openPanel();
    f.detectChanges();
    expect(groups).toHaveLength(3);
    f.componentRef.setInput('disabled', true);
    c.goBack();
    c.goToDepth(-1);
    c.activate(root);
    expect(groups).toHaveLength(3);
    f.destroy();
    await Promise.resolve();
    expect(closed).toHaveLength(1);
  });

  for (const mode of ['date', 'datetime', 'multiple', 'range', 'time'] as const) {
    it(`DateInput ${mode} emits real lifecycle and navigation only, with exclusive interval end`, async () => {
      const f = mount(NeuDateInputComponent, { mode });
      const c = f.componentInstance;
      const views = capture(c.viewChange),
        opened = capture(c.opened),
        closed = capture(c.closed),
        clears = capture(c.cleared);
      c.value.set(
        (mode === 'range' ? { start: null, end: null } : mode === 'multiple' ? [] : null) as never,
      );
      c.navigateMonth(1);
      expect(views).toHaveLength(0);
      c.toggle();
      f.detectChanges();
      await f.whenStable();
      expect(opened).toHaveLength(1);
      c.navigateMonth(1);
      expect(views).toHaveLength(mode === 'time' ? 0 : 1);
      c.navigateMonth(-1);
      if (mode !== 'time') {
        expect(views[0].end > views[0].start).toBe(true);
      }
      const count = views.length;
      c.value.set(
        (mode === 'range'
          ? { start: civilDate('2026-01-01'), end: null }
          : mode === 'multiple'
            ? [civilDate('2026-01-01')]
            : mode === 'time'
              ? localTime('10:00')
              : mode === 'datetime'
                ? localDateTime('2026-01-01T10:00')
                : civilDate('2026-01-01')) as never,
      );
      f.detectChanges();
      expect(views).toHaveLength(count);
      expect(clears).toHaveLength(0);
      f.componentRef.setInput('disabled', true);
      c.navigateMonth(1);
      c.clear();
      expect(views).toHaveLength(count);
      expect(clears).toHaveLength(0);
      f.componentRef.setInput('disabled', false);
      c.clear();
      expect(clears).toHaveLength(1);
      c.close();
      f.detectChanges();
      await f.whenStable();
      expect(closed).toHaveLength(1);
      c.toggle();
      f.detectChanges();
      await f.whenStable();
      f.destroy();
      expect(opened).toHaveLength(2);
      expect(closed).toHaveLength(1);
      c.navigateMonth(1);
      expect(views).toHaveLength(count);
    });
  }

  for (const component of [NeuDialogComponent, NeuBottomSheetComponent]) {
    it(`${component.name}: closed is a request; hidden follows actual removal, not destroy`, async () => {
      const f = mount(component as Type<NeuDialogComponent | NeuBottomSheetComponent>);
      const c = f.componentInstance;
      const opened = capture(c.opened),
        hidden = capture(c.hidden),
        requested = capture(c.closed);
      f.componentRef.setInput('open', true);
      f.detectChanges();
      await f.whenStable();
      expect(opened).toHaveLength(1);
      if (c instanceof NeuDialogComponent) c.close('result');
      else c.requestClose();
      f.detectChanges();
      await f.whenStable();
      expect(requested).toHaveLength(1);
      expect(hidden).toHaveLength(0);
      f.componentRef.setInput('open', false);
      f.detectChanges();
      await f.whenStable();
      expect(hidden).toHaveLength(1);
      expect(requested).toHaveLength(1);
      f.detectChanges();
      expect(hidden).toHaveLength(1);
      f.componentRef.setInput('open', true);
      f.detectChanges();
      await f.whenStable();
      f.destroy();
      await Promise.resolve();
      expect(hidden).toHaveLength(1);
      expect(opened).toHaveLength(2);
    });
  }

  it('ColorPicker emits one completion per changed continuous edit, not per input/preset/write/cancel', async () => {
    const f = mount(NeuColorPickerComponent);
    const c = f.componentInstance;
    const ends = capture(c.colorChangeEnd),
      opened = capture(c.opened),
      closed = capture(c.closed);
    c['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(opened).toHaveLength(1);
    const hue = document.querySelector<HTMLInputElement>('.neu-cp__hue-slider')!;
    inputText(hue, '120');
    inputText(hue, '130');
    expect(ends).toHaveLength(0);
    hue.dispatchEvent(new Event('change'));
    hue.dispatchEvent(new Event('change'));
    expect(ends).toHaveLength(1);
    inputText(hue, '140');
    c.writeValue('#ff0000');
    hue.dispatchEvent(new Event('change'));
    expect(ends).toHaveLength(1);
    c['_pickSwatch']('#00ff00');
    c['_onTextChange']('#0000ff');
    c['finishColorChange']();
    expect(ends).toHaveLength(1);
    inputText(hue, '200');
    c['cancelColorChange']();
    c['finishColorChange']();
    expect(ends).toHaveLength(1);
    c.setDisabledState(true);
    inputText(hue, '20');
    c['finishColorChange']();
    expect(ends).toHaveLength(1);
    c.setDisabledState(false);
    c['_toggle']();
    f.detectChanges();
    expect(closed).toHaveLength(1);
    c['_toggle']();
    f.detectChanges();
    f.destroy();
    c['finishColorChange']();
    expect(closed).toHaveLength(1);
  });

  it('PickList publishes domain selection snapshots for toggles and transfer, never source/target writes', () => {
    const a = { value: 'a', label: 'A' },
      b = { value: 'b', label: 'B', disabled: true };
    const f = mount(NeuPickListComponent, { source: [a, b], target: [a] });
    const c = f.componentInstance;
    const source = capture(c.sourceSelectionChange),
      target = capture(c.targetSelectionChange);
    c.toggleSource('a');
    expect(source).toEqual([[a]]);
    c.toggleSource('b');
    expect(source).toHaveLength(1);
    c.moveToTarget();
    expect(source).toEqual([[a], []]);
    c.moveToTarget();
    expect(source).toHaveLength(2);
    c.toggleTarget('a');
    expect(target).toEqual([[a]]);
    c.moveToSource();
    expect(target).toEqual([[a], []]);
    f.componentRef.setInput('source', []);
    f.detectChanges();
    expect(source).toHaveLength(2);
    f.destroy();
    c.toggleSource('a');
    c.toggleTarget('a');
    expect(source).toHaveLength(2);
    expect(target).toHaveLength(2);
  });

  it('Splitter publishes changed live sizes only during drag, preserves keyboard commits and releases on destroy', async () => {
    const f = mount(NeuSplitterComponent, { panes: [{ size: 50 }, { size: 50 }] });
    await f.whenStable();
    const c = f.componentInstance;
    Object.defineProperty(f.nativeElement, 'offsetWidth', { value: 1000 });
    const starts = capture(c.resizeStart),
      live = capture(c.resize),
      commits = capture(c.sizeChange);
    const handle = f.nativeElement.querySelector('.neu-splitter__handle') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));
    expect(starts).toEqual([[50, 50]]);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));
    expect(live).toEqual([[60, 40]]);
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(commits).toEqual([[60, 40]]);
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(commits).toHaveLength(2);
    expect(starts).toHaveLength(1);
    expect(live).toHaveLength(1);
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100 }));
    f.destroy();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(live).toHaveLength(1);
    expect(commits).toHaveLength(2);
  });

  it('SplitButton menu lifecycle is distinct from primary/action clicks and does not echo on destroy', async () => {
    const f = mount(NeuSplitButtonComponent, { actions: [{ id: 'save', label: 'Save' }] });
    const c = f.componentInstance;
    const opened = capture(c.opened),
      closed = capture(c.closed),
      actions = capture(c.actionClick);
    c.onPrimaryClick(new MouseEvent('click'));
    expect(opened).toHaveLength(0);
    c.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    f.detectChanges();
    await f.whenStable();
    expect(opened).toHaveLength(1);
    c.onActionClick(c.actions()[0]);
    f.detectChanges();
    expect(closed).toHaveLength(1);
    expect(actions).toHaveLength(1);
    c.closeDropdown();
    f.detectChanges();
    expect(closed).toHaveLength(1);
    f.componentRef.setInput('disabled', true);
    c.toggleDropdown(new MouseEvent('click'));
    f.detectChanges();
    expect(opened).toHaveLength(1);
    f.componentRef.setInput('disabled', false);
    c.toggleDropdown(new MouseEvent('click'));
    f.detectChanges();
    await f.whenStable();
    f.destroy();
    expect(closed).toHaveLength(1);
  });

  it('ImageViewer portal lifecycle is idempotent for keyboard/imperative commands and silent on owner destruction', () => {
    const f = mount(ImageHost);
    const c = f.componentInstance.viewer();
    const opened = capture(c.opened),
      closed = capture(c.closed);
    c.openFromKeyboard(new KeyboardEvent('keydown', { key: 'Enter' }));
    c.open();
    expect(opened).toHaveLength(1);
    c.close();
    c.close();
    expect(closed).toHaveLength(1);
    c.open();
    f.destroy();
    c.open();
    expect(opened).toHaveLength(2);
    expect(closed).toHaveLength(1);
  });

  it('NumberInput reports editing detail while its model is the only committed value channel', () => {
    const f = mount(NeuNumberInputComponent);
    const c = f.componentInstance;
    const details = capture(c.inputDetail),
      values = capture(c.value);
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    for (const value of ['-', '1e', '12.5', '']) inputText(input, value);
    expect(details).toEqual([
      { rawText: '-', value: null, state: 'incomplete' },
      { rawText: '1e', value: null, state: 'incomplete' },
      { rawText: '12.5', value: 12.5, state: 'valid' },
      { rawText: '', value: null, state: 'valid' },
    ]);
    expect(values).toEqual([12.5, null]);
    f.componentRef.setInput('value', 10);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    inputText(input, '20');
    expect(details).toHaveLength(4);
    f.destroy();
    inputText(input, '30');
    expect(details).toHaveLength(4);
  });

  it('VirtualList emits distinct rendered ranges for programmatic range updates and unsubscribes at destruction', async () => {
    const f = TestBed.createComponent(NeuVirtualListComponent);
    const c = f.componentInstance;
    const ranges = capture(c.rangeChange);
    f.componentRef.setInput(
      'items',
      Array.from({ length: 100 }, (_, i) => i),
    );
    f.detectChanges();
    await f.whenStable();
    const viewport = f.debugElement.query(By.directive(CdkVirtualScrollViewport))
      .componentInstance as CdkVirtualScrollViewport;
    ranges.length = 0;
    viewport.setRenderedRange({ start: 20, end: 30 });
    viewport.setRenderedRange({ start: 20, end: 30 });
    expect(ranges).toEqual([{ start: 20, end: 30 }]);
    viewport.setRenderedRange({ start: 21, end: 31 });
    expect(ranges).toHaveLength(2);
    f.destroy();
    viewport.setRenderedRange({ start: 30, end: 40 });
    expect(ranges).toHaveLength(2);
  });
});

describe('H9-A2 overlay and pointer cancellation races', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );
  for (const type of [
    NeuTreeSelectComponent,
    NeuCascadeSelectComponent,
    NeuDateInputComponent,
    NeuColorPickerComponent,
    NeuSplitButtonComponent,
  ]) {
    it(`${type.name} does not amplify repeated attachment/detachment notifications or late callbacks`, async () => {
      const f = mount(
        type as Type<
          | NeuTreeSelectComponent
          | NeuCascadeSelectComponent
          | NeuDateInputComponent
          | NeuColorPickerComponent
          | NeuSplitButtonComponent
        >,
      );
      const c = f.componentInstance,
        opens = capture(c.opened),
        closes = capture(c.closed);
      const lifecycle = c as unknown as { onPanelAttached(): void; onPanelDetached(): void };
      lifecycle.onPanelDetached();
      expect(closes).toEqual([]);
      lifecycle.onPanelAttached();
      lifecycle.onPanelAttached();
      expect(opens).toHaveLength(1);
      lifecycle.onPanelDetached();
      lifecycle.onPanelDetached();
      expect(closes).toHaveLength(1);
      if (c instanceof NeuTreeSelectComponent || c instanceof NeuSplitButtonComponent)
        c.onOverlayAttach();
      f.destroy();
      await Promise.resolve();
      lifecycle.onPanelAttached();
      lifecycle.onPanelDetached();
      expect(opens).toHaveLength(1);
      expect(closes).toHaveLength(1);
    });
  }

  it('TreeSelect expansion ignores leaves and preserves last-node keyboard navigation with lifecycle events', async () => {
    const leaf = { value: 'leaf', label: 'Leaf' },
      root = { value: 'root', label: 'Root', children: [leaf] };
    const f = mount(NeuTreeSelectComponent, { nodes: [root, leaf], searchable: false });
    const c = f.componentInstance;
    const changes = capture(c.nodeExpansionChange);
    c.toggleExpanded(leaf, new Event('click'));
    expect(changes).toEqual([]);
    c.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    f.detectChanges();
    await f.whenStable();
    const last = document.querySelector<HTMLElement>('[data-neu-tree-select-index="1"]');
    expect(document.activeElement).toBe(last);
    c.onOverlayKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    c.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    f.detectChanges();
    await f.whenStable();
    const first = document.querySelector<HTMLElement>('[data-neu-tree-select-index="0"]')!;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(changes).toEqual([{ node: root, expanded: true }]);
    c.close();
    f.destroy();
    await Promise.resolve();
  });

  it('TreeSelect does not emit a second event when the consumer destroys it during clear or lazy request', () => {
    const lazy = { value: 'lazy', label: 'Lazy', lazy: true };
    const f = mount(NeuTreeSelectComponent, { nodes: [lazy] });
    const c = f.componentInstance;
    const changes = capture(c.nodeExpansionChange);
    c.nodeExpand.subscribe(() => f.destroy());
    c.toggleExpanded(lazy, new Event('click'));
    expect(changes).toEqual([]);
    const second = mount(NeuTreeSelectComponent);
    const cleared = capture(second.componentInstance.cleared);
    second.componentInstance.selectionChange.subscribe(() => second.destroy());
    second.componentInstance.clear(new Event('click'));
    expect(cleared).toEqual([]);
  });

  it('ColorPicker canvas emits one completion on pointer release and cancels lost capture and pending edits', async () => {
    const f = mount(NeuColorPickerComponent);
    const c = f.componentInstance;
    const ends = capture(c.colorChangeEnd);
    const touched = vi.fn();
    c.registerOnTouched(touched);
    c['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const canvas = document.querySelector<HTMLElement>('.neu-cp__canvas-wrap')!;
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();
    canvas.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10, clientY: 20 }));
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 20, clientY: 30 }));
    expect(ends).toHaveLength(0);
    canvas.dispatchEvent(new MouseEvent('pointerup'));
    canvas.dispatchEvent(new MouseEvent('pointerup'));
    expect(ends).toEqual([c['_textValue']()]);
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 40, clientY: 50 }));
    canvas.dispatchEvent(new Event('pointercancel'));
    canvas.dispatchEvent(new MouseEvent('pointerup'));
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 60, clientY: 70 }));
    canvas.dispatchEvent(new Event('lostpointercapture'));
    canvas.dispatchEvent(new MouseEvent('pointerup'));
    expect(ends).toHaveLength(1);
    const hue = document.querySelector<HTMLInputElement>('.neu-cp__hue-slider')!;
    inputText(hue, String(c['_hue']()));
    hue.dispatchEvent(new Event('change'));
    expect(ends).toHaveLength(1);
    (document.querySelector('.neu-cp__text-input') as HTMLElement).dispatchEvent(new Event('blur'));
    (f.nativeElement.querySelector('.neu-cp__trigger') as HTMLElement).dispatchEvent(
      new Event('blur'),
    );
    expect(touched).toHaveBeenCalledTimes(2);
    canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 70, clientY: 80 }));
    f.destroy();
    c['finishColorChange']();
    c['_onHueChange'](80);
    c['_canvasDown'](new MouseEvent('pointerdown') as PointerEvent);
    expect(ends).toHaveLength(1);
  });

  it('Splitter rejects secondary pointer buttons and empty touch starts without emitting drag lifecycle', async () => {
    const f = mount(NeuSplitterComponent, { panes: [{ size: 50 }, { size: 50 }] });
    await f.whenStable();
    const c = f.componentInstance,
      starts = capture(c.resizeStart),
      live = capture(c.resize);
    c['_startDrag'](new MouseEvent('mousedown', { button: 2 }), 0);
    c['_startTouchDrag']({ touches: [] } as unknown as TouchEvent, 0);
    expect(starts).toEqual([]);
    expect(live).toEqual([]);
    f.destroy();
    c['_startDrag'](new MouseEvent('mousedown'), 0);
    expect(starts).toEqual([]);
  });
});
