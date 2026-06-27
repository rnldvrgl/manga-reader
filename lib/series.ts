const BASE = process.env.PAYLOAD_URL ?? "http://localhost:3000";

interface PayloadMedia {
  id: string;
  url: string;
  filename: string;
  alt?: string;
}

interface PayloadPage {
  id: string;
  image: PayloadMedia;
}

interface PayloadChapterRaw {
  id: string;
  number: number;
  title?: string;
  pages: PayloadPage[];
  series: PayloadSeriesRaw | string;
  _status: "published" | "draft";
  publishedAt?: string;
}

interface PayloadSeriesRaw {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: PayloadMedia;
  type: "manga" | "manhwa" | "manhua";
  status: "ongoing" | "completed" | "hiatus";
  genres?: string;
  _status: "published" | "draft";
}

interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

// ── Public types used by Next.js pages / components ───────────────────────────

export interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: { url: string };
  type: "manga" | "manhwa" | "manhua";
  status: "ongoing" | "completed" | "hiatus";
  genres?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title?: string;
  /** Generated client-side slug e.g. "chapter-7" */
  slug: string;
  /** Flat array of R2 image URLs in page order */
  pages: string[];
  seriesSlug: string;
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function payloadFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Normalise helpers ─────────────────────────────────────────────────────────

function normaliseSeries(raw: PayloadSeriesRaw): Series {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    coverImage: raw.coverImage ? { url: raw.coverImage.url } : undefined,
    type: raw.type,
    status: raw.status,
    genres: raw.genres,
  };
}

function normaliseChapter(raw: PayloadChapterRaw, seriesSlug: string): Chapter {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    slug: `chapter-${raw.number}`,
    seriesSlug,
    pages: raw.pages
      .map((p) => p.image?.url)
      .filter((url): url is string => Boolean(url)),
  };
}

// ── Series API ────────────────────────────────────────────────────────────────

export async function getSeriesList(): Promise<Series[]> {
  const data = await payloadFetch<PayloadListResponse<PayloadSeriesRaw>>(
    "/series?where[_status][equals]=published&limit=100&sort=title",
  );
  return (data?.docs ?? []).map(normaliseSeries);
}

export async function getSeries(slug: string): Promise<Series | null> {
  const data = await payloadFetch<PayloadListResponse<PayloadSeriesRaw>>(
    `/series?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
  );
  const raw = data?.docs?.[0];
  return raw ? normaliseSeries(raw) : null;
}

// ── Chapter API ───────────────────────────────────────────────────────────────

export async function getChapterList(seriesSlug: string): Promise<Chapter[]> {
  const series = await getSeries(seriesSlug);
  if (!series) return [];

  const data = await payloadFetch<PayloadListResponse<PayloadChapterRaw>>(
    `/chapters?where[series][equals]=${series.id}&where[_status][equals]=published&sort=number&limit=500`,
  );
  return (data?.docs ?? []).map((ch) => normaliseChapter(ch, seriesSlug));
}

export async function getChapter(
  seriesSlug: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  const series = await getSeries(seriesSlug);
  if (!series) return null;

  const data = await payloadFetch<PayloadListResponse<PayloadChapterRaw>>(
    `/chapters?where[series][equals]=${series.id}&where[number][equals]=${chapterNumber}&limit=1`,
  );
  const raw = data?.docs?.[0];
  return raw ? normaliseChapter(raw, seriesSlug) : null;
}

// ── generateStaticParams helpers ──────────────────────────────────────────────

/** For app/[series]/page.tsx → generateStaticParams */
export async function getAllSeriesParams(): Promise<{ series: string }[]> {
  const list = await getSeriesList();
  return list.map((s) => ({ series: s.slug }));
}

/** For app/[series]/[chapter]/page.tsx → generateStaticParams */
export async function getAllChapterParams(): Promise<
  { series: string; chapter: string }[]
> {
  const seriesList = await getSeriesList();
  const results = await Promise.all(
    seriesList.map(async (s) => {
      const chapters = await getChapterList(s.slug);
      return chapters.map((ch) => ({ series: s.slug, chapter: ch.slug }));
    }),
  );
  return results.flat();
}
