import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuFilterBarComponent, type NeuFilterChip } from './neu-filter-bar.component';

const CHIPS: readonly NeuFilterChip[] = [
  { key: 'all', label: 'Todos', active: false },
  { key: 'active', label: 'Activos', active: false },
  { key: 'inactive', label: 'Inactivos', active: false },
];

function create(filters: readonly NeuFilterChip[] = CHIPS) {
  const fixture = TestBed.createComponent(NeuFilterBarComponent);
  fixture.componentRef.setInput('filters', filters);
  fixture.detectChanges();
  return fixture;
}

describe('NeuFilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }).compileComponents();
  });

  it('renders applied chips and accessible group semantics', () => {
    const fixture = create();
    expect(fixture.nativeElement.getAttribute('role')).toBe('group');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Filters');
    const chips = fixture.nativeElement.querySelectorAll('.neu-filter-bar__chip');
    expect(chips).toHaveLength(3);
    expect(chips[0].textContent.trim()).toBe('Todos');
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('emits one immutable proposal without applying it when the parent rejects', () => {
    const fixture = create(Object.freeze(CHIPS.map((chip) => Object.freeze({ ...chip }))));
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    (fixture.nativeElement.querySelectorAll('.neu-filter-bar__chip')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(emitted.map((chips) => chips.map((chip) => chip.key))).toEqual([['active']]);
    expect(emitted[0][0]).not.toBe(CHIPS[1]);
    expect(fixture.nativeElement.querySelectorAll('.neu-filter-bar__chip')[1].getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('.neu-filter-bar__clear')).toBeNull();
  });

  it('reflects accepted parent writes and reconstructed arrays without emitting echoes', () => {
    const fixture = create();
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentRef.setInput('filters', CHIPS.map((chip) => ({ ...chip, active: chip.key === 'active' })));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-filter-bar__chip')[1].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.neu-filter-bar__clear')).toBeTruthy();
    expect(emitted).toEqual([]);
  });

  it('multiple mode proposes the next active set in applied order', () => {
    const fixture = create([{ ...CHIPS[0], active: true }, CHIPS[1], CHIPS[2]]);
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentInstance.toggle(CHIPS[1]);
    expect(emitted.at(-1)?.map((chip) => chip.key)).toEqual(['all', 'active']);
    fixture.componentInstance.toggle(CHIPS[0]);
    expect(emitted.at(-1)?.map((chip) => chip.key)).toEqual([]);
  });

  it('single mode proposes only one active chip and can clear the selected chip', () => {
    const fixture = create([{ ...CHIPS[0], active: true }, CHIPS[1]]);
    fixture.componentRef.setInput('multi', false);
    fixture.detectChanges();
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentInstance.toggle(CHIPS[1]);
    expect(emitted.at(-1)?.map((chip) => chip.key)).toEqual(['active']);
    fixture.componentInstance.toggle(CHIPS[0]);
    expect(emitted.at(-1)).toEqual([]);
  });

  it('clear emits exactly once from applied active state and leaves it unchanged', () => {
    const fixture = create([{ ...CHIPS[0], active: true }]);
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    (fixture.nativeElement.querySelector('.neu-filter-bar__clear') as HTMLButtonElement).click();
    fixture.componentInstance.clearAll();
    expect(emitted).toEqual([[], []]);
    expect(fixture.componentInstance.filters()[0].active).toBe(true);
  });

  it('does not emit reset when nothing is active or render clear when disabled', () => {
    const fixture = create();
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentInstance.clearAll();
    expect(emitted).toEqual([]);
    fixture.componentRef.setInput('filters', [{ ...CHIPS[0], active: true }]);
    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-filter-bar__clear')).toBeNull();
  });

  it('setActive proposes existing keys without mutating the applied list', () => {
    const fixture = create();
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentInstance.setActive(['inactive', 'unknown', 'active']);
    expect(emitted.at(-1)?.map((chip) => chip.key)).toEqual(['active', 'inactive']);
    expect(fixture.componentInstance.filters()).toBe(CHIPS);
  });

  it('ignores an unknown gesture key', () => {
    const fixture = create();
    const emitted: NeuFilterChip[][] = [];
    fixture.componentInstance.filterChange.subscribe((chips) => emitted.push(chips));
    fixture.componentInstance.toggle({ key: 'unknown', label: 'Unknown' });
    expect(emitted).toEqual([]);
  });
});
