"use client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  current: number;
  total: number;
  visible: boolean;
}

export function PagePill({ current, total, visible }: Props) {
  return (
    <AnimatePresence>
      {!visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="px-3.5 py-1.5 rounded-full text-xs font-mono tabular-nums backdrop-blur-md border border-border bg-background/90 text-muted-foreground shadow-lg">
            {current + 1} <span className="opacity-40">/</span> {total}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
