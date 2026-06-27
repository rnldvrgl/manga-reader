import Link from "next/link";
import Image from "next/image";
import { getSeriesList } from "@/lib/series";
import { BookOpen, Layers, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Series } from "@/lib/series";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const seriesList = await getSeriesList();
  const featured = seriesList.slice(0, 3);
  const rest = seriesList.slice(3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold tracking-widest uppercase text-foreground">
              Manga
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {seriesList.length} series
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {seriesList.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero — horizontal scroll of featured covers */}
            <section>
              <SectionLabel
                icon={<TrendingUp className="w-3 h-3" />}
                text="Featured"
              />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((s, i) => (
                  <FeaturedCard key={s.id} series={s} priority={i === 0} />
                ))}
              </div>
            </section>

            {rest.length > 0 && (
              <>
                <Separator />
                <section>
                  <SectionLabel
                    icon={<Layers className="w-3 h-3" />}
                    text="All series"
                  />
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {seriesList.map((s) => (
                      <SeriesCard key={s.id} series={s} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
        {text}
      </span>
    </div>
  );
}

function FeaturedCard({
  series,
  priority,
}: {
  series: Series;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-foreground/20 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative w-full aspect-[3/2] overflow-hidden bg-muted">
        {series.coverImage ? (
          <Image
            src={series.coverImage.url}
            alt={series.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {series.status}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {series.type}
        </p>
        <h2 className="text-sm font-bold leading-snug line-clamp-1 text-foreground">
          {series.title}
        </h2>
        {series.genres && (
          <p className="text-[10px] text-muted-foreground/60 font-mono truncate">
            {series.genres}
          </p>
        )}
        {series.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-0.5">
            {series.description}
          </p>
        )}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            Read now →
          </span>
        </div>
      </div>
    </Link>
  );
}

function SeriesCard({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-border hover:border-foreground/20 bg-card transition-all duration-200"
    >
      {series.coverImage ? (
        <Image
          src={series.coverImage.url}
          alt={series.title}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 160px"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <BookOpen className="w-5 h-5 text-muted-foreground/30" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent pt-8 pb-2 px-2">
        <p className="text-foreground text-[11px] font-bold leading-tight line-clamp-2">
          {series.title}
        </p>
        <p className="text-muted-foreground text-[9px] font-mono capitalize mt-0.5">
          {series.type}
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
      <div className="w-16 h-16 rounded-2xl border border-border bg-card flex items-center justify-center">
        <Layers className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <div className="space-y-2">
        <p className="text-base font-bold">No series yet</p>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Add your first series in the{" "}
          <Link
            href="/admin"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            admin panel
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
