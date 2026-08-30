export function replaceGlobalProperty<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K],
): () => void {
  const original = Object.getOwnPropertyDescriptor(target, key);

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: original?.enumerable ?? true,
    writable: true,
    value,
  });

  return () => {
    if (original) {
      Object.defineProperty(target, key, original);
    } else {
      Reflect.deleteProperty(target, key);
    }
  };
}
