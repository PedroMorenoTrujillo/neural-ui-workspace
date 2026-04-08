import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuCardComponent } from './neu-card.component';

@Component({
  template: `
    <neu-card [padding]="padding" [hoverable]="hoverable" [bordered]="bordered" [flat]="flat">
      <div neu-card-header>Título</div>
      <p>Contenido</p>
      <div neu-card-footer>Footer</div>
    </neu-card>
  `,
  imports: [NeuCardComponent],
})
class TestHostComponent {
  padding: any = 'md';
  hoverable = false;
  bordered = false;
  flat = false;
}

describe('NeuCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the card element', () => {
    expect(fixture.nativeElement.querySelector('neu-card')).toBeTruthy();
  });

  it('should have neu-card host class', () => {
    const card = fixture.nativeElement.querySelector('neu-card');
    expect(card.classList).toContain('neu-card');
  });

  it('should project header content', () => {
    expect(fixture.nativeElement.textContent).toContain('Título');
  });

  it('should project body content', () => {
    expect(fixture.nativeElement.textContent).toContain('Contenido');
  });

  it('should project footer content', () => {
    expect(fixture.nativeElement.textContent).toContain('Footer');
  });

  it('should have hoverable class when hoverable=true', () => {
    const df = TestBed.createComponent(NeuCardComponent);
    df.componentRef.setInput('hoverable', true);
    df.detectChanges();
    expect(df.nativeElement.classList).toContain('neu-card--hoverable');
  });

  it('should have bordered class when bordered=true', () => {
    const df = TestBed.createComponent(NeuCardComponent);
    df.componentRef.setInput('bordered', true);
    df.detectChanges();
    expect(df.nativeElement.classList).toContain('neu-card--bordered');
  });

  it('should have flat class when flat=true', () => {
    const df = TestBed.createComponent(NeuCardComponent);
    df.componentRef.setInput('flat', true);
    df.detectChanges();
    expect(df.nativeElement.classList).toContain('neu-card--flat');
  });

  it('should apply padding class to body', () => {
    const df = TestBed.createComponent(NeuCardComponent);
    df.componentRef.setInput('padding', 'lg');
    df.detectChanges();
    const body = df.nativeElement.querySelector('.neu-card__body');
    expect(body.classList).toContain('neu-card__body--lg');
  });
});
