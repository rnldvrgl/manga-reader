import { useState, useCallback } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  parse: (v: string) => T = (v) => v as unknown as T,
): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    const saved = localStorage.getItem(key);
    return saved !== null ? parse(saved) : defaultValue;
  });
  const set = useCallback(
    (val: T) => {
      setState(val);
      localStorage.setItem(key, String(val));
    },
    [key],
  );
  return [state, set];
}
