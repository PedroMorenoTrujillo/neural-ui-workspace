import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DialogModule } from '@angular/cdk/dialog';
import { NeuDialogComponent } from './neu-modal.component';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

@Component({
  template: `
    <neu-dialog
      [open]="open"
      [title]="title"
      [size]="size"
      [disableClose]="disableClose"
      (closed)="open = false; closed = true"
    >
      <p>Contenido del diálogo</p>
    </neu-dialog>
  `,
  imports: [NeuDialogComponent],
})
class TestHostComponent {
  open = false;
  title = 'Confirmar acción';
  size: any = 'md';
  disableClose = false;
  closed = false;
}

@Component({
  template: `<neu-dialog [open]="true" title="Confirmar acción"
    ><p>Contenido del diálogo</p></neu-dialog
  >`,
  standalone: true,
  imports: [NeuDialogComponent],
})
class OpenHostComponent {}

describe('NeuDialogComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, OpenHostComponent, DialogModule],
      providers: [provideIcons({ lucideX })],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not render panel when open=false', () => {
    const panel = fixture.nativeElement.querySelector('.neu-dialog__panel');
    expect(panel).toBeFalsy();
  });

  it('should render panel when open=true', async () => {
    const df = TestBed.createComponent(NeuDialogComponent);
    df.componentRef.setInput('open', true);
    df.componentRef.setInput('title', 'Confirmar acción');
    df.detectChanges();
    await df.whenStable();
    const panel = df.nativeElement.querySelector('.neu-dialog__panel');
    expect(panel).toBeTruthy();
  });

  it('should render title when open', async () => {
    const df = TestBed.createComponent(NeuDialogComponent);
    df.componentRef.setInput('open', true);
    df.componentRef.setInput('title', 'Confirmar acción');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Confirmar acción');
  });

  it('should render projected content when open', async () => {
    const df = TestBed.createComponent(OpenHostComponent);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Contenido del diálogo');
  });

  it('should emit closed when close button is clicked', async () => {
    const df = TestBed.createComponent(NeuDialogComponent);
    df.componentRef.setInput('open', true);
    df.componentRef.setInput('title', 'Test');
    df.detectChanges();
    await df.whenStable();
    let closed = false;
    df.componentInstance.closed.subscribe(() => {
      closed = true;
    });
    const closeBtn = df.nativeElement.querySelector('.neu-dialog__close');
    closeBtn?.click();
    expect(closed).toBe(true);
  });

  it('should apply size class', async () => {
    const df = TestBed.createComponent(NeuDialogComponent);
    df.componentRef.setInput('open', true);
    df.componentRef.setInput('size', 'lg');
    df.detectChanges();
    await df.whenStable();
    const panel = df.nativeElement.querySelector('.neu-dialog__panel--lg');
    expect(panel).toBeTruthy();
  });

  it('should NOT show close button when disableClose=true', async () => {
    const df = TestBed.createComponent(NeuDialogComponent);
    df.componentRef.setInput('open', true);
    df.componentRef.setInput('disableClose', true);
    df.detectChanges();
    await df.whenStable();
    const closeBtn = df.nativeElement.querySelector('.neu-dialog__close');
    expect(closeBtn).toBeFalsy();
  });
});
