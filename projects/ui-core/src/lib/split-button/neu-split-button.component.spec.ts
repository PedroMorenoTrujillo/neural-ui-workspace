import { TestBed } from '@angular/core/testing';
import { NeuSplitButtonComponent, NeuSplitButtonAction } from './neu-split-button.component';

const ACTIONS: NeuSplitButtonAction[] = [
  { id: 'save', label: 'Guardar borrador' },
  { id: 'schedule', label: 'Programar' },
  { id: 'delete', label: 'Eliminar', disabled: true },
];

describe('NeuSplitButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuSplitButtonComponent],
    }).compileComponents();
  });

  it('should render the main button with label', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Publicar');
  });

  it('should render the chevron toggle button', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-split-button__chevron')).toBeTruthy();
  });

  it('should not show dropdown by default', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-split-button__dropdown')).toBeFalsy();
  });

  it('should show dropdown when chevron is clicked', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    const chevron: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.neu-split-button__chevron',
    );
    chevron.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-split-button__dropdown')).toBeTruthy();
  });

  it('should render all action labels in dropdown', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Guardar borrador');
    expect(text).toContain('Programar');
    expect(text).toContain('Eliminar');
  });

  it('should emit primaryClick when main button is clicked', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.primaryClick.subscribe((e) => events.push(e));
    fixture.componentInstance.onPrimaryClick(new MouseEvent('click'));
    expect(events.length).toBe(1);
  });

  it('should emit actionClick when an action item is selected', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    const emitted: NeuSplitButtonAction[] = [];
    fixture.componentInstance.actionClick.subscribe((a) => emitted.push(a));
    fixture.componentInstance.onActionClick(ACTIONS[0]);
    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('save');
  });

  it('should close dropdown after action is selected', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    fixture.componentInstance.onActionClick(ACTIONS[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-split-button__dropdown')).toBeFalsy();
  });

  it('should disable main button when disabled=true', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    const mainBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.neu-split-button__main');
    expect(mainBtn.disabled).toBe(true);
  });

  it('should not emit primaryClick when disabled', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.primaryClick.subscribe((e) => events.push(e));
    fixture.componentInstance.onPrimaryClick(new MouseEvent('click'));
    expect(events.length).toBe(0);
  });
});
