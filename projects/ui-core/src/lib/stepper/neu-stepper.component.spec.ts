import { TestBed } from '@angular/core/testing';
import { NeuStepperComponent, NeuStepperStep } from './neu-stepper.component';

const STEPS: NeuStepperStep[] = [
  { label: 'Datos personales' },
  { label: 'Dirección' },
  { label: 'Confirmación' },
];

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuStepperComponent);
  f.componentRef.setInput('steps', STEPS);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

describe('NeuStepperComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render all step labels', () => {
    const { f } = mk();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Datos personales');
    expect(text).toContain('Dirección');
    expect(text).toContain('Confirmación');
  });

  it('should mark first step as active initially', () => {
    const { f } = mk();
    const active = f.nativeElement.querySelector('.neu-stepper__step--active');
    expect(active).toBeTruthy();
    expect(active.textContent).toContain('Datos personales');
  });

  it('should mark step at activeStep as active', () => {
    const { f } = mk({ activeStep: 1 });
    const active = f.nativeElement.querySelector('.neu-stepper__step--active');
    expect(active.textContent).toContain('Dirección');
  });

  it('should show description when provided', () => {
    const steps: NeuStepperStep[] = [{ label: 'Paso 1', description: 'Rellena tus datos' }];
    const { f } = mk({ steps });
    expect(f.nativeElement.textContent).toContain('Rellena tus datos');
  });

  it('should mark steps completed (i < activeStep)', () => {
    const { f } = mk({ activeStep: 2 });
    const completed = f.nativeElement.querySelectorAll('.neu-stepper__step--completed');
    expect(completed.length).toBeGreaterThan(0);
  });

  it('should show connector--done for completed steps', () => {
    const { f } = mk({ activeStep: 2 });
    const done = f.nativeElement.querySelectorAll('.neu-stepper__connector--done');
    expect(done.length).toBeGreaterThan(0);
  });

  it('should show checkmark SVG for completed step', () => {
    const { f } = mk({ activeStep: 2 });
    const svg = f.nativeElement.querySelector('polyline');
    expect(svg).toBeTruthy();
  });

  // ── goTo ──────────────────────────────────────────────────────────────────

  it('clicking a step button should emit stepChange', () => {
    const { f, comp } = mk();
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    const btns = f.nativeElement.querySelectorAll('.neu-stepper__step-btn');
    btns[1].click();
    expect(emitted).toEqual([1]);
  });

  it('clicking a disabled step should NOT emit', () => {
    const steps: NeuStepperStep[] = [
      { label: 'Paso 1' },
      { label: 'Paso 2', disabled: true },
      { label: 'Paso 3' },
    ];
    const { f, comp } = mk({ steps });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    const btns = f.nativeElement.querySelectorAll('.neu-stepper__step-btn');
    btns[1].click();
    expect(emitted.length).toBe(0);
  });

  it('disabled step button has disabled attribute', () => {
    const steps: NeuStepperStep[] = [{ label: 'Paso 1' }, { label: 'Paso 2', disabled: true }];
    const { f } = mk({ steps });
    const btns: NodeListOf<HTMLButtonElement> =
      f.nativeElement.querySelectorAll('.neu-stepper__step-btn');
    expect(btns[1].disabled).toBe(true);
  });

  // ── linear mode ───────────────────────────────────────────────────────────

  it('linear=true prevents jumping ahead more than 1 step if current not completed', () => {
    const { comp } = mk({ linear: true, activeStep: 0 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.goTo(2); // skip step 1 — blocked
    expect(emitted.length).toBe(0);
  });

  it('linear=true allows going to next step (i = activeStep + 1)', () => {
    const { comp } = mk({ linear: true, activeStep: 0 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.goTo(1);
    expect(emitted).toEqual([1]);
  });

  // ── next() ────────────────────────────────────────────────────────────────

  it('next() marks current step completed and emits next index', () => {
    const { comp } = mk({ activeStep: 0 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.next();
    expect(emitted).toEqual([1]);
    expect(comp.isCompleted(0)).toBe(true);
  });

  it('next() on last step does not emit', () => {
    const { comp } = mk({ activeStep: 2 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.next();
    expect(emitted.length).toBe(0);
  });

  // ── prev() ────────────────────────────────────────────────────────────────

  it('prev() emits previous index', () => {
    const { comp } = mk({ activeStep: 2 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.prev();
    expect(emitted).toEqual([1]);
  });

  it('prev() on first step does not emit', () => {
    const { comp } = mk({ activeStep: 0 });
    const emitted: number[] = [];
    comp.stepChange.subscribe((v: number) => emitted.push(v));
    comp.prev();
    expect(emitted.length).toBe(0);
  });

  // ── isCompleted ───────────────────────────────────────────────────────────

  it('isCompleted returns true for step with completed=true', () => {
    const steps: NeuStepperStep[] = [{ label: 'Paso 1', completed: true }, { label: 'Paso 2' }];
    const { comp } = mk({ steps, activeStep: 0 });
    expect(comp.isCompleted(0)).toBe(true);
  });

  it('isCompleted returns false for step not completed and not before activeStep', () => {
    const { comp } = mk({ activeStep: 0 });
    expect(comp.isCompleted(1)).toBe(false);
    expect(comp.isCompleted(2)).toBe(false);
  });
});
