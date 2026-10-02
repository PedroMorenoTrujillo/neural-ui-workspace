import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableQueryHostComponent } from './internal/features/query-controls/neu-table-query-host.component';

describe('Table optional query controls', () => {
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

  it('transfers the SSR rendering choice through Angular public state', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const server = TestBed.runInInjectionContext(() => new NeuTableQueryHostComponent());
    expect((server as unknown as { hydrate: boolean }).hydrate).toBe(true);
    const state = TestBed.inject(TransferState).toJson();
    expect(JSON.parse(state)['neu-table-query-controls-ssr']).toBe(true);
  });
});
