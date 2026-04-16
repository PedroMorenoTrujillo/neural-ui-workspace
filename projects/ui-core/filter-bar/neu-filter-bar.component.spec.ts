import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuFilterBarComponent, NeuFilterChip } from './neu-filter-bar.component';

const CHIPS: NeuFilterChip[] = [
  { key: 'all', label: 'Todos', active: false },
  { key: 'active', label: 'Activos', active: false },
  { key: 'inactive', label: 'Inactivos', active: false },
];

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuFilterBarComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render filter chips', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.detectChanges();
    await f.whenStable();
    const chips = f.nativeElement.querySelectorAll('.neu-filter-bar__chip');
    expect(chips.length).toBe(3);
    expect(chips[0].textContent.trim()).toBe('Todos');
  });

  it('toggle should activate a chip', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggle(CHIPS[0]);
    f.detectChanges();
    await f.whenStable();
    const chip = f.nativeElement.querySelector('.neu-filter-bar__chip');
    expect(chip.classList).toContain('neu-filter-bar__chip--active');
  });

  it('toggle should emit filterChange with active chips', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.detectChanges();
    await f.whenStable();
    const emitted: NeuFilterChip[][] = [];
    f.componentInstance.filterChange.subscribe((chips: NeuFilterChip[]) => emitted.push(chips));

    (f.componentInstance as any).toggle(CHIPS[1]);
    expect(emitted.length).toBe(1);
    expect(emitted[0][0].key).toBe('active');
  });

  it('multi=true allows multiple chips active', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.componentRef.setInput('multi', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggle(CHIPS[0]);
    comp.toggle(CHIPS[1]);
    expect(comp._chips().filter((c: NeuFilterChip) => c.active).length).toBe(2);
  });

  it('multi=false deactivates other chips on toggle', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.componentRef.setInput('multi', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggle(CHIPS[0]);
    comp.toggle(CHIPS[1]);
    expect(comp._chips().filter((c: NeuFilterChip) => c.active).length).toBe(1);
    expect(comp._chips().find((c: NeuFilterChip) => c.active)?.key).toBe('active');
  });

  it('should show clear button when a chip is active and clearable=true', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.componentRef.setInput('clearable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggle(CHIPS[0]);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-filter-bar__clear')).toBeTruthy();
  });

  it('should hide clear button when no chips are active', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.componentRef.setInput('clearable', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-filter-bar__clear')).toBeNull();
  });

  it('clearAll should deactivate all chips and emit empty array', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.toggle(CHIPS[0]);
    comp.toggle(CHIPS[1]);

    const emitted: unknown[][] = [];
    f.componentInstance.filterChange.subscribe((e: unknown[]) => emitted.push(e));
    comp.clearAll();

    expect(comp._hasActive()).toBe(false);
    expect(emitted[emitted.length - 1]).toEqual([]);
  });

  it('setActive should activate chips by keys', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', CHIPS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.setActive(['active', 'inactive']);
    expect(comp._chips().filter((c: NeuFilterChip) => c.active).length).toBe(2);
  });

  it('should apply neu-filter-bar class', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-filter-bar');
  });

  it('toggle activates and deactivates a filter chip', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', [{ key: 'a', label: 'Alpha', active: false }]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.toggle(comp._chips()[0]);
    expect(comp._chips()[0].active).toBe(true);
    comp.toggle(comp._chips()[0]);
    expect(comp._chips()[0].active).toBe(false);
  });

  it('clearAll deactivates all chips', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', [
      { key: 'a', label: 'A', active: true },
      { key: 'b', label: 'B', active: true },
    ]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.clearAll();
    const allInactive = comp._chips().every((c: any) => !c.active);
    expect(allInactive).toBe(true);
  });

  it('filterChange emits when toggle is called', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('filters', [{ key: 'x', label: 'X', active: false }]);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.filterChange.subscribe((e: any) => events.push(e));
    const comp = f.componentInstance as any;
    comp.toggle(comp._chips()[0]);
    expect(events.length).toBe(1);
  });

  it('clearable=false should not render clear button', async () => {
    const f = TestBed.createComponent(NeuFilterBarComponent);
    f.componentRef.setInput('clearable', false);
    f.componentRef.setInput('filters', [{ key: 'z', label: 'Z', active: true }]);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-filter-bar__clear')).toBeNull();
  });
});
