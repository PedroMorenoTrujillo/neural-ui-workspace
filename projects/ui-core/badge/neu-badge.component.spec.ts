import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuBadgeComponent } from './neu-badge.component';

@Component({
  template: `<neu-badge
    [tone]="tone"
    [variant]="variant"
    [size]="size"
    [dot]="dot"
    [pill]="pill"
    >Label</neu-badge
  >`,
  imports: [NeuBadgeComponent],
})
class TestHostComponent {
  tone: any = 'neutral';
  variant: any = 'soft';
  size: any = 'md';
  dot = false;
  pill = true;
}

describe('NeuBadgeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    const el = fixture.nativeElement.querySelector('neu-badge');
    expect(el).toBeTruthy();
  });

  it('should project content', () => {
    expect(fixture.nativeElement.textContent).toContain('Label');
  });

  it('should apply default tone class', () => {
    const el = fixture.nativeElement.querySelector('neu-badge');
    expect(el.classList).toContain('neu-badge--neutral');
  });

  it('should apply tone class when changed', async () => {
    const df = TestBed.createComponent(NeuBadgeComponent);
    df.componentRef.setInput('tone', 'success');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.classList.toString()).toContain('neu-badge--success');
  });

  it('should apply size class', async () => {
    const df = TestBed.createComponent(NeuBadgeComponent);
    df.componentRef.setInput('size', 'sm');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.classList.toString()).toContain('neu-badge--sm');
  });

  it('should render dot element when dot=true', async () => {
    const df = TestBed.createComponent(NeuBadgeComponent);
    df.componentRef.setInput('dot', true);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.querySelector('.neu-badge__dot')).toBeTruthy();
  });

  it('should NOT render dot element when dot=false', () => {
    expect(fixture.nativeElement.querySelector('.neu-badge__dot')).toBeFalsy();
  });

  it('should apply outline class', async () => {
    const df = TestBed.createComponent(NeuBadgeComponent);
    df.componentRef.setInput('variant', 'outline');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.classList.toString()).toContain('neu-badge--outline');
  });

  it('should apply pill class by default', () => {
    const el = fixture.nativeElement.querySelector('neu-badge');
    expect(el.classList).toContain('neu-badge--pill');
  });
});
