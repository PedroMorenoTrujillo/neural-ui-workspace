import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NeuPanelComponent } from './neu-panel.component';
describe('headerless collapsible Panel', () => {
  it('keeps its toggle available without an optional title', async () => {
    TestBed.configureTestingModule({providers: [provideZonelessChangeDetection()]});
    const f = TestBed.createComponent(NeuPanelComponent);
    f.componentRef.setInput('collapsible', true);
    f.componentRef.setInput('initialCollapsed', true);
    f.detectChanges(); await f.whenStable();
    const toggle = f.nativeElement.querySelector('.neu-panel__header button');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click(); f.detectChanges();
    expect(f.componentInstance.effectiveCollapsed()).toBe(false);
  });
});
