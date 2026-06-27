import { notFound } from "next/navigation";
import { getChapter, getChapterList } from "@/lib/series";
import MangaReader from "@/components/MangaReader";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReadPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { chapter: chapterParam } = await searchParams;
  const chapterNumber = chapterParam ? parseInt(chapterParam, 10) : 1;

  const [chapter, allChapters] = await Promise.all([
    getChapter(slug, chapterNumber),
    getChapterList(slug),
  ]);

  if (!chapter) notFound();

  const currentIndex = allChapters.findIndex((c) => c.number === chapterNumber);
  const prev = allChapters[currentIndex - 1] ?? null;
  const next = allChapters[currentIndex + 1] ?? null;

  return (
    <MangaReader
      chapter={chapter}
      seriesSlug={slug}
      prevChapter={prev ? { number: prev.number } : null}
      nextChapter={next ? { number: next.number } : null}
    />
  );
}
