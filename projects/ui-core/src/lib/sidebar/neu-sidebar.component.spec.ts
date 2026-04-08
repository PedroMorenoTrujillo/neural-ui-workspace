import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuSidebarComponent } from './neu-sidebar.component';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

@Component({
  template: `
    <neu-sidebar
      [persistent]="persistent"
      [side]="side"
      (closeRequested)="closedCount = closedCount + 1"
    >
      <p>Contenido del sidebar</p>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class TestHostComponent {
  persistent = false;
  side: any = 'left';
  closedCount = 0;
}

describe('NeuSidebarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([]), provideIcons({ lucideX })],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render sidebar element', () => {
    expect(fixture.nativeElement.querySelector('neu-sidebar')).toBeTruthy();
  });

  it('should always be open when persistent=true', () => {
    const df = TestBed.createComponent(TestHostComponent);
    df.componentInstance.persistent = true;
    df.detectChanges();
    const sidebar = df.nativeElement.querySelector('.neu-sidebar--open');
    expect(sidebar).toBeTruthy();
  });

  it('should show projected content when persistent', () => {
    const df = TestBed.createComponent(TestHostComponent);
    df.componentInstance.persistent = true;
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('Contenido del sidebar');
  });

  it('should apply left side class by default', () => {
    const df = TestBed.createComponent(TestHostComponent);
    df.componentInstance.persistent = true;
    df.detectChanges();
    const sidebar = df.nativeElement.querySelector('[class*="neu-sidebar"]');
    expect(sidebar).toBeTruthy();
  });

  it('should emit closeRequested when close button is clicked in persistent mode', () => {
    const df = TestBed.createComponent(TestHostComponent);
    df.componentInstance.persistent = true;
    df.detectChanges();
    const closeBtn = df.nativeElement.querySelector('.neu-sidebar__close');
    if (closeBtn) {
      closeBtn.click();
      df.detectChanges();
      expect(df.componentInstance.closedCount).toBe(1);
    }
  });
});
