import { useCallback, useMemo } from "react";

export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
) {
  const timeoutRef = useMemo(
    () => ({ current: null as NodeJS.Timeout | null }),
    []
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, timeoutRef]
  );
}
