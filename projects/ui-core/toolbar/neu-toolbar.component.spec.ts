import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuToolbarComponent } from './neu-toolbar.component';

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuToolbarComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar');
  });

  it('should apply md size class by default', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--md');
  });

  it('should apply sm size class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--sm');
  });

  it('should apply lg size class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--lg');
  });

  it('should apply shadow class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('shadow', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--shadow');
  });

  it('should apply bordered class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('bordered', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--bordered');
  });

  it('should apply primary surface class', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.componentRef.setInput('surface', 'primary');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-toolbar--primary');
  });

  it('should render the three section slots', async () => {
    const f = TestBed.createComponent(NeuToolbarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--start')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--center')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-toolbar__section--end')).toBeTruthy();
  });
});
