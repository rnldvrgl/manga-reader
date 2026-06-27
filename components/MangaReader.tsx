"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import type { Chapter } from "@/lib/series";
import { usePagePreload } from "@/lib/hooks/usePagePreload";
import { useAutoPlay } from "@/lib/hooks/useAutoPlay";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { useUIVisibility } from "@/lib/hooks/useUIVisibility";
import { PageListSheet } from "./manga/PageListSheet";
import { PagePill } from "./manga/PagePill";
import { ReaderBottomBar } from "./manga/ReaderBottomBar";
import { ReaderTopBar } from "./manga/ReaderTopBar";
import { SettingsSheet } from "./manga/SettingsSheet";
import { AUTO_INTERVALS } from "@/lib/constants";
import type { ReadMode, AutoInterval } from "@/lib/types";

interface Props {
  chapter: Chapter;
  seriesSlug: string;
  prevChapter: { number: number } | null;
  nextChapter: { number: number } | null;
}

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-30%" : "30%", opacity: 0 }),
};

// Below this many scrollable px, there's nothing meaningful for
// continuous auto-scroll to do (a short chapter's content can be barely
// taller than the viewport, or not taller at all). Without this guard the
// rAF loop's "reached bottom" check fires on the very first frame and
// silently flips scrollAutoPlay back off, which looks exactly like
// autoplay "not working."
const MIN_SCROLLABLE_PX = 24;

export default function MangaReader({
  chapter,
  seriesSlug,
  prevChapter,
  nextChapter,
}: Props) {
  const router = useRouter();
  const [persistedReadMode, setReadMode] = usePersistedState<ReadMode>(
    "manga-read-mode",
    "snap",
  );
  const [persistedAutoInterval, setAutoInterval] =
    usePersistedState<AutoInterval>("manga-auto-interval", 8, (v) => {
      const n = Number(v);
      return (AUTO_INTERVALS as readonly number[]).includes(n)
        ? (n as AutoInterval)
        : 8;
    });

  // usePersistedState reads from localStorage, which doesn't exist during
  // SSR — so the server always renders the *default* ("snap", 8s), while
  // the client's first render can immediately see a different persisted
  // value. That mismatch causes a hydration error: the server paints the
  // "snap" branch, the client paints "scroll".
  //
  // Fix: force the SSR-safe defaults for the very first client render too
  // (so hydration has nothing to disagree about), then swap to the real
  // persisted value right after mount. This only affects the first paint;
  // it's invisible in practice since it's a same-frame swap, and it avoids
  // touching usePersistedState itself.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const readMode = hasMounted ? persistedReadMode : "snap";
  const autoInterval = hasMounted ? persistedAutoInterval : 8;

  const [showPageList, setShowPageList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const panelOpen = showPageList || showSettings;

  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef(0);

  const [direction, setDirection] = useState(1);
  const directionRef = useRef(1);

  const totalPages = chapter.pages.length;

  const { loadedPages, preload } = usePagePreload(totalPages);
  const { showUI, reveal, forceShow } = useUIVisibility(panelOpen);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [scrollAutoPlayIntent, setScrollAutoPlayIntent] = useState(false);
  const scrollAutoPlay =
    scrollAutoPlayIntent && readMode === "scroll" && !panelOpen;
  const setScrollAutoPlay = setScrollAutoPlayIntent;
  const [scrollAutoPlayUnavailable, setScrollAutoPlayUnavailable] =
    useState(false);
  const scrollAutoPlayRafRef = useRef<number | null>(null);
  const scrollAutoPlayLastTsRef = useRef<number | null>(null);

  const toggleScrollAutoPlay = useCallback(() => {
    setScrollAutoPlayIntent((wasOn) => {
      if (wasOn) return false;
      const container = scrollContainerRef.current;
      const scrollableDistance = container
        ? container.scrollHeight - container.clientHeight
        : 0;
      if (scrollableDistance < MIN_SCROLLABLE_PX) {
        setScrollAutoPlayUnavailable(true);
        return false;
      }
      setScrollAutoPlayUnavailable(false);
      return true;
    });
  }, []);

  const stopScrollAutoPlay = useCallback(() => {
    if (scrollAutoPlayRafRef.current !== null) {
      cancelAnimationFrame(scrollAutoPlayRafRef.current);
      scrollAutoPlayRafRef.current = null;
    }
    scrollAutoPlayLastTsRef.current = null;
  }, []);

  const goTo = useCallback(
    (page: number, silent = false) => {
      if (page < 0 || page >= totalPages) return;
      const dir = page > currentPageRef.current ? 1 : -1;
      directionRef.current = dir;
      setDirection(dir);
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
    } else goTo(currentPageRef.current + 1);
  }, [totalPages, nextChapter, seriesSlug, goTo, router]);

  const goPrev = useCallback(() => {
    if (currentPageRef.current === 0) {
      if (prevChapter)
        router.push(`/series/${seriesSlug}/read?chapter=${prevChapter.number}`);
    } else goTo(currentPageRef.current - 1);
  }, [prevChapter, seriesSlug, goTo, router]);

  const { autoPlay, setAutoPlay, countdown } = useAutoPlay(
    autoInterval,
    totalPages,
    nextChapter?.number ?? null,
    seriesSlug,
    getCurrentPage,
    (page) => goTo(page, true),
  );

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
        if (readMode === "scroll") toggleScrollAutoPlay();
        else setAutoPlay((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, setAutoPlay, readMode, toggleScrollAutoPlay]);

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

  useEffect(() => {
    if (!scrollAutoPlay || readMode !== "scroll") {
      stopScrollAutoPlay();
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollableDistance = container.scrollHeight - container.clientHeight;
    if (scrollableDistance < MIN_SCROLLABLE_PX) {
      setScrollAutoPlayUnavailable(true);
      return;
    }
    setScrollAutoPlayUnavailable(false);

    const step = (ts: number) => {
      const last = scrollAutoPlayLastTsRef.current;
      scrollAutoPlayLastTsRef.current = ts;
      const height = container.clientHeight;
      if (last !== null && height > 0) {
        const dt = ts - last;
        const pxPerMs = height / (autoInterval * 1000);
        container.scrollTop += pxPerMs * dt;

        const atBottom =
          container.scrollTop + height >= container.scrollHeight - 2;
        if (atBottom) {
          setScrollAutoPlay(false);
          return;
        }
      }
      scrollAutoPlayRafRef.current = requestAnimationFrame(step);
    };

    scrollAutoPlayLastTsRef.current = null;
    scrollAutoPlayRafRef.current = requestAnimationFrame(step);

    return stopScrollAutoPlay;
  }, [scrollAutoPlay, readMode, autoInterval, stopScrollAutoPlay]);

  // Manual scroll/touch input cancels auto-scroll, same as touching the
  // page would interrupt any other autoplay mode.
  useEffect(() => {
    if (readMode !== "scroll") return;
    const container = scrollContainerRef.current;
    if (!container || !scrollAutoPlay) return;
    const onWheelOrTouch = () => setScrollAutoPlay(false);
    container.addEventListener("wheel", onWheelOrTouch, { passive: true });
    container.addEventListener("touchstart", onWheelOrTouch, {
      passive: true,
    });
    return () => {
      container.removeEventListener("wheel", onWheelOrTouch);
      container.removeEventListener("touchstart", onWheelOrTouch);
    };
  }, [readMode, scrollAutoPlay]);

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

  const progress =
    totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col select-none overflow-hidden bg-background"
      style={{ touchAction: readMode === "scroll" ? "pan-y" : "none" }}
      onClick={reveal}
    >
      {/* ══ SNAP ══════════════════════════════════════════════════════════════ */}
      {readMode === "snap" && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {chapter.pages.map((src, i) =>
            loadedPages.has(i) && i !== currentPage ? (
              <div key={src} className="sr-only absolute pointer-events-none">
                <Image src={src} alt="" width={1} height={1} aria-hidden />
              </div>
            ) : null,
          )}
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="absolute inset-0"
            >
              <Image
                src={chapter.pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                fill
                className="object-contain"
                draggable={false}
                priority
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
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

      {/* ══ SCROLL ════════════════════════════════════════════════════════════ */}
      {readMode === "scroll" && (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ touchAction: "pan-y" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-0.5 pb-32 pt-16 max-w-2xl mx-auto">
            {chapter.pages.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative w-full"
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
              </motion.div>
            ))}

            {nextChapter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/series/${seriesSlug}/read?chapter=${nextChapter.number}`,
                  );
                }}
                className="mt-4 w-[min(100%,320px)] rounded-xl border border-border bg-card px-6 py-5 text-center transition-colors hover:bg-accent"
              >
                <div className="text-sm text-muted-foreground">
                  End of chapter
                </div>
                <div className="mt-1 text-base font-medium">
                  Next Chapter {nextChapter.number} →
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ BOOK ══════════════════════════════════════════════════════════════ */}
      {readMode === "book" && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={bookPairIndex}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="absolute inset-0 flex items-center justify-center gap-0.5"
            >
              {(() => {
                const [left, right] = bookPairs[bookPairIndex] ?? [0, null];
                return (
                  <>
                    {right !== null && (
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
                    <div className="relative h-full max-w-[50%] w-full">
                      <Image
                        src={chapter.pages[left]}
                        alt={`Page ${left + 1}`}
                        fill
                        className="object-contain"
                        sizes="50vw"
                      />
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
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

      <PagePill current={currentPage} total={totalPages} visible={showUI} />

      <ReaderTopBar
        visible={showUI}
        chapterNumber={chapter.number}
        chapterTitle={chapter.title}
        seriesSlug={seriesSlug}
        onSettings={() => {
          setShowSettings(true);
          forceShow();
        }}
        onPageList={() => {
          setShowPageList(true);
          forceShow();
        }}
      />

      <ReaderBottomBar
        visible={showUI}
        currentPage={currentPage}
        totalPages={totalPages}
        progress={progress}
        autoPlay={readMode === "scroll" ? scrollAutoPlay : autoPlay}
        countdown={readMode === "scroll" ? 0 : countdown}
        autoInterval={autoInterval}
        hasPrev={!!prevChapter}
        hasNext={!!nextChapter}
        onGoTo={goTo}
        onToggleAutoPlay={() =>
          readMode === "scroll"
            ? toggleScrollAutoPlay()
            : setAutoPlay((p) => !p)
        }
        onPrevChapter={() =>
          prevChapter &&
          router.push(
            `/series/${seriesSlug}/read?chapter=${prevChapter.number}`,
          )
        }
        onNextChapter={() =>
          nextChapter &&
          router.push(
            `/series/${seriesSlug}/read?chapter=${nextChapter.number}`,
          )
        }
      />

      {readMode === "scroll" && scrollAutoPlayUnavailable && (
        <div className="absolute bottom-28 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="rounded-full bg-card border border-border px-4 py-2 text-xs text-muted-foreground shadow-sm">
            Not enough to scroll in this chapter
          </div>
        </div>
      )}

      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        readMode={readMode}
        onReadMode={setReadMode}
        autoInterval={autoInterval}
        onAutoInterval={setAutoInterval}
      />

      <PageListSheet
        open={showPageList}
        onOpenChange={setShowPageList}
        pages={chapter.pages}
        currentPage={currentPage}
        chapterNumber={chapter.number}
        onGoTo={goTo}
      />
    </div>
  );
}
