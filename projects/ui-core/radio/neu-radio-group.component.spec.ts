import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuRadioGroupComponent } from './neu-radio-group.component';
import { NeuRadioComponent } from './neu-radio.component';

type Role = 'admin' | 'editor' | 'viewer' | 'guest';

@Component({
  imports: [NeuRadioGroupComponent, NeuRadioComponent],
  template: `
    <neu-radio-group
      ariaLabel="Role"
      [value]="selected()"
      (valueChange)="selected.set($event)"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [invalid]="invalid()"
      [pending]="pending()"
    >
      <neu-radio value="admin" label="Admin" [disabled]="allOptionsDisabled()" />
      <neu-radio value="editor" label="Editor" [disabled]="allOptionsDisabled()" />
      <neu-radio
        value="viewer"
        label="Viewer"
        [disabled]="viewerDisabled() || allOptionsDisabled()"
      />
      @if (showDynamic()) {
        <neu-radio value="guest" label="Guest" />
      }
    </neu-radio-group>
    <button id="outside">Outside</button>
  `,
})
class StringHost {
  readonly selected = signal<Role | null>(null);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly invalid = signal(false);
  readonly pending = signal(false);
  readonly viewerDisabled = signal(false);
  readonly allOptionsDisabled = signal(false);
  readonly showDynamic = signal(false);
  readonly group = viewChild.required<NeuRadioGroupComponent<Role>>(NeuRadioGroupComponent);
}

interface Choice {
  id: number;
  label: string;
}

@Component({
  imports: [NeuRadioGroupComponent, NeuRadioComponent],
  template: `<neu-radio-group [value]="selected()" [compareWith]="compare">
    <neu-radio [value]="first" label="First" /><neu-radio [value]="second" label="Second" />
  </neu-radio-group>`,
})
class ObjectHost {
  readonly first: Choice = { id: 1, label: 'First' };
  readonly second: Choice = { id: 2, label: 'Second' };
  readonly selected = signal<Choice | null>({ id: 2, label: 'Equivalent' });
  readonly compare = (left: Choice, right: Choice) => left.id === right.id;
}

function radios(fixture: { nativeElement: HTMLElement }): HTMLInputElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
}

describe('NeuRadioGroupComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders radiogroup semantics, stable names and official ARIA states', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.required.set(true);
    fixture.componentInstance.invalid.set(true);
    fixture.componentInstance.pending.set(true);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('neu-radio-group') as HTMLElement;
    const options = radios(fixture);
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Role');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-busy')).toBe('true');
    expect(new Set(options.map((radio) => radio.name)).size).toBe(1);
    expect(options[0].name).not.toBe('');
  });

  it('selects a typed option exactly once and never echoes a parent write', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.group().value.subscribe(changed);
    radios(fixture)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('editor');
    expect(changed).toHaveBeenCalledExactlyOnceWith('editor');
    changed.mockClear();
    fixture.componentInstance.selected.set('admin');
    fixture.detectChanges();
    expect(radios(fixture)[0].checked).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('uses compareWith for object values', () => {
    const fixture = TestBed.createComponent(ObjectHost);
    fixture.detectChanges();
    expect(radios(fixture).map((radio) => radio.checked)).toEqual([false, true]);
  });

  it('maintains roving tabindex and keyboard selection while skipping disabled options', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.viewerDisabled.set(true);
    fixture.detectChanges();
    let options = radios(fixture);
    expect(options.map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);
    options[0].focus();
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    options = radios(fixture);
    expect(fixture.componentInstance.selected()).toBe('editor');
    expect(document.activeElement).toBe(options[1]);
    expect(options.map((radio) => radio.tabIndex)).toEqual([-1, 0, -1]);
    options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('editor');
    options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('admin');
  });

  it('keeps readonly options focusable and navigable without changing value', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.selected.set('admin');
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    const options = radios(fixture);
    expect(options.every((radio) => !radio.disabled)).toBe(true);
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(options[1]);
    expect(fixture.componentInstance.selected()).toBe('admin');
  });

  it('blocks all selection while disabled', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const options = radios(fixture);
    expect(options.every((radio) => radio.disabled)).toBe(true);
    options[0].dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.componentInstance.selected()).toBeNull();
  });

  it('touches only when focus exits the whole radio group', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.detectChanges();
    const touched = vi.fn();
    fixture.componentInstance.group().touch.subscribe(touched);
    const options = radios(fixture);
    options[0].dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: options[1] }),
    );
    expect(touched).not.toHaveBeenCalled();
    options[1].dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fixture.nativeElement.querySelector('#outside'),
      }),
    );
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('focuses the selected option and keeps reset silent', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.selected.set('editor');
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.group().value.subscribe(changed);
    fixture.componentInstance.group().focus();
    expect(document.activeElement).toBe(radios(fixture)[1]);
    fixture.componentInstance.group().reset();
    expect(changed).not.toHaveBeenCalled();
  });

  it('focuses the first option without a selection and supports reverse arrow wrapping', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.detectChanges();
    const options = radios(fixture);
    fixture.componentInstance.group().focus();
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('viewer');
    options[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('editor');
  });

  it('does nothing when navigation has no enabled options', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.componentInstance.allOptionsDisabled.set(true);
    fixture.detectChanges();
    const options = radios(fixture);
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(fixture.componentInstance.selected()).toBeNull();
  });

  it('updates its typed content query when an option is projected dynamically', () => {
    const fixture = TestBed.createComponent(StringHost);
    fixture.detectChanges();
    expect(radios(fixture)).toHaveLength(3);
    fixture.componentInstance.showDynamic.set(true);
    fixture.detectChanges();
    expect(radios(fixture)).toHaveLength(4);
    expect(radios(fixture)[3].tabIndex).toBe(-1);
  });
});
