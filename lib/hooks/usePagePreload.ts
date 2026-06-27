import { useState, useCallback } from "react";

export function usePagePreload(totalPages: number) {
  const [loadedPages, setLoadedPages] = useState<Set<number>>(
    () => new Set([0, 1, 2]),
  );
  const preload = useCallback(
    (page: number) => {
      setLoadedPages((prev) => {
        const next = new Set(prev);
        next.add(page);
        if (page + 1 < totalPages) next.add(page + 1);
        if (page + 2 < totalPages) next.add(page + 2);
        return next;
      });
    },
    [totalPages],
  );
  return { loadedPages, preload };
}
