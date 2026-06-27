"use client";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pages: string[];
  currentPage: number;
  chapterNumber: number;
  onGoTo: (page: number) => void;
}

export function PageListSheet({
  open,
  onOpenChange,
  pages,
  currentPage,
  chapterNumber,
  onGoTo,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-64 sm:w-72 p-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader className="px-4 py-4 border-b border-border flex-row items-center justify-between shrink-0 space-y-0">
          <SheetTitle className="text-sm font-bold">
            Ch.{chapterNumber}
            <span className="ml-1.5 font-normal text-muted-foreground">
              · {pages.length}p
            </span>
          </SheetTitle>
          <Badge variant="secondary" className="font-mono text-xs tabular-nums">
            {currentPage + 1}/{pages.length}
          </Badge>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {pages.map((src, i) => (
              <motion.button
                key={src}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  onGoTo(i);
                  onOpenChange(false);
                }}
                className={cn(
                  "relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all duration-150",
                  i === currentPage
                    ? "border-foreground shadow-md"
                    : "border-transparent opacity-50 hover:opacity-90 hover:border-border",
                )}
                aria-label={`Page ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`Thumb ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />
                <span className="absolute bottom-0 inset-x-0 text-center text-[9px] py-1 font-mono text-foreground bg-background/70 backdrop-blur-sm">
                  {i + 1}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
