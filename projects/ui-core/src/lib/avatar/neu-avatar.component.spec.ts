import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuAvatarComponent } from './neu-avatar.component';

@Component({
  template: `<neu-avatar
    [src]="src"
    [alt]="alt"
    [name]="name"
    [size]="size"
    [shape]="shape"
    [status]="status"
  />`,
  imports: [NeuAvatarComponent],
})
class TestHostComponent {
  src = '';
  alt = '';
  name = '';
  size: any = 'md';
  shape: any = 'circle';
  status: any = '';
}

describe('NeuAvatarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(fixture.nativeElement.querySelector('neu-avatar')).toBeTruthy();
  });

  it('should show image when src is provided', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('src', 'https://example.com/avatar.jpg');
    df.componentRef.setInput('alt', 'Test user');
    df.detectChanges();
    await df.whenStable();
    const img = df.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.jpg');
    expect(img.alt).toBe('Test user');
  });

  it('should show initials when name is provided without src', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('name', 'John Doe');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('JD');
  });

  it('should show single initial for single word name', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('name', 'John');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('J');
  });

  it('should apply size class', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('size', 'lg');
    df.detectChanges();
    await df.whenStable();
    const inner = df.nativeElement.querySelector('[class*="neu-avatar--lg"]');
    expect(inner).toBeTruthy();
  });

  it('should apply shape class', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('shape', 'square');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.className + df.nativeElement.innerHTML).toContain('square');
  });

  it('should show status indicator when status is provided', async () => {
    const df = TestBed.createComponent(NeuAvatarComponent);
    df.componentRef.setInput('status', 'online');
    df.detectChanges();
    await df.whenStable();
    const status = df.nativeElement.querySelector('[class*="status"]');
    expect(status).toBeTruthy();
  });

  it('should NOT show status indicator when status is empty', () => {
    const status = fixture.nativeElement.querySelector('.neu-avatar__status');
    expect(status).toBeFalsy();
  });
});
