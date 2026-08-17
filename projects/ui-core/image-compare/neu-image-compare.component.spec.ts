import { TestBed } from '@angular/core/testing';
import { NeuImageCompareComponent } from './neu-image-compare.component';

describe('NeuImageCompareComponent', () => {
  it('clamps comparison position', async () => {
    await TestBed.configureTestingModule({ imports: [NeuImageCompareComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuImageCompareComponent);
    fixture.componentRef.setInput('beforeSrc', 'before.jpg');
    fixture.componentRef.setInput('afterSrc', 'after.jpg');
    fixture.detectChanges();
    fixture.componentInstance.setPosition(140);
    expect(fixture.componentInstance.position()).toBe(100);
    fixture.componentInstance.setPosition(-10);
    expect(fixture.componentInstance.position()).toBe(0);
    fixture.componentInstance.setPosition(Number.NaN);
    expect(fixture.componentInstance.position()).toBe(50);
  });

  it('clamps the initial input and emits valid changes', async () => {
    await TestBed.configureTestingModule({ imports: [NeuImageCompareComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuImageCompareComponent);
    fixture.componentRef.setInput('beforeSrc', 'before.jpg');
    fixture.componentRef.setInput('afterSrc', 'after.jpg');
    fixture.componentRef.setInput('initialPosition', -20);
    const emitted = vi.fn();
    fixture.componentInstance.positionChange.subscribe(emitted);
    fixture.detectChanges();
    expect(fixture.componentInstance.position()).toBe(0);
    fixture.componentInstance.setPosition(35);
    expect(emitted).toHaveBeenCalledWith(35);
  });
});
