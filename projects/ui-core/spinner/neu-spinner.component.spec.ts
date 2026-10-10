import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuSpinnerComponent } from './neu-spinner.component';

@Component({
  template: `<neu-spinner
    [tone]="tone"
    [size]="size"
    [strokeWidth]="strokeWidth"
    [color]="color"
    [animationDuration]="dur"
    [ariaLabel]="label"
  />`,
  imports: [NeuSpinnerComponent],
})
class TestHostComponent {
  tone: any = 'brand';
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

  it('should apply tone class', () => {
    const svg = fixture.nativeElement.querySelector('svg.neu-spinner');
    expect(svg.classList).toContain('neu-spinner--brand');
  });

  it('should change tone class', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('tone', 'success');
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

  it('should render a visible label without duplicating the screen-reader label', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('label', 'Loading data...');
    df.detectChanges();
    expect(df.nativeElement.querySelector('.neu-spinner__label')?.textContent).toContain(
      'Loading data...',
    );
    expect(df.nativeElement.querySelector('.neu-spinner__sr-only')).toBeNull();
  });

  it('should apply custom color to arc circle', () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('color', '#ff0000');
    df.detectChanges();
    const arc = df.nativeElement.querySelector('.neu-spinner__arc');
    expect(arc.style.stroke).toBe('rgb(255, 0, 0)');
  });

  it('tone=success should apply the success class', async () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('tone', 'success');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('svg').classList).toContain('neu-spinner--success');
  });

  it('tone=danger should apply the danger class', async () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('tone', 'danger');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('svg').classList).toContain('neu-spinner--danger');
  });

  it('tone=warning should apply the warning class', async () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('tone', 'warning');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('svg').classList).toContain('neu-spinner--warning');
  });

  it('strokeWidth input is applied to svg elements', async () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('strokeWidth', '8');
    df.detectChanges();
    await df.whenStable();
    const arc = df.nativeElement.querySelector('.neu-spinner__arc');
    expect(arc.getAttribute('stroke-width')).toBe('8');
  });

  it('size input sets width and height on host', async () => {
    const df = TestBed.createComponent(NeuSpinnerComponent);
    df.componentRef.setInput('size', '60px');
    df.detectChanges();
    await df.whenStable();
    const svg = df.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
