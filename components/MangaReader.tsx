"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  House,
  LayoutGrid,
  Play,
  Pause,
  Settings2,
  BookOpen,
  AlignJustify,
  Columns2,
  Sun,
  Moon,
  Gauge,
  Check,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Chapter } from "@/lib/series";

// ── Types ────────────────────────────────────────────────────────────────────
type ReadMode = "snap" | "scroll" | "book";
type Theme = "dark" | "light";

const AUTO_INTERVALS = [3, 5, 8, 12] as const;
type AutoInterval = (typeof AUTO_INTERVALS)[number];

const READ_MODES: {
  value: ReadMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "snap",
    label: "Snap",
    icon: <Columns2 className="w-4 h-4" />,
    description: "Tap left or right to flip pages one at a time",
  },
  {
    value: "scroll",
    label: "Scroll",
    icon: <AlignJustify className="w-4 h-4" />,
    description: "Continuous vertical scroll through all pages",
  },
  {
    value: "book",
    label: "Book",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Two pages side-by-side, right-to-left (manga style)",
  },
];

interface Props {
  chapter: Chapter;
  seriesSlug: string;
  prevChapter: { number: number } | null;
  nextChapter: { number: number } | null;
}

// ── Hook: persisted localStorage preference ───────────────────────────────────
function usePersistedState<T>(
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

// ── Hook: UI bar visibility ───────────────────────────────────────────────────
function useUIVisibility(inhibit: boolean) {
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
    if (inhibit) {
      clearTimer();
    } else {
      scheduleHide();
    }
    return clearTimer;
  }, [inhibit, clearTimer, scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showUI, reveal, forceShow: () => setShowUI(true) };
}

// ── Hook: page preloading ─────────────────────────────────────────────────────
function usePagePreload(totalPages: number) {
  const [loadedPages, setLoadedPages] = useState<Set<number>>(
    () => new Set([0, 1, 2]),
  );

  const preload = useCallback(
    (page: number) => {
      setLoadedPages((prev) => {
        if (prev.has(page) && prev.has(page + 1) && prev.has(page + 2))
          return prev;
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

// ── Hook: auto-play ───────────────────────────────────────────────────────────
function useAutoPlay(
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

        if (nextPage < total) {
          advance(nextPage);
        } else if (nextNum) {
          setTimeout(
            () => router.push(`/series/${sSlug}/read?chapter=${nextNum}`),
            0,
          );
        }

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

// ── Countdown SVG arc ─────────────────────────────────────────────────────────
function CountdownArc({ seconds, total }: { seconds: number; total: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, seconds / total);
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="absolute inset-0 pointer-events-none -rotate-90"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-border"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear" }}
        className="text-foreground"
      />
    </svg>
  );
}

// ── Shared icon button ────────────────────────────────────────────────────────
function IconBtn({
  onClick,
  disabled,
  label,
  active,
  className,
  children,
  asChild,
}: {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      asChild={asChild}
      className={cn(
        "rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-accent",
        active && "bg-accent text-foreground",
        className,
      )}
    >
      {children}
    </Button>
  );
}

// ── Main Reader ───────────────────────────────────────────────────────────────
export default function MangaReader({
  chapter,
  seriesSlug,
  prevChapter,
  nextChapter,
}: Props) {
  const router = useRouter();

  const [theme, setTheme] = usePersistedState<Theme>("manga-theme", "dark");
  const [readMode, setReadMode] = usePersistedState<ReadMode>(
    "manga-read-mode",
    "snap",
  );
  const [autoInterval, setAutoInterval] = usePersistedState<AutoInterval>(
    "manga-auto-interval",
    5,
    (v) => {
      const n = Number(v);
      return (AUTO_INTERVALS as readonly number[]).includes(n)
        ? (n as AutoInterval)
        : 5;
    },
  );

  const [showPageList, setShowPageList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const panelOpen = showPageList || showSettings;

  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef(0);
  const totalPages = chapter.pages.length;

  const { loadedPages, preload } = usePagePreload(totalPages);
  const { showUI, reveal, forceShow } = useUIVisibility(panelOpen);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (page: number, silent = false) => {
      if (page < 0 || page >= totalPages) return;
      currentPageRef.current = page;
      setCurrentPage(page);
      preload(page);
      if (!silent) reveal();
      if (readMode === "scroll" && scrollContainerRef.current) {
        const imgs = scrollContainerRef.current.querySelectorAll("img");
        imgs[page]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [totalPages, preload, reveal, readMode],
  );

  const getCurrentPage = useCallback(() => currentPageRef.current, []);

  const goNext = useCallback(() => {
    if (currentPageRef.current === totalPages - 1) {
      if (nextChapter)
        router.push(`/series/${seriesSlug}/read?chapter=${nextChapter.number}`);
    } else {
      goTo(currentPageRef.current + 1);
    }
  }, [totalPages, nextChapter, seriesSlug, goTo, router]);

  const goPrev = useCallback(() => {
    if (currentPageRef.current === 0) {
      if (prevChapter)
        router.push(`/series/${seriesSlug}/read?chapter=${prevChapter.number}`);
    } else {
      goTo(currentPageRef.current - 1);
    }
  }, [prevChapter, seriesSlug, goTo, router]);

  // ── Auto-play ───────────────────────────────────────────────────────────────
  const { autoPlay, setAutoPlay, countdown } = useAutoPlay(
    autoInterval,
    totalPages,
    nextChapter?.number ?? null,
    seriesSlug,
    getCurrentPage,
    (page) => goTo(page, true),
  );

  // ── Book mode ───────────────────────────────────────────────────────────────
  const bookPairs = useMemo(() => {
    const pairs: [number, number | null][] = [];
    for (let i = 0; i < totalPages; i += 2)
      pairs.push([i, i + 1 < totalPages ? i + 1 : null]);
    return pairs;
  }, [totalPages]);

  const bookPairIndex = useMemo(
    () => Math.floor(currentPage / 2),
    [currentPage],
  );

  const goNextBook = useCallback(() => {
    const next = (bookPairIndex + 1) * 2;
    if (next >= totalPages) {
      if (nextChapter)
        router.push(`/series/${seriesSlug}/read?chapter=${nextChapter.number}`);
    } else goTo(next);
  }, [bookPairIndex, totalPages, nextChapter, seriesSlug, router, goTo]);

  const goPrevBook = useCallback(() => {
    const prev = (bookPairIndex - 1) * 2;
    if (prev < 0) {
      if (prevChapter)
        router.push(`/series/${seriesSlug}/read?chapter=${prevChapter.number}`);
    } else goTo(prev);
  }, [bookPairIndex, prevChapter, seriesSlug, router, goTo]);

  const handleNext = readMode === "book" ? goNextBook : goNext;
  const handlePrev = readMode === "book" ? goPrevBook : goPrev;

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
      if (e.key === "Escape") {
        setShowPageList(false);
        setShowSettings(false);
      }
      if (e.key === " ") {
        e.preventDefault();
        setAutoPlay((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, setAutoPlay]);

  // ── Touch / swipe ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (readMode === "scroll") return;
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };
    const onEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
        if (dx < 0) handleNext();
        else handlePrev();
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [readMode, handleNext, handlePrev]);

  // ── Scroll IntersectionObserver ─────────────────────────────────────────────
  useEffect(() => {
    if (readMode !== "scroll") return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index);
          if (!isNaN(idx)) {
            currentPageRef.current = idx;
            setCurrentPage(idx);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );
    container
      .querySelectorAll("img[data-index]")
      .forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [readMode, loadedPages]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        className={cn(
          "fixed inset-0 flex flex-col select-none overflow-hidden bg-background transition-colors duration-300",
          theme === "dark" ? "dark" : "",
        )}
        style={{ touchAction: readMode === "scroll" ? "pan-y" : "none" }}
        onClick={reveal}
      >
        {/* ══ SNAP ══════════════════════════════════════════════════════════ */}
        {readMode === "snap" && (
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {chapter.pages.map((src, i) => (
              <div
                key={src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-200 pointer-events-none",
                  i === currentPage ? "opacity-100 z-10" : "opacity-0 z-0",
                )}
                style={{ display: loadedPages.has(i) ? "block" : "none" }}
              >
                <Image
                  src={src}
                  alt={`Page ${i + 1}`}
                  fill
                  className="object-contain"
                  draggable={false}
                  priority={i === 0}
                  sizes="100vw"
                />
              </div>
            ))}
            <button
              aria-label="Previous page"
              className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-w-resize"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            />
            <button
              aria-label="Next page"
              className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-e-resize"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            />
          </div>
        )}

        {/* ══ SCROLL ════════════════════════════════════════════════════════ */}
        {readMode === "scroll" && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ touchAction: "pan-y" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-0.5 pb-28 pt-16">
              {chapter.pages.map((src, i) => (
                <div
                  key={src}
                  className="relative w-full max-w-2xl mx-auto"
                  style={{ aspectRatio: "2/3" }}
                >
                  <Image
                    src={src}
                    alt={`Page ${i + 1}`}
                    fill
                    className="object-contain"
                    draggable={false}
                    data-index={i}
                    loading={i < 3 ? "eager" : "lazy"}
                    sizes="(max-width: 672px) 100vw, 672px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BOOK ══════════════════════════════════════════════════════════ */}
        {readMode === "book" && (
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {bookPairs.map(([left, right], pairIdx) => (
              <div
                key={pairIdx}
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-0.5 transition-opacity duration-200 pointer-events-none",
                  pairIdx === bookPairIndex
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0",
                )}
              >
                {right !== null && loadedPages.has(right) && (
                  <div className="relative h-full max-w-[50%] w-full">
                    <Image
                      src={chapter.pages[right]}
                      alt={`Page ${right + 1}`}
                      fill
                      className="object-contain"
                      sizes="50vw"
                    />
                  </div>
                )}
                {loadedPages.has(left) && (
                  <div className="relative h-full max-w-[50%] w-full">
                    <Image
                      src={chapter.pages[left]}
                      alt={`Page ${left + 1}`}
                      fill
                      className="object-contain"
                      sizes="50vw"
                    />
                  </div>
                )}
              </div>
            ))}
            <button
              aria-label="Previous spread"
              className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-w-resize"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            />
            <button
              aria-label="Next spread"
              className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-e-resize"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            />
          </div>
        )}

        {/* ── Persistent page counter ──────────────────────────────────────── */}
        <div
          className={cn(
            "absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-300",
            showUI ? "opacity-0" : "opacity-100",
          )}
        >
          <span className="text-xs tabular-nums font-mono tracking-widest text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
        </div>

        {autoPlay && (
          <div
            className={cn(
              "absolute bottom-20 right-4 z-20 pointer-events-none transition-opacity duration-300",
              showUI ? "opacity-0" : "opacity-100",
            )}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border shadow-sm">
              <Timer className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono font-semibold tabular-nums text-foreground">
                {countdown}s
              </span>
            </div>
          </div>
        )}

        {/* ══ TOP BAR ═══════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "absolute top-0 inset-x-0 z-30 transition-[transform,opacity] duration-300 will-change-transform",
            showUI
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-b from-background/95 via-background/70 to-transparent px-3 pt-safe-top pb-14">
            <div className="flex items-center gap-1 max-w-3xl mx-auto pt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconBtn label="Series" asChild>
                    <Link href={`/series/${seriesSlug}`}>
                      <House className="w-4 h-4" />
                    </Link>
                  </IconBtn>
                </TooltipTrigger>
                <TooltipContent side="bottom">Back to series</TooltipContent>
              </Tooltip>

              <div className="flex-1 text-center min-w-0 px-2">
                <p className="text-sm font-semibold tracking-wide text-foreground truncate">
                  Chapter {chapter.number}
                  {chapter.title ? ` — ${chapter.title}` : ""}
                </p>
                <p className="text-[11px] font-mono tabular-nums mt-0.5 text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </p>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <IconBtn
                    label={theme === "dark" ? "Light mode" : "Dark mode"}
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </IconBtn>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </TooltipContent>
              </Tooltip>

              <Popover
                open={showSettings}
                onOpenChange={(open) => {
                  setShowSettings(open);
                  if (open) forceShow();
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <IconBtn label="Settings" active={showSettings}>
                        <Settings2 className="w-4 h-4" />
                      </IconBtn>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Settings</TooltipContent>
                </Tooltip>

                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-72 p-4 rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2.5 text-muted-foreground">
                    Reading mode
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {READ_MODES.map((m) => {
                      const active = readMode === m.value;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setReadMode(m.value)}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all duration-150",
                            active
                              ? "border-foreground/40 bg-accent text-foreground"
                              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          {active && (
                            <Check className="absolute top-1.5 right-1.5 w-2.5 h-2.5 opacity-60" />
                          )}
                          {m.icon}
                          <span className="text-[9px] font-bold tracking-wider uppercase leading-none">
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] mt-2 text-center leading-relaxed text-muted-foreground">
                    {READ_MODES.find((m) => m.value === readMode)?.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Gauge className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        Auto-play speed
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {AUTO_INTERVALS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setAutoInterval(s)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all duration-150",
                            autoInterval === s
                              ? "border-foreground/40 bg-accent text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                          )}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <IconBtn
                    label="Pages"
                    onClick={() => {
                      setShowPageList(true);
                      forceShow();
                    }}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </IconBtn>
                </TooltipTrigger>
                <TooltipContent side="bottom">Pages</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "absolute bottom-0 inset-x-0 z-30 transition-[transform,opacity] duration-300 will-change-transform",
            showUI ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-t from-background/95 via-background/70 to-transparent px-4 pb-6 pb-safe-bottom pt-14">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-mono tabular-nums w-4 text-right shrink-0 text-muted-foreground">
                  1
                </span>
                <Slider
                  min={0}
                  max={totalPages - 1}
                  step={1}
                  value={[currentPage]}
                  onValueChange={([v]) => goTo(v)}
                  className="flex-1"
                  aria-label="Page scrubber"
                />
                <span className="text-[10px] font-mono tabular-nums w-4 shrink-0 text-muted-foreground">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconBtn
                      label="Previous chapter"
                      disabled={!prevChapter}
                      onClick={() =>
                        prevChapter &&
                        router.push(
                          `/series/${seriesSlug}/read?chapter=${prevChapter.number}`,
                        )
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </IconBtn>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {prevChapter
                      ? `Chapter ${prevChapter.number}`
                      : "No previous chapter"}
                  </TooltipContent>
                </Tooltip>

                <div className="flex flex-col items-center gap-1">
                  {autoPlay && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border shadow-sm">
                      <Timer className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] font-mono font-semibold tabular-nums text-foreground">
                        {countdown}s
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        /{autoInterval}s
                      </span>
                    </div>
                  )}
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {autoPlay && (
                      <CountdownArc seconds={countdown} total={autoInterval} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAutoPlay((p) => !p)}
                      aria-label={
                        autoPlay ? "Pause auto-play" : "Start auto-play"
                      }
                      className={cn(
                        "rounded-full w-10 h-10 relative z-10 transition-all duration-200",
                        autoPlay
                          ? "bg-foreground text-background hover:bg-foreground/90 shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      )}
                    >
                      {autoPlay ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconBtn
                      label="Next chapter"
                      disabled={!nextChapter}
                      onClick={() =>
                        nextChapter &&
                        router.push(
                          `/series/${seriesSlug}/read?chapter=${nextChapter.number}`,
                        )
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </IconBtn>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {nextChapter
                      ? `Chapter ${nextChapter.number}`
                      : "No next chapter"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* ══ PAGE LIST SHEET ═══════════════════════════════════════════════ */}
        <Sheet open={showPageList} onOpenChange={setShowPageList}>
          <SheetContent
            side="right"
            className="w-72 p-0 flex flex-col border-l border-border bg-card"
          >
            <SheetHeader className="px-4 py-3.5 border-b border-border shrink-0">
              <SheetTitle className="text-sm font-semibold">
                Ch. {chapter.number} — {totalPages} pages
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {chapter.pages.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => {
                      goTo(i);
                      setShowPageList(false);
                    }}
                    className={cn(
                      "relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all duration-150",
                      i === currentPage
                        ? "border-foreground shadow-lg scale-[1.04]"
                        : "border-transparent opacity-50 hover:opacity-90 hover:border-border",
                    )}
                    aria-label={`Go to page ${i + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`Thumb ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 inset-x-0 text-center text-[9px] py-0.5 font-mono text-white/80 bg-black/60">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
