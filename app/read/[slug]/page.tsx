import { notFound } from "next/navigation";
import { getChapter, getChapterList } from "@/lib/chapters";
import MangaReader from "@/components/MangaReader";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ slug: string }>;
}

export default async function ReadPage({ params }: Props) {
	const { slug } = await params;
	const chapter = getChapter(slug);
	if (!chapter) notFound();

	const allChapters = getChapterList();
	const currentIndex = allChapters.findIndex((c) => c.slug === slug);
	const prev = allChapters[currentIndex - 1] ?? null;
	const next = allChapters[currentIndex + 1] ?? null;

	return (
		<MangaReader
			chapter={chapter}
			prevChapter={prev ? { slug: prev.slug, number: prev.number } : null}
			nextChapter={next ? { slug: next.slug, number: next.number } : null}
		/>
	);
}
