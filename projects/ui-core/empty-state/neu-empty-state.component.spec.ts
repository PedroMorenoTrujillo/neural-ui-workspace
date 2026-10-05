import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuEmptyStateComponent } from './neu-empty-state.component';

@Component({
  template: `<neu-empty-state
    [title]="title"
    [description]="desc"
    [actionLabel]="action"
    (action)="clicked = true"
  />`,
  imports: [NeuEmptyStateComponent],
})
class TestHostComponent {
  title = 'No hay datos';
  desc = '';
  action = '';
  clicked = false;
}

describe('NeuEmptyStateComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render title', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
    expect(fixture.nativeElement.querySelector('neu-icon-outlet svg path')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('neu-icon-outlet')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should show description when provided', async () => {
    const df = TestBed.createComponent(NeuEmptyStateComponent);
    df.componentRef.setInput('title', 'No hay datos');
    df.componentRef.setInput('description', 'Intenta de nuevo más tarde');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Intenta de nuevo más tarde');
  });

  it('should NOT show action button when actionLabel is empty', () => {
    const btn = fixture.nativeElement.querySelector('button, [class*="action"]');
    expect(btn).toBeFalsy();
  });

  it('should show action button when actionLabel is provided', async () => {
    const df = TestBed.createComponent(NeuEmptyStateComponent);
    df.componentRef.setInput('title', 'No hay datos');
    df.componentRef.setInput('actionLabel', 'Recargar');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Recargar');
  });

  it('emits one action from its native button without owning navigation', async () => {
    const df = TestBed.createComponent(NeuEmptyStateComponent);
    df.componentRef.setInput('title', 'No hay datos');
    df.componentRef.setInput('actionLabel', 'Recargar');
    df.detectChanges();
    await df.whenStable();
    let clicked = 0;
    df.componentInstance.action.subscribe(() => {
      clicked += 1;
    });
    const button = df.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    button.click();
    expect(clicked).toBe(1);
  });

  it('omits an absent icon and does not invent geometry for an unregistered consumer icon', async () => {
    const df = TestBed.createComponent(NeuEmptyStateComponent);
    df.componentRef.setInput('icon', null);
    df.detectChanges();
    expect(df.nativeElement.querySelector('neu-icon-outlet')).toBeNull();
    df.componentRef.setInput('icon', 'next');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('neu-icon-outlet')).not.toBeNull();
    expect(df.nativeElement.querySelector('neu-icon-outlet svg')).toBeNull();
  });
});
