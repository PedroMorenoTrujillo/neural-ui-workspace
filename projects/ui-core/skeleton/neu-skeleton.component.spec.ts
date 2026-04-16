import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuSkeletonComponent } from './neu-skeleton.component';

@Component({
  template: `<neu-skeleton
    [variant]="variant"
    [width]="width"
    [height]="height"
    [borderRadius]="radius"
  />`,
  imports: [NeuSkeletonComponent],
})
class TestHostComponent {
  variant: any = 'rect';
  width = '100%';
  height = '16px';
  radius = '';
}

describe('NeuSkeletonComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(fixture.nativeElement.querySelector('neu-skeleton')).toBeTruthy();
  });

  it('should apply rect variant class by default', () => {
    const el = fixture.nativeElement.querySelector(
      '[class*="neu-skeleton--rect"], .neu-skeleton--rect, [class*="rect"]',
    );
    expect(el).toBeTruthy();
  });

  it('should apply circle variant class', () => {
    const df = TestBed.createComponent(NeuSkeletonComponent);
    df.componentRef.setInput('variant', 'circle');
    df.detectChanges();
    expect(df.nativeElement.className).toContain('circle');
  });

  it('should apply text variant', () => {
    const df = TestBed.createComponent(NeuSkeletonComponent);
    df.componentRef.setInput('variant', 'text');
    df.detectChanges();
    expect(df.nativeElement.className).toContain('text');
  });
});
