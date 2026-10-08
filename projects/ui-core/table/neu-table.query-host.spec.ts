import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableQueryHostComponent } from './internal/features/query-controls/neu-table-query-host.component';

describe('Table optional query controls', () => {
  it('renders a Neural disclosure with a chevron, accessible state and no text symbol', async () => {
    TestBed.configureTestingModule({ imports: [NeuTableQueryHostComponent] });
    const fixture = TestBed.createComponent(NeuTableQueryHostComponent);
    const activate = vi.fn();
    fixture.componentRef.setInput('controls', { toggle: { expanded: false, label: 'Expand order 1', controls: null, activate } });
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button[neu-button]') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Expand order 1');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.textContent?.trim()).toBe('');
    button.click();
    expect(activate).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('controls', { toggle: { expanded: true, label: 'Collapse order 1', controls: 'detail-1', content: 'Order 1', activate } });
    await fixture.whenStable();
    expect(button.getAttribute('aria-controls')).toBe('detail-1');
    expect(button.querySelector('svg.expanded')).not.toBeNull();
    expect(button.textContent).toContain('Order 1');
  });

  it('renders CSR controls without requiring hydration or emitting a hydration warning', async () => {
    const warn = vi.spyOn(console, 'warn');
    TestBed.configureTestingModule({ imports: [NeuTableQueryHostComponent] });
    const fixture = TestBed.createComponent(NeuTableQueryHostComponent);
    fixture.componentRef.setInput('controls', {
      search: {
        value: 'Ada',
        begin() {},
        update() {},
        cancel() {},
        commit() {},
        clear() {},
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input[type="search"]').value).toBe('Ada');
    expect(
      warn.mock.calls.some((args) => args.some((value) => String(value).includes('NG0508'))),
    ).toBe(false);
    warn.mockRestore();
  });

  it('loads controlled Neural selection without loading query controls', async () => {
    TestBed.configureTestingModule({ imports: [NeuTableQueryHostComponent] });
    const fixture = TestBed.createComponent(NeuTableQueryHostComponent);
    const activate = vi.fn();
    const enter = vi.fn();
    fixture.componentRef.setInput('controls', { selection: {
      checked: false, indeterminate: true, disabled: false,
      ariaLabel: 'Select all rows', activate, enter,
    } });
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Select all rows');
    expect(input.indeterminate).toBe(true);
    input.click();
    expect(activate).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(false);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(enter).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('neu-table-query-controls')).toBeNull();
  });

  it('transfers the SSR rendering choice through Angular public state', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const server = TestBed.runInInjectionContext(() => new NeuTableQueryHostComponent());
    expect((server as unknown as { hydrate: boolean }).hydrate).toBe(true);
    const state = TestBed.inject(TransferState).toJson();
    expect(JSON.parse(state)['neu-table-query-controls-ssr']).toBe(true);
  });
});
