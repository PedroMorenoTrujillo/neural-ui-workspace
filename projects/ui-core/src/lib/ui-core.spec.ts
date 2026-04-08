import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiCore } from './ui-core';

describe('UiCore', () => {
  let component: UiCore;
  let fixture: ComponentFixture<UiCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCore],
    }).compileComponents();

    fixture = TestBed.createComponent(UiCore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
