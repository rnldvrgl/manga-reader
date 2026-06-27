import { useState, useEffect, useRef, useCallback } from "react";

export function useUIVisibility(inhibit: boolean) {
  const [showUI, setShowUI] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  const scheduleHide = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setShowUI(false), 3500);
  }, [clearTimer]);
  const reveal = useCallback(() => {
    setShowUI(true);
    if (!inhibit) scheduleHide();
  }, [inhibit, scheduleHide]);
  useEffect(() => {
    if (inhibit) clearTimer();
    else scheduleHide();
    return clearTimer;
  }, [inhibit, clearTimer, scheduleHide]);
  useEffect(() => {
    scheduleHide();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { showUI, reveal, forceShow: () => setShowUI(true) };
}
