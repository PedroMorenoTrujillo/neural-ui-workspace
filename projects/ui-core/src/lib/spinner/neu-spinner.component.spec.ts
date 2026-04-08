import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuSpinnerComponent } from './neu-spinner.component';

@Component({
  template: `<neu-spinner
    [severity]="severity"
    [size]="size"
    [strokeWidth]="strokeWidth"
    [color]="color"
    [animationDuration]="dur"
    [ariaLabel]="label"
  />`,
  imports: [NeuSpinnerComponent],
})
class TestHostComponent {
  severity: any = 'primary';
  size = '40px';
  strokeWidth = '4';
  color = '';
  dur = '1s';
  label = 'Cargando...';
}

describe('NeuSpinnerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render SVG', () => {
    expect(fixture.nativeElement.querySelector('svg.neu-spinner')).toBeTruthy();
  });

  it('should apply severity class', () => {
    const svg = fixture.nativeElement.querySelector('svg.neu-spinner');
    expect(svg.classList).toContain('neu-spinner--primary');
  });

  it('should change severity class', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('severity', 'success');
    df.detectChanges();
    const svg = df.nativeElement.querySelector('svg.neu-spinner');
    expect(svg.classList).toContain('neu-spinner--success');
  });

  it('should apply size as inline style', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('size', '64px');
    df.detectChanges();
    const svg = df.nativeElement.querySelector('svg.neu-spinner');
    expect(svg.style.width).toBe('64px');
    expect(svg.style.height).toBe('64px');
  });

  it('should apply animationDuration', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('animationDuration', '2s');
    df.detectChanges();
    const svg = df.nativeElement.querySelector('svg.neu-spinner');
    expect(svg.style.animationDuration).toBe('2s');
  });

  it('should render accessible label', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('ariaLabel', 'Loading...');
    df.detectChanges();
    expect(df.nativeElement.textContent).toContain('Loading...');
  });

  it('should apply custom color to arc circle', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('color', '#ff0000');
    df.detectChanges();
    const arc = df.nativeElement.querySelector('.neu-spinner__arc');
    expect(arc.style.stroke).toBe('rgb(255, 0, 0)');
  });
});
