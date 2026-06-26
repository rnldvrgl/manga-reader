import fs from "fs";
import path from "path";

const CHAPTERS_DIR = path.join(process.cwd(), "public", "chapters");

export interface Chapter {
	number: number;
	slug: string; // e.g. "chapter-7"
	pages: string[]; // public-relative paths e.g. "/chapters/chapter-7/1.webp"
}

export function getChapterList(): Chapter[] {
	if (!fs.existsSync(CHAPTERS_DIR)) return [];

	const dirs = fs
		.readdirSync(CHAPTERS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.filter((name) => /^chapter-\d+$/i.test(name))
		.sort((a, b) => chapterNum(a) - chapterNum(b));

	return dirs.map((slug) => {
		const num = chapterNum(slug);
		const pages = getPages(slug);
		return { number: num, slug, pages };
	});
}

export function getChapter(slug: string): Chapter | null {
	const chapterPath = path.join(CHAPTERS_DIR, slug);
	if (!fs.existsSync(chapterPath)) return null;

	return {
		number: chapterNum(slug),
		slug,
		pages: getPages(slug),
	};
}

function getPages(slug: string): string[] {
	const dir = path.join(CHAPTERS_DIR, slug);
	return fs
		.readdirSync(dir)
		.filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
		.sort(naturalSort)
		.map((f) => `/chapters/${slug}/${f}`);
}

function chapterNum(slug: string): number {
	return parseInt(slug.replace(/\D/g, ""), 10);
}

function naturalSort(a: string, b: string): number {
	const numA = parseInt(a, 10);
	const numB = parseInt(b, 10);
	if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
	return a.localeCompare(b);
}
