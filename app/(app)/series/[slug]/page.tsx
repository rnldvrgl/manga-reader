import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSeries, getChapterList } from "@/lib/series";
import { BookOpen, ArrowLeft, BookMarked, Clock, Hash } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const [series, chapters] = await Promise.all([
    getSeries(slug),
    getChapterList(slug),
  ]);

  if (!series) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <BookMarked className="w-4 h-4" />
            <span className="text-sm font-bold tracking-widest uppercase">
              Manga
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* ── Series Info ─────────────────────────────────────────────────── */}
        <section className="flex gap-4">
          {/* Cover */}
          <div className="relative w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-border bg-muted">
            {series.coverImage ? (
              <Image
                src={series.coverImage.url}
                alt={series.title}
                fill
                className="object-cover"
                priority
                sizes="112px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {series.type} · {series.status}
              </p>
              <h1 className="text-xl font-black tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.genres && (
                <p className="text-[10px] font-mono text-muted-foreground/60">
                  {series.genres}
                </p>
              )}
              {series.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {series.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span className="text-xs font-bold">
                  {chapters.length} chapters
                </span>
              </div>
              {chapters.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-mono">
                    Ch.{chapters[chapters.length - 1].number} latest
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Start Reading CTA ───────────────────────────────────────────── */}
        {chapters.length > 0 && (
          <Link
            href={`/series/${slug}/read?chapter=${chapters[0].number}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            Start Reading — Chapter {chapters[0].number}
          </Link>
        )}

        {/* ── Chapter List ─────────────────────────────────────────────────── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Chapters
          </p>

          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border border-border rounded-xl">
              <BookOpen className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No chapters yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {[...chapters].reverse().map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/series/${slug}/read?chapter=${chapter.number}`}
                  className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                      #{chapter.number}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {chapter.title
                        ? chapter.title
                        : `Chapter ${chapter.number}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                    {chapter.pages.length}p
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
