"use client";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { CountdownRing } from "./CountdownRing";

interface Props {
  visible: boolean;
  currentPage: number;
  totalPages: number;
  progress: number;
  autoPlay: boolean;
  countdown: number;
  autoInterval: number;
  hasPrev: boolean;
  hasNext: boolean;
  onGoTo: (page: number) => void;
  onToggleAutoPlay: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export function ReaderBottomBar({
  visible,
  currentPage,
  totalPages,
  progress,
  autoPlay,
  countdown,
  autoInterval,
  hasPrev,
  hasNext,
  onGoTo,
  onToggleAutoPlay,
  onPrevChapter,
  onNextChapter,
}: Props) {
  return (
    <motion.div
      initial={false}
      animate={visible ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="absolute bottom-0 inset-x-0 z-30"
    >
      <div className="bg-gradient-to-t from-background via-background/70 to-transparent pt-12 pb-safe">
        <div className="max-w-lg mx-auto px-4 sm:px-6 pb-6 space-y-4">
          {/* Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground/60 w-4 text-right shrink-0">
              1
            </span>
            <Slider
              min={0}
              max={totalPages - 1}
              step={1}
              value={[currentPage]}
              onValueChange={([v]) => onGoTo(v)}
              className="flex-1"
              aria-label="Page scrubber"
            />
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground/60 w-4 shrink-0">
              {totalPages}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasPrev}
              onClick={onPrevChapter}
              className="rounded-full w-10 h-10"
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground/50">
                {currentPage + 1} / {totalPages}
              </span>
              <div className="relative w-10 h-10 flex items-center justify-center">
                {autoPlay && (
                  <CountdownRing seconds={countdown} total={autoInterval} />
                )}
                <Button
                  variant={autoPlay ? "default" : "ghost"}
                  size="icon"
                  onClick={onToggleAutoPlay}
                  aria-label={autoPlay ? "Pause" : "Auto-play"}
                  className="rounded-full w-10 h-10 relative z-10"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={autoPlay ? "pause" : "play"}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                    >
                      {autoPlay ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </div>
              <AnimatePresence mode="wait">
                {autoPlay && (
                  <motion.span
                    key="cd"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[11px] font-mono text-muted-foreground/50 tabular-nums"
                  >
                    {countdown}s
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={!hasNext}
              onClick={onNextChapter}
              className="rounded-full w-10 h-10"
              aria-label="Next chapter"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress line */}
          <div className="h-px rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full bg-foreground/50 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
