import Link from "next/link";
import Image from "next/image";
import { getSeriesList } from "@/lib/series";
import { BookMarked, BookOpen, Layers, Clock, Hash } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Series } from "@/lib/series";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const seriesList = await getSeriesList();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
              Manga
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground/60 tabular-nums">
              {seriesList.length} series
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {seriesList.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Featured: first series ──────────────────────────────────── */}
            <FeaturedSeries series={seriesList[0]} />

            {/* ── Stats ──────────────────────────────────────────────────── */}
            <StatsRow count={seriesList.length} />

            {/* ── All series grid ─────────────────────────────────────────── */}
            {seriesList.length > 1 && (
              <section>
                <Label text="All series" />
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {seriesList.map((s) => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeaturedSeries({ series }: { series: Series }) {
  return (
    <section>
      <Label text="Featured" />
      <Link
        href={`/series/${series.slug}`}
        className="group mt-3 flex rounded-2xl overflow-hidden border border-border hover:border-foreground/30 transition-all duration-200 bg-card"
      >
        {/* Cover */}
        <div className="relative w-28 shrink-0 aspect-[2/3]">
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
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <BookOpen className="w-6 h-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between p-4 min-w-0 flex-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
              {series.type} · {series.status}
            </p>
            <p className="text-xl font-black tracking-tight text-foreground leading-tight line-clamp-2">
              {series.title}
            </p>
            {series.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {series.description}
              </p>
            )}
            {series.genres && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                {series.genres}
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 self-start mt-4 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold transition-transform duration-200 group-hover:scale-105">
            Read now
          </div>
        </div>
      </Link>
    </section>
  );
}

function SeriesCard({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-border hover:border-foreground/30 bg-card transition-all duration-200"
    >
      {series.coverImage ? (
        <Image
          src={series.coverImage.url}
          alt={series.title}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
          sizes="(max-width: 640px) 30vw, 160px"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <BookOpen className="w-5 h-5 text-muted-foreground/30" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-6 pb-2 px-2">
        <p className="text-white text-xs font-bold leading-tight line-clamp-2">
          {series.title}
        </p>
        <p className="text-white/50 text-[9px] font-mono capitalize">
          {series.type}
        </p>
      </div>
    </Link>
  );
}

function StatsRow({ count }: { count: number }) {
  const stats: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }[] = [
    { icon: <Hash className="w-3.5 h-3.5" />, label: "Series", value: count },
    {
      icon: <BookOpen className="w-3.5 h-3.5" />,
      label: "Type",
      value: "Manga",
    },
    {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: "Updated",
      value: "Today",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-1.5 p-3 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {stat.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className="text-lg font-black tabular-nums text-foreground leading-none">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {text}
    </p>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center gap-6">
      <div className="w-16 h-16 rounded-2xl border border-border bg-card flex items-center justify-center">
        <Layers className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold text-foreground">No series yet</p>
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
