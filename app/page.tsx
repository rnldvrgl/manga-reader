// app/page.tsx — SERVER COMPONENT (no "use client")
import Link from "next/link";
import Image from "next/image";
import { getChapterList } from "@/lib/chapters";
import { BookMarked, BookOpen, Layers, Clock, Hash } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-static";

export default function HomePage() {
	const chapters = getChapterList();
	const latest = chapters[chapters.length - 1] ?? null;
	const rest = chapters.slice(0, -1).reverse(); // all but latest, newest first

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* ── Header ─────────────────────────────────────────────────────────── */}
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
							{chapters.length} ch
						</span>
						<ThemeToggle />
					</div>
				</div>
			</header>

			<main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
				{chapters.length === 0 ? (
					<EmptyState />
				) : (
					<>
						{/* ── Hero: latest chapter ──────────────────────────────────── */}
						{latest && (
							<section>
								<Label text="Latest chapter" />
								<Link
									href={`/read/${latest.slug}`}
									className="group mt-3 flex rounded-2xl overflow-hidden border border-border hover:border-foreground/30 transition-all duration-200 bg-card"
								>
									{/* Cover */}
									<div className="relative w-28 shrink-0 aspect-[2/3]">
										{latest.pages[0] ? (
											<Image
												src={latest.pages[0]}
												alt={`Chapter ${latest.number}`}
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
												Chapter
											</p>
											<p className="text-2xl font-black tracking-tight text-foreground leading-none">
												{latest.number}
											</p>
											<p className="text-xs text-muted-foreground mt-2 font-mono">
												{latest.pages.length} pages
											</p>
										</div>
										<div className="inline-flex items-center gap-1.5 self-start mt-4 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold transition-transform duration-200 group-hover:scale-105">
											Read now
										</div>
									</div>
								</Link>
							</section>
						)}

						{/* ── Stats row ─────────────────────────────────────────────── */}
						<div className="grid grid-cols-3 gap-2">
							{[
								{
									icon: <Hash className="w-3.5 h-3.5" />,
									label: "Chapters",
									value: chapters.length,
								},
								{
									icon: <BookOpen className="w-3.5 h-3.5" />,
									label: "Pages",
									value: chapters.reduce(
										(s, c) => s + c.pages.length,
										0,
									),
								},
								{
									icon: <Clock className="w-3.5 h-3.5" />,
									label: "Est. read",
									value:
										Math.round(
											(chapters.reduce(
												(s, c) => s + c.pages.length,
												0,
											) *
												20) /
												60,
										) + "m",
								},
							].map((stat) => (
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

						{/* ── All chapters grid ──────────────────────────────────────── */}
						{chapters.length > 1 && (
							<section>
								<Label text="All chapters" />
								<div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
									{[...chapters].reverse().map((ch) => (
										<Link
											key={ch.slug}
											href={`/read/${ch.slug}`}
											className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-border hover:border-foreground/30 bg-card transition-all duration-200"
										>
											{ch.pages[0] ? (
												<Image
													src={ch.pages[0]}
													alt={`Ch. ${ch.number}`}
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
											{/* Gradient label */}
											<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-6 pb-2 px-2">
												<p className="text-white text-xs font-bold leading-tight">
													Ch. {ch.number}
												</p>
												<p className="text-white/50 text-[9px] font-mono">
													{ch.pages.length}p
												</p>
											</div>
										</Link>
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

// ── Small helpers ─────────────────────────────────────────────────────────────
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
				<p className="text-base font-bold text-foreground">
					No chapters yet
				</p>
				<p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
					Drop chapter folders into{" "}
					<code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
						public/chapters/
					</code>{" "}
					and they'll appear here.
				</p>
			</div>
			<pre className="text-[11px] font-mono text-muted-foreground bg-muted border border-border rounded-xl px-5 py-4 text-left leading-6 max-w-xs w-full">
				{`public/chapters/
├── chapter-1/
│   ├── 001.webp
│   └── 002.webp
└── chapter-2/
    └── ...`}
			</pre>
		</div>
	);
}
