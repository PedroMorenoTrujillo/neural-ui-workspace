import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideInbox } from '@ng-icons/lucide';
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
      providers: [provideIcons({ lucideInbox })],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render title', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
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

  it('should emit actionClick when button is clicked', async () => {
    const df = TestBed.createComponent(NeuEmptyStateComponent);
    df.componentRef.setInput('title', 'No hay datos');
    df.componentRef.setInput('actionLabel', 'Recargar');
    df.detectChanges();
    await df.whenStable();
    let clicked = false;
    df.componentInstance.action.subscribe(() => {
      clicked = true;
    });
    df.nativeElement.querySelector('button').click();
    expect(clicked).toBe(true);
  });
});
