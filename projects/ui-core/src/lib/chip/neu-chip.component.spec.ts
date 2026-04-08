import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { NeuChipComponent } from './neu-chip.component';

@Component({
  template: `<neu-chip
    [variant]="variant"
    [size]="size"
    [selected]="selected"
    [removable]="removable"
    [disabled]="disabled"
    (selectedChange)="lastSelected = $event"
    (removed)="lastRemoved = true"
    >Tag</neu-chip
  >`,
  imports: [NeuChipComponent],
})
class TestHostComponent {
  variant: any = 'default';
  size: any = 'md';
  selected = false;
  removable = false;
  disabled = false;
  lastSelected: boolean | undefined;
  lastRemoved = false;
}

describe('NeuChipComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render with content', () => {
    expect(fixture.nativeElement.textContent).toContain('Tag');
  });

  it('should apply variant class', async () => {
    const df = TestBed.createComponent(NeuChipComponent);
    df.componentRef.setInput('variant', 'primary');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.className).toContain('neu-chip--primary');
  });

  it('should apply selected class when selected', async () => {
    const df = TestBed.createComponent(NeuChipComponent);
    df.componentRef.setInput('selected', true);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.className).toContain('selected');
  });

  it('should show remove button when removable=true', async () => {
    const df = TestBed.createComponent(NeuChipComponent);
    df.componentRef.setInput('removable', true);
    df.detectChanges();
    await df.whenStable();
    const btn = df.nativeElement.querySelector('[class*="remove"], button[aria-label]');
    expect(btn).toBeTruthy();
  });

  it('should NOT show remove button when removable=false', () => {
    const btn = fixture.nativeElement.querySelector('.neu-chip__remove');
    expect(btn).toBeFalsy();
  });

  it('should emit removed when remove button clicked', async () => {
    const df = TestBed.createComponent(NeuChipComponent);
    df.componentRef.setInput('removable', true);
    df.detectChanges();
    await df.whenStable();
    let removed = false;
    df.componentInstance.removed.subscribe(() => {
      removed = true;
    });
    df.nativeElement.querySelector('.neu-chip__remove').click();
    expect(removed).toBe(true);
  });

  it('should apply disabled class when disabled', async () => {
    const df = TestBed.createComponent(NeuChipComponent);
    df.componentRef.setInput('disabled', true);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.className).toContain('disabled');
  });
});
