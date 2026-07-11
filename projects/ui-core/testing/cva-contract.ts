import { ComponentFixture } from '@angular/core/testing';

export interface NeuCvaLike<T> {
  writeValue(value: T | null | undefined): void;
  registerOnChange(fn: (value: T) => void): void;
  registerOnTouched(fn: () => void): void;
  setDisabledState(isDisabled: boolean): void;
}

export function collectCvaChanges<T>(component: NeuCvaLike<T>): T[] {
  const values: T[] = [];
  component.registerOnChange((value) => values.push(value));
  return values;
}

export function collectCvaTouches(component: NeuCvaLike<unknown>): boolean[] {
  const touches: boolean[] = [];
  component.registerOnTouched(() => touches.push(true));
  return touches;
}

export async function detectStableChanges<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
}

export function dispatchKeyboard(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}
