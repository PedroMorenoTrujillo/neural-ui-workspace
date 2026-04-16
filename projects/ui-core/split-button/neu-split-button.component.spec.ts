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

  it('toggleDropdown should close dropdown when already open', () => {
    // Si el dropdown está abierto, toggleDropdown debe cerrarlo
    // If the dropdown is open, toggleDropdown must close it
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.componentInstance.toggleDropdown(new MouseEvent('click'));
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('closeDropdown should close the dropdown', () => {
    // closeDropdown debe poner isOpen en false
    // closeDropdown must set isOpen to false
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.componentInstance.closeDropdown();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('onDocumentClick outside should close dropdown', () => {
    // Click fuera del componente debe cerrar el dropdown
    // Click outside the component must close the dropdown
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    const outsideNode = document.createElement('div');
    fixture.componentInstance.onDocumentClick({ target: outsideNode } as unknown as MouseEvent);
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('onDocumentClick inside should NOT close dropdown', () => {
    // Click dentro del componente NO debe cerrar el dropdown
    // Click inside the component must NOT close the dropdown
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    const insideNode = fixture.nativeElement.querySelector('.neu-split-button__main');
    fixture.componentInstance.onDocumentClick({ target: insideNode } as unknown as MouseEvent);
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('onActionClick on disabled action should not emit and not close', () => {
    // Las acciones deshabilitadas no deben emitir ni cerrar el dropdown
    // Disabled actions must not emit nor close the dropdown
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    const emitted: NeuSplitButtonAction[] = [];
    fixture.componentInstance.actionClick.subscribe((a) => emitted.push(a));
    fixture.componentInstance.onActionClick(ACTIONS[2]); // disabled: true
    expect(emitted.length).toBe(0);
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('loading state should show spinner and set aria-busy', () => {
    // loading=true debe mostrar spinner y aria-busy
    // loading=true must show spinner and aria-busy
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const mainBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.neu-split-button__main');
    expect(mainBtn.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.neu-button__spinner')).toBeTruthy();
  });

  it('isDisabled should be true when loading=true', () => {
    // Cuando loading=true, el componente debe comportarse como deshabilitado
    // When loading=true, the component must behave as disabled
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(true);
  });

  it('click on main button emits primaryClick output', async () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();
    const clicks: MouseEvent[] = [];
    fixture.componentInstance.primaryClick.subscribe((e: MouseEvent) => clicks.push(e));
    const mainBtn = fixture.nativeElement.querySelector(
      '.neu-split-button__main',
    ) as HTMLButtonElement;
    mainBtn.click();
    await fixture.whenStable();
    expect(clicks.length).toBe(1);
  });

  it('isDisabled should be false when neither disabled nor loading', () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(false);
  });

  it('variant input produces the correct CSS class', async () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    await fixture.whenStable();
    // The variant class is applied to the main button inside, not to the host
    expect(fixture.nativeElement.querySelector('.neu-button--danger')).toBeTruthy();
  });

  it('action with divider=true renders a separator in the dropdown', async () => {
    // Una acción con divider=true debe renderizar un separador en el dropdown
    // An action with divider=true must render a separator in the dropdown
    const actionsWithDivider: NeuSplitButtonAction[] = [
      { id: 'save', label: 'Guardar' },
      { id: 'sep', label: 'Eliminar', divider: true },
    ];
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', actionsWithDivider);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const sep = fixture.nativeElement.querySelector('.neu-split-button__dropdown-sep');
    expect(sep).toBeTruthy();
  });

  it('chevronClasses should include the variant CSS class', () => {
    // chevronClasses debe incluir la clase CSS de la variante
    // chevronClasses must include the variant CSS class
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    expect(comp.chevronClasses()).toContain('neu-button--secondary');
  });

  it('chevronClasses should include size modifier', () => {
    // chevronClasses debe incluir el modificador de tamaño
    // chevronClasses must include the size modifier
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    expect(comp.chevronClasses()).toContain('sm');
  });

  it('clicking a dropdown action button from the DOM should emit actionClick', async () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();

    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();

    const emitted: NeuSplitButtonAction[] = [];
    fixture.componentInstance.actionClick.subscribe((action: NeuSplitButtonAction) =>
      emitted.push(action),
    );

    const actionButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-split-button__dropdown-item'),
    ) as HTMLButtonElement[];

    actionButtons[0].click();
    await fixture.whenStable();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('save');
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('clicking inside the dropdown container should not bubble and close it', async () => {
    const fixture = TestBed.createComponent(NeuSplitButtonComponent);
    fixture.componentRef.setInput('label', 'Publicar');
    fixture.componentRef.setInput('actions', ACTIONS);
    fixture.detectChanges();

    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector(
      '.neu-split-button__dropdown',
    ) as HTMLDivElement;
    dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(true);
  });
});
