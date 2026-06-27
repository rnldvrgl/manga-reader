"use client";
import { Check, BookOpen, AlignJustify, Columns2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ReadMode = "snap" | "scroll" | "book";
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
    description: "Tap to flip",
  },
  {
    value: "scroll",
    label: "Scroll",
    icon: <AlignJustify className="w-4 h-4" />,
    description: "Continuous",
  },
  {
    value: "book",
    label: "Book",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Two-page spread",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  readMode: ReadMode;
  onReadMode: (m: ReadMode) => void;
  autoInterval: AutoInterval;
  onAutoInterval: (s: AutoInterval) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  readMode,
  onReadMode,
  autoInterval,
  onAutoInterval,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-w-lg mx-auto px-6 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-sm font-bold">Reader Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reading Mode
          </p>
          <div className="grid grid-cols-3 gap-2">
            {READ_MODES.map((m) => {
              const active = readMode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => onReadMode(m.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl border-2 transition-all duration-150 text-center",
                    active
                      ? "border-foreground bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-2 right-2 text-foreground"
                      >
                        <Check className="w-3 h-3" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span
                    className={cn(
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {m.icon}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {m.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Auto-play Speed
          </p>
          <div className="grid grid-cols-4 gap-2">
            {AUTO_INTERVALS.map((s) => {
              const active = autoInterval === s;
              return (
                <button
                  key={s}
                  onClick={() => onAutoInterval(s)}
                  className={cn(
                    "py-3 rounded-xl border-2 text-sm font-mono font-bold transition-all duration-150",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  {s}s
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
