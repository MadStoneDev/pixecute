export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): T => {
  let lastFunc: number;
  let lastRan: number;
  return function (this: any, ...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = window.setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan),
      );
    }
  } as T;
};
