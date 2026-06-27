import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSeries, getChapterList } from "@/lib/series";
import { BookOpen, ArrowLeft, Hash, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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

  const latestChapter = chapters[chapters.length - 1];
  const firstChapter = chapters[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full shrink-0 -ml-1"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="text-sm font-bold truncate">{series.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero — wide cover + info */}
        <section className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="relative w-full sm:w-44 shrink-0 aspect-[2/3] sm:aspect-auto rounded-2xl overflow-hidden border border-border bg-muted self-start">
            {series.coverImage ? (
              <Image
                src={series.coverImage.url}
                alt={series.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, 176px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider font-bold"
                >
                  {series.type}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wider font-bold"
                >
                  {series.status}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.genres && (
                <p className="text-xs font-mono text-muted-foreground/70">
                  {series.genres}
                </p>
              )}
              {series.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {series.description}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  {chapters.length} chapters
                </span>
              </div>
              {latestChapter && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono">
                    Ch.{latestChapter.number} latest
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            {firstChapter && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button asChild className="rounded-xl font-bold">
                  <Link
                    href={`/series/${slug}/read?chapter=${firstChapter.number}`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start reading
                  </Link>
                </Button>
                {latestChapter &&
                  latestChapter.number !== firstChapter.number && (
                    <Button
                      variant="outline"
                      asChild
                      className="rounded-xl font-bold"
                    >
                      <Link
                        href={`/series/${slug}/read?chapter=${latestChapter.number}`}
                      >
                        Latest — Ch.{latestChapter.number}
                      </Link>
                    </Button>
                  )}
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Chapter list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Chapters
            </p>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              {chapters.length} total
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border border-border rounded-2xl">
              <BookOpen className="w-6 h-6 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No chapters yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
              {[...chapters].reverse().map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/series/${slug}/read?chapter=${chapter.number}`}
                  className="flex items-center gap-4 px-4 py-3.5 bg-card hover:bg-accent transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground/50 w-10 shrink-0 tabular-nums text-right">
                    #{chapter.number}
                  </span>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">
                    {chapter.title || `Chapter ${chapter.number}`}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground/40 font-mono">
                      {chapter.pages.length}p
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
