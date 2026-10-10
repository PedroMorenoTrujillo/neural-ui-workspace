import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuToolbarComponent } from './neu-toolbar.component';

@Component({
  imports: [NeuToolbarComponent],
  template: `<neu-toolbar dir="rtl">
    <button neu-toolbar-start id="first">First</button>
    <button neu-toolbar-start id="second">Second</button>
    <span neu-toolbar-center>Title</span>
    <button neu-toolbar-end id="last">Last</button>
    <button neu-toolbar-secondary id="secondary">Secondary</button>
  </neu-toolbar>`,
})
class ToolbarHost {}

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuToolbarComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar');
  });

  it('should apply md size class by default', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--md');
  });

  it('should apply sm size class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--sm');
  });

  it('should apply lg size class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--lg');
  });

  it('should apply shadow class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('shadow', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--shadow');
  });

  it('should apply bordered class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('bordered', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--bordered');
  });

  it('should apply brand solid classes', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('tone', 'brand');
    f.componentRef.setInput('variant', 'solid');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--brand');
    expect(f.nativeElement.classList).toContain('neu-toolbar--solid');
  });

  it('should render the three section slots', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--start')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--center')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--end')).toBeTruthy();
  });

  it('preserves projected action order and native keyboard ownership in RTL', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const toolbar = root.querySelector('neu-toolbar')!;
    expect(toolbar.getAttribute('dir')).toBe('rtl');
    expect([...toolbar.querySelectorAll('.neu-toolbar__section--start button')].map((button) => button.id))
      .toEqual(['first', 'second']);
    expect(toolbar.querySelector('.neu-toolbar__section--center')?.textContent).toContain('Title');
    expect(toolbar.querySelector('.neu-toolbar__section--end button')?.id).toBe('last');
    expect(toolbar.querySelector('.neu-toolbar__section--secondary button')?.id).toBe('secondary');
    expect([...toolbar.querySelectorAll('button')].every((button) => button.getAttribute('tabindex') === null)).toBe(true);
    expect(toolbar.getAttribute('role')).toBeNull();
  });
});
