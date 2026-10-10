import { signal, type WritableSignal } from '@angular/core';

// Internal readiness tracking: projected siblings may exist before their
// required value inputs have been bound by a dynamic Angular view.
const readiness = new WeakMap<object, WritableSignal<boolean>>();

function state(radio: object): WritableSignal<boolean> {
  let value = readiness.get(radio);
  if (!value) {
    value = signal(false);
    readiness.set(radio, value);
  }
  return value;
}

export function markNeuRadioInitialized(radio: object): void {
  state(radio).set(true);
}

export function isNeuRadioInitialized(radio: object): boolean {
  return state(radio)();
}
