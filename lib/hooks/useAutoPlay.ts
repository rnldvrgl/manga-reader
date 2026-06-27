import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const AUTO_INTERVALS = [3, 5, 8, 12] as const;
type AutoInterval = (typeof AUTO_INTERVALS)[number];

export function useAutoPlay(
  autoInterval: AutoInterval,
  totalPages: number,
  nextChapterNumber: number | null,
  seriesSlug: string,
  getCurrentPage: () => number,
  onAdvance: (page: number) => void,
) {
  const [autoPlay, setAutoPlay] = useState(false);
  const [countdown, setCountdown] = useState<number>(autoInterval);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const stable = useRef({
    autoInterval,
    totalPages,
    nextChapterNumber,
    seriesSlug,
    getCurrentPage,
    onAdvance,
  });
  useEffect(() => {
    stable.current = {
      autoInterval,
      totalPages,
      nextChapterNumber,
      seriesSlug,
      getCurrentPage,
      onAdvance,
    };
  });
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!autoPlay) {
      const t = setTimeout(() => setCountdown(autoInterval), 0);
      return () => clearTimeout(t);
    }
    const initTimer = setTimeout(() => setCountdown(autoInterval), 0);
    let remaining = autoInterval;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        const {
          totalPages: total,
          nextChapterNumber: nextNum,
          seriesSlug: sSlug,
          getCurrentPage: getPage,
          onAdvance: advance,
          autoInterval: interval,
        } = stable.current;
        const nextPage = getPage() + 1;
        if (nextPage < total) advance(nextPage);
        else if (nextNum)
          setTimeout(
            () => router.push(`/series/${sSlug}/read?chapter=${nextNum}`),
            0,
          );
        remaining = interval;
        setCountdown(interval);
      }
    }, 1000);
    return () => {
      clearTimeout(initTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, autoInterval]);
  return { autoPlay, setAutoPlay, countdown };
}
