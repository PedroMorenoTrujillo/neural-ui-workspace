import { PLATFORM_ID, Type, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { NeuAutocompleteComponent } from '../autocomplete/neu-autocomplete.component';
import { NeuCascadeSelectComponent } from '../cascade-select/neu-cascade-select.component';
import { NeuCodeBlockComponent } from '../code-block/neu-code-block.component';
import { NeuCommandPaletteComponent } from '../command-palette/neu-command-palette.component';
import { NeuListboxComponent } from '../listbox/neu-listbox.component';
import { NeuPanelComponent } from '../panel/neu-panel.component';
import { NeuSelectComponent } from '../select/neu-select.component';
import { NeuSpeedDialComponent } from '../speed-dial/neu-speed-dial.component';
import { NeuTreeComponent } from '../tree/neu-tree.component';
import { NeuVirtualListComponent } from '../virtual-list/neu-virtual-list.component';

// These are server-platform lifecycle unit tests, not a substitute for the
// separate Node SSR/hydration smoke test of the packed public entrypoints.
const cases: readonly { name: string; component: Type<unknown>; inputs: Record<string, unknown> }[] = [
  { name: 'Autocomplete', component: NeuAutocompleteComponent, inputs: { options: [{ value: 'a', label: 'Alpha' }] } },
  { name: 'CascadeSelect', component: NeuCascadeSelectComponent, inputs: {} },
  { name: 'CodeBlock', component: NeuCodeBlockComponent, inputs: { code: 'const answer = 42;', language: 'typescript' } },
  { name: 'CommandPalette', component: NeuCommandPaletteComponent, inputs: {} },
  { name: 'Listbox', component: NeuListboxComponent, inputs: { options: [{ value: 'a', label: 'Alpha' }] } },
  { name: 'Panel', component: NeuPanelComponent, inputs: { header: 'Server-rendered panel' } },
  { name: 'Select', component: NeuSelectComponent, inputs: { options: [{ value: 'a', label: 'Alpha' }] } },
  { name: 'SpeedDial', component: NeuSpeedDialComponent, inputs: { items: [{ key: 'save', label: 'Save', icon: 'save' }] } },
  { name: 'Tree', component: NeuTreeComponent, inputs: {
    nodes: [{ key: 'root', data: { id: 'root' }, label: 'Workspace' }],
    hierarchy: { revision: 1, roots: ['root'], children: [] },
  } },
  { name: 'VirtualList', component: NeuVirtualListComponent, inputs: { items: [{ id: 'a' }], itemKey: (item: { id: string }) => item.id } },
];

describe('server-platform lifecycle boundaries', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: PLATFORM_ID, useValue: 'server' }],
  }).compileComponents());

  it.each(cases)('renders and destroys $name without browser focus or scrolling', async ({ component, inputs }) => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const fixture = TestBed.createComponent(component);
    try {
      for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
      expect(focus).not.toHaveBeenCalled();
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    } finally { focus.mockRestore(); }
  });

  it('keeps selector keyboard proposals safe without measuring browser layout', async () => {
    const fixture = TestBed.createComponent(NeuSelectComponent);
    fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
    const geometry = vi.spyOn(trigger, 'getBoundingClientRect');
    try {
      fixture.componentInstance.toggle();
      fixture.detectChanges();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();
      expect(fixture.componentInstance.value()).toBeNull();
      expect(geometry).not.toHaveBeenCalled();
      fixture.destroy();
    } finally { geometry.mockRestore(); }
  });
});
