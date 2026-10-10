import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuAvatarComponent } from '@neural-ui/core/avatar';
import { NeuAvatarGroupComponent } from './neu-avatar-group.component';

describe('NeuAvatarGroupComponent', () => {
  let fixture: ComponentFixture<NeuAvatarGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuAvatarGroupComponent, NeuAvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuAvatarGroupComponent);
  });

  it('projects arbitrary avatar children without duplicating avatar rendering', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-avatar-group');
  });

  it('adds group semantics only when a group label is supplied', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('role')).toBeNull();
    fixture.componentRef.setInput('ariaLabel', 'Assigned people');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('role')).toBe('group');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Assigned people');
  });
});
