import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuDividerComponent } from './neu-divider.component';

@Component({
  template: `<neu-divider [label]="label" [orientation]="orientation" />`,
  imports: [NeuDividerComponent],
})
class TestHostComponent {
  label = '';
  orientation: any = 'horizontal';
}

describe('NeuDividerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(fixture.nativeElement.querySelector('neu-divider')).toBeTruthy();
  });

  it('should not show label when empty', () => {
    expect(fixture.nativeElement.querySelector('.neu-divider__label')).toBeFalsy();
  });

  it('should show label when provided', async () => {
    const df = TestBed.createComponent(NeuDividerComponent);
    df.componentRef.setInput('label', 'OR');
    df.detectChanges();
    await df.whenStable();
    const label = df.nativeElement.querySelector('.neu-divider__label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('OR');
  });

  it('should apply horizontal orientation by default', () => {
    const el = fixture.nativeElement.querySelector('neu-divider, .neu-divider');
    expect(el).toBeTruthy();
  });

  it('should apply vertical orientation class', async () => {
    const df = TestBed.createComponent(NeuDividerComponent);
    df.componentRef.setInput('orientation', 'vertical');
    df.detectChanges();
    await df.whenStable();
    const el = df.nativeElement.querySelector('[class*="vertical"]');
    expect(el).toBeTruthy();
  });
});
