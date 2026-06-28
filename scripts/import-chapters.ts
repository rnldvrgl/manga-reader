/**
 * Bulk chapter importer.
 *
 * Usage:
 *   pnpm tsx scripts/import-chapters.ts ./imports
 *   pnpm tsx scripts/import-chapters.ts ./imports --series-only one-piece
 *   pnpm tsx scripts/import-chapters.ts ./imports --dry-run
 *
 * Folder convention:
 *   <root>/<series-slug>/chapter-<number>/<page images, any order/naming>
 *
 * Example:
 *   imports/
 *     one-piece/
 *       chapter-12/
 *         001.jpg
 *         002.jpg
 *       chapter-13.5/        <- decimals allowed (e.g. "13.5")
 *         001.png
 *
 * Notes:
 * - Page images are sorted "naturally" so 1,2,...,10,11 (not 1,10,11,2,...).
 * - If a chapter already exists for that series+number, it is skipped
 *   (use --force to re-import and replace its pages).
 * - Series must already exist (matched by folder name == series slug).
 *   Use --create-series to auto-create missing series with sane defaults.
 */

import path from "path";
import fs from "fs/promises";
import { getPayload } from "payload";
import config from "../payload.config";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
]);

type CliArgs = {
  root: string;
  dryRun: boolean;
  force: boolean;
  createSeries: boolean;
  onlySeries?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const [root, ...rest] = argv;
  if (!root) {
    console.error(
      "Usage: tsx scripts/import-chapters.ts <root-folder> [--dry-run] [--force] [--create-series] [--series-only <slug>]",
    );
    process.exit(1);
  }
  const args: CliArgs = {
    root: path.resolve(root),
    dryRun: rest.includes("--dry-run"),
    force: rest.includes("--force"),
    createSeries: rest.includes("--create-series"),
  };
  const onlyIdx = rest.indexOf("--series-only");
  if (onlyIdx !== -1) args.onlySeries = rest[onlyIdx + 1];
  return args;
}

/** Natural sort so "page2.jpg" comes before "page10.jpg". */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Parses "chapter-12" or "chapter-13.5" -> 12 or 13.5 */
function parseChapterNumber(folderName: string): number | null {
  const match = folderName.match(/^chapter-(\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  return parseFloat(match[1]);
}

async function listImageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter(
      (e) =>
        e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()),
    )
    .map((e) => e.name)
    .sort(naturalCompare);
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await getPayload({ config });

  const seriesFolders = (
    await fs.readdir(args.root, { withFileTypes: true })
  ).filter((e) => e.isDirectory());

  let totalChaptersCreated = 0;
  let totalChaptersSkipped = 0;
  let totalImagesUploaded = 0;

  for (const seriesDirEnt of seriesFolders) {
    const seriesSlug = seriesDirEnt.name;
    if (args.onlySeries && args.onlySeries !== seriesSlug) continue;

    const seriesDirPath = path.join(args.root, seriesSlug);

    // ── Resolve series doc ────────────────────────────────────────────
    const existing = await payload.find({
      collection: "series",
      where: { slug: { equals: seriesSlug } },
      limit: 1,
    });

    let seriesId: string;
    if (existing.docs.length > 0) {
      seriesId = existing.docs[0].id as string;
    } else if (args.createSeries) {
      console.log(
        `[series] creating new series "${seriesSlug}" (--create-series)`,
      );
      if (args.dryRun) {
        seriesId = "DRY_RUN_SERIES_ID";
      } else {
        const created = await payload.create({
          collection: "series",
          data: {
            title: seriesSlug
              .split("-")
              .map((w) => w[0]?.toUpperCase() + w.slice(1))
              .join(" "),
            slug: seriesSlug,
            type: "manga",
            status: "ongoing",
            _status: "published",
          },
        });
        seriesId = created.id as string;
      }
    } else {
      console.warn(
        `[skip] No series found for slug "${seriesSlug}". Create it first in the admin, or rerun with --create-series.`,
      );
      continue;
    }

    // ── Walk chapter folders ────────────────────────────────────────────
    const chapterFolders = (
      await fs.readdir(seriesDirPath, { withFileTypes: true })
    ).filter((e) => e.isDirectory());

    for (const chapterDirEnt of chapterFolders) {
      const chapterNumber = parseChapterNumber(chapterDirEnt.name);
      if (chapterNumber === null) {
        console.warn(
          `[skip] "${chapterDirEnt.name}" doesn't match "chapter-<number>", skipping.`,
        );
        continue;
      }

      const chapterDirPath = path.join(seriesDirPath, chapterDirEnt.name);
      const imageFiles = await listImageFiles(chapterDirPath);

      if (imageFiles.length === 0) {
        console.warn(
          `[skip] "${seriesSlug}/${chapterDirEnt.name}" has no image files.`,
        );
        continue;
      }

      // ── Already exists? ───────────────────────────────────────────────
      const existingChapter = await payload.find({
        collection: "chapters",
        where: {
          and: [
            { series: { equals: seriesId } },
            { number: { equals: chapterNumber } },
          ],
        },
        limit: 1,
      });

      if (existingChapter.docs.length > 0 && !args.force) {
        console.log(
          `[skip] ${seriesSlug} chapter ${chapterNumber} already exists (use --force to replace).`,
        );
        totalChaptersSkipped++;
        continue;
      }

      console.log(
        `[import] ${seriesSlug} chapter ${chapterNumber}: ${imageFiles.length} pages` +
          (args.dryRun ? " (dry-run, not uploading)" : ""),
      );

      if (args.dryRun) {
        imageFiles.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
        totalChaptersCreated++;
        continue;
      }

      // ── Upload each page image to media, in order ──────────────────────
      const pageMediaIds: string[] = [];
      for (const fileName of imageFiles) {
        const filePath = path.join(chapterDirPath, fileName);
        const mediaDoc = await payload.create({
          collection: "media",
          data: { alt: `${seriesSlug} ch.${chapterNumber} - ${fileName}` },
          filePath,
        });
        pageMediaIds.push(mediaDoc.id as string);
        totalImagesUploaded++;
      }

      const pagesData = pageMediaIds.map((id) => ({ image: id }));

      if (existingChapter.docs.length > 0 && args.force) {
        await payload.update({
          collection: "chapters",
          id: existingChapter.docs[0].id,
          data: { pages: pagesData },
        });
        console.log(`    -> replaced pages on existing chapter doc.`);
      } else {
        await payload.create({
          collection: "chapters",
          data: {
            series: seriesId,
            number: chapterNumber,
            pages: pagesData,
            _status: "published",
            publishedAt: new Date().toISOString(),
          },
        });
      }

      totalChaptersCreated++;
    }
  }

  console.log("\n── Done ──────────────────────────────");
  console.log(`Chapters created/updated: ${totalChaptersCreated}`);
  console.log(`Chapters skipped:         ${totalChaptersSkipped}`);
  console.log(`Images uploaded:          ${totalImagesUploaded}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
