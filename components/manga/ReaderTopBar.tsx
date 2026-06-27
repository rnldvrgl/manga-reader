"use client";
import Link from "next/link";
import { ArrowLeft, Settings2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ModeToggle } from "../ModeToggle";

interface Props {
  visible: boolean;
  chapterNumber: number;
  chapterTitle?: string;
  seriesSlug: string;
  onSettings: () => void;
  onPageList: () => void;
}

export function ReaderTopBar({
  visible,
  chapterNumber,
  chapterTitle,
  seriesSlug,
  onSettings,
  onPageList,
}: Props) {
  return (
    <motion.div
      initial={false}
      animate={visible ? { y: 0, opacity: 1 } : { y: "-100%", opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="absolute top-0 inset-x-0 z-30"
    >
      <div className="bg-gradient-to-b from-background via-background/70 to-transparent pb-12">
        <div className="flex items-center gap-2 px-3 sm:px-4 h-14 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full shrink-0"
          >
            <Link href={`/series/${seriesSlug}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-xs font-semibold tracking-wide truncate text-muted-foreground">
              Ch.{chapterNumber}
              {chapterTitle && (
                <span className="font-normal"> · {chapterTitle}</span>
              )}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="rounded-full shrink-0"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPageList}
            className="rounded-full shrink-0"
            aria-label="Page list"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </motion.div>
  );
}
